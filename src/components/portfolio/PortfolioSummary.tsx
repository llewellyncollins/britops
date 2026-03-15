import { Fragment } from 'react';
import type { PortfolioRow } from '../../types';

interface Props {
  rows: PortfolioRow[];
  /** If provided, only show rows for this specialty */
  filterSpecialty?: string;
}

export function PortfolioSummary({ rows, filterSpecialty }: Props) {
  const displayRows = filterSpecialty
    ? rows.filter(r => r.specialty === filterSpecialty)
    : rows;

  if (displayRows.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted text-sm">
        No operations logged yet. Log your first operation to see your portfolio.
      </div>
    );
  }

  // Group: specialty → category → rows
  const specialties = [...new Set(displayRows.map(r => r.specialty))].sort();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-primary text-white">
            <th className="text-left px-3 py-2 font-semibold">Procedure</th>
            <th className="px-3 py-2 font-semibold text-center w-16">Total</th>
            <th className="px-3 py-2 font-semibold text-center w-16">Asst</th>
            <th className="px-3 py-2 font-semibold text-center w-16">Supv</th>
            <th className="px-3 py-2 font-semibold text-center w-16">Indep</th>
          </tr>
        </thead>
        <tbody>
          {specialties.map(specialty => {
            const spRows = displayRows.filter(r => r.specialty === specialty);
            const spTotal = spRows.reduce((s, r) => s + r.total, 0);
            const spAsst  = spRows.reduce((s, r) => s + r.assistant, 0);
            const spSupv  = spRows.reduce((s, r) => s + r.supervised, 0);
            const spIndep = spRows.reduce((s, r) => s + r.independent, 0);

            const categories = [...new Set(spRows.map(r => r.category))].sort();

            return (
              <Fragment key={specialty}>
                {/* Specialty row */}
                <tr className="bg-primary/10 border-t-2 border-primary/30">
                  <td className="px-3 py-2 font-bold text-primary text-xs uppercase tracking-wide" colSpan={1}>
                    {specialty}
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-primary">{spTotal}</td>
                  <td className="px-3 py-2 text-center text-primary">{spAsst || '-'}</td>
                  <td className="px-3 py-2 text-center text-primary">{spSupv || '-'}</td>
                  <td className="px-3 py-2 text-center text-primary">{spIndep || '-'}</td>
                </tr>

                {categories.map(cat => {
                  const catRows = spRows.filter(r => r.category === cat);
                  const catTotal = catRows.reduce((s, r) => s + r.total, 0);
                  const catAsst  = catRows.reduce((s, r) => s + r.assistant, 0);
                  const catSupv  = catRows.reduce((s, r) => s + r.supervised, 0);
                  const catIndep = catRows.reduce((s, r) => s + r.independent, 0);

                  return (
                    <Fragment key={cat}>
                      {/* Category sub-header */}
                      <tr className="bg-gray-100 font-semibold">
                        <td className="px-3 py-1.5 pl-6 text-xs text-text-muted uppercase tracking-wide">{cat}</td>
                        <td className="px-3 py-1.5 text-center text-xs">{catTotal || '-'}</td>
                        <td className="px-3 py-1.5 text-center text-xs">{catAsst || '-'}</td>
                        <td className="px-3 py-1.5 text-center text-xs">{catSupv || '-'}</td>
                        <td className="px-3 py-1.5 text-center text-xs">{catIndep || '-'}</td>
                      </tr>

                      {catRows.map((row, i) => (
                        <tr key={i} className="border-b border-border hover:bg-blue-50/50">
                          <td className="px-3 py-1.5 pl-10">
                            {row.procedure}
                            {row.subcategory && (
                              <span className="ml-1 text-text-muted text-xs">({row.subcategory})</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-center font-semibold">{row.total}</td>
                          <td className="px-3 py-1.5 text-center">{row.assistant || '-'}</td>
                          <td className="px-3 py-1.5 text-center">{row.supervised || '-'}</td>
                          <td className="px-3 py-1.5 text-center">{row.independent || '-'}</td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
