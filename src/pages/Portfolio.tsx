import { useState, useMemo, useEffect } from 'react';
import { useOperations } from '../hooks/useOperations';
import { usePortfolio } from '../hooks/usePortfolio';
import { useProcedureTypes } from '../hooks/useProcedureTypes';
import { useSettingsStore } from '../stores/useSettingsStore';
import { PortfolioSummary } from '../components/portfolio/PortfolioSummary';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  trackPageView,
  trackPortfolioDateFilterApplied,
  trackPortfolioDateFilterCleared,
  trackPortfolioSpecialtyFiltered,
  trackPortfolioGradeFiltered,
  trackPortfolioSectionToggled,
} from '../firebase/analytics';

export function Portfolio() {
  const { operations } = useOperations();
  const { allProcedures, specialties } = useProcedureTypes();
  const {
    portfolioShowKpis, setPortfolioShowKpis,
    portfolioShowTimeline, setPortfolioShowTimeline,
    portfolioShowInvolvement, setPortfolioShowInvolvement,
  } = useSettingsStore();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

  useEffect(() => { trackPageView({ page_name: 'Portfolio' }); }, []);

  const availableGrades = useMemo(() => {
    const grades = new Set(operations.filter(op => !op.deleted && op.grade).map(op => op.grade));
    return [...grades].sort();
  }, [operations]);

  const filtered = operations.filter(op => {
    if (op.deleted) return false;
    if (dateFrom && op.date < dateFrom) return false;
    if (dateTo && op.date > dateTo) return false;
    if (filterGrade && op.grade !== filterGrade) return false;
    return true;
  });

  const rows = usePortfolio(filtered, allProcedures);
  const totalOps = filtered.length;

  // KPI derived values
  const independentCount = filtered.filter(op => op.involvement === 'independent').length;
  const supervisedCount = filtered.filter(op => op.involvement === 'supervised').length;
  const assistantCount = filtered.filter(op => op.involvement === 'assistant').length;
  const complicationCount = filtered.filter(
    op => op.intraOpComplications.trim() || op.postOpComplications.trim()
  ).length;
  const mdtCount = filtered.filter(op => op.discussedMDT).length;

  const pct = (n: number) => totalOps > 0 ? `${Math.round(n / totalOps * 100)}%` : '—';

  // Monthly activity chart
  const monthlyData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const op of filtered) {
      const month = op.date.slice(0, 7);
      counts[month] = (counts[month] ?? 0) + 1;
    }
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).slice(-24);
  }, [filtered]);

  const maxMonthCount = Math.max(...monthlyData.map(([, n]) => n), 1);

  function formatMonth(ym: string) {
    const [year, month] = ym.split('-');
    const abbr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${abbr[parseInt(month) - 1]} ${year.slice(2)}`;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Portfolio Summary</h1>

      {/* Date range filter */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Calendar aria-hidden="true" size={16} className="text-accent shrink-0" />
        <label htmlFor="date-from" className="sr-only">From date</label>
        <input
          id="date-from"
          type="date"
          value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); trackPortfolioDateFilterApplied({ has_from: !!e.target.value, has_to: !!dateTo }); }}
          className="input !w-auto text-sm"
        />
        <span className="text-text text-sm shrink-0">to</span>
        <label htmlFor="date-to" className="sr-only">To date</label>
        <input
          id="date-to"
          type="date"
          value={dateTo}
          onChange={e => { setDateTo(e.target.value); trackPortfolioDateFilterApplied({ has_from: !!dateFrom, has_to: !!e.target.value }); }}
          className="input !w-auto text-sm"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); trackPortfolioDateFilterCleared(); }}
            className="text-xs text-accent hover:underline shrink-0"
            aria-label="Clear date filters"
          >
            Clear
          </button>
        )}
        <span
          aria-label={`${totalOps} operations`}
          className="text-sm font-semibold text-heading ml-auto shrink-0"
        >
          {totalOps} ops
        </span>
      </div>

      {/* Specialty + Grade filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-40">
          <label htmlFor="portfolio-specialty" className="block text-sm font-medium text-text mb-1">
            Specialty
          </label>
          <select
            id="portfolio-specialty"
            value={filterSpecialty}
            onChange={e => { setFilterSpecialty(e.target.value); trackPortfolioSpecialtyFiltered({ has_filter: !!e.target.value }); }}
            className="input text-sm"
          >
            <option value="">All specialties</option>
            {specialties.map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>
        {availableGrades.length > 0 && (
          <div className="flex-1 min-w-40">
            <label htmlFor="portfolio-grade" className="block text-sm font-medium text-text mb-1">
              Grade
            </label>
            <select
              id="portfolio-grade"
              value={filterGrade}
              onChange={e => { setFilterGrade(e.target.value); trackPortfolioGradeFiltered({ has_filter: !!e.target.value }); }}
              className="input text-sm"
            >
              <option value="">All grades</option>
              {availableGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <section className="mb-4 border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => { trackPortfolioSectionToggled({ section: 'overview', open: !portfolioShowKpis }); setPortfolioShowKpis(!portfolioShowKpis); }}
          aria-expanded={portfolioShowKpis}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-raised text-sm font-semibold text-text hover:bg-surface transition-colors"
        >
          Overview
          <ChevronDown
            aria-hidden="true"
            size={16}
            className={`text-text-muted transition-transform ${portfolioShowKpis ? '' : '-rotate-90'}`}
          />
        </button>
        {portfolioShowKpis && (
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border border-t border-border">
            {[
              { label: 'Total ops', value: totalOps > 0 ? String(totalOps) : '—' },
              { label: '% Independent', value: pct(independentCount) },
              { label: 'Complication rate', value: pct(complicationCount) },
              { label: 'MDT discussed', value: pct(mdtCount) },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 text-center">
                <p className="text-xl font-bold text-heading">{value}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cases Over Time */}
      <section className="mb-4 border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => { trackPortfolioSectionToggled({ section: 'activity', open: !portfolioShowTimeline }); setPortfolioShowTimeline(!portfolioShowTimeline); }}
          aria-expanded={portfolioShowTimeline}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-raised text-sm font-semibold text-text hover:bg-surface transition-colors"
        >
          Activity
          <ChevronDown
            aria-hidden="true"
            size={16}
            className={`text-text-muted transition-transform ${portfolioShowTimeline ? '' : '-rotate-90'}`}
          />
        </button>
        {portfolioShowTimeline && (
          <div className="p-3 border-t border-border">
            {monthlyData.length < 2 ? (
              <p className="text-sm text-text-muted text-center py-4">
                Log operations across multiple months to see activity trends.
              </p>
            ) : (
              <div className="flex items-end gap-1 h-28 overflow-x-auto pb-1" role="img" aria-label="Cases per month bar chart">
                {monthlyData.map(([month, count]) => (
                  <div key={month} className="flex flex-col items-center gap-0.5 shrink-0" style={{ minWidth: '2.5rem' }}>
                    <span className="text-xs font-medium text-text-muted">{count}</span>
                    <div
                      className="w-full bg-accent rounded-t"
                      style={{ height: `${Math.round(count / maxMonthCount * 72)}px` }}
                    />
                    <span className="text-[10px] text-text-muted whitespace-nowrap">{formatMonth(month)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Involvement Breakdown */}
      {totalOps > 0 && (
        <section className="mb-4 border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => { trackPortfolioSectionToggled({ section: 'involvement', open: !portfolioShowInvolvement }); setPortfolioShowInvolvement(!portfolioShowInvolvement); }}
            aria-expanded={portfolioShowInvolvement}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-raised text-sm font-semibold text-text hover:bg-surface transition-colors"
          >
            Involvement
            <ChevronDown
              aria-hidden="true"
              size={16}
              className={`text-text-muted transition-transform ${portfolioShowInvolvement ? '' : '-rotate-90'}`}
            />
          </button>
          {portfolioShowInvolvement && (
            <div className="p-3 border-t border-border space-y-3">
              {[
                { label: 'Independent', count: independentCount, color: 'bg-success' },
                { label: 'Supervised', count: supervisedCount, color: 'bg-accent' },
                { label: 'Assistant', count: assistantCount, color: 'bg-warning' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-sm text-text-muted w-24 shrink-0">{label}</span>
                  <div className="flex-1 bg-surface rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${Math.round(count / totalOps * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text w-16 text-right shrink-0">
                    {count} ({Math.round(count / totalOps * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <PortfolioSummary rows={rows} filterSpecialty={filterSpecialty || undefined} />
    </div>
  );
}
