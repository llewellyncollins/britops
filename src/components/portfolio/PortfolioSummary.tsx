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
    <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
      <table className="w-full text-sm border-collapse">
        <caption className="sr-only">Procedure log — operations by specialty, category and involvement level</caption>
        <thead>
          <tr className="bg-primary text-white">
            <th scope="col" className="text-left px-3 py-2.5 font-semibold">Procedure</th>
            <th scope="col" className="px-3 py-2.5 font-semibold text-center w-16">Total</th>
            <th scope="col" className="px-3 py-2.5 font-semibold text-center w-16 opacity-80">
              <abbr title="Assistant" className="no-underline">Asst</abbr>
            </th>
            <th scope="col" className="px-3 py-2.5 font-semibold text-center w-16 opacity-80">
              <abbr title="Supervised" className="no-underline">Supv</abbr>
            </th>
            <th scope="col" className="px-3 py-2.5 font-semibold text-center w-16 text-amber-300">
              <abbr title="Independent" className="no-underline">Indep</abbr>
            </th>
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
                {/* Specialty row — solid navy strip */}
                <tr className="bg-primary/15 border-t-2 border-primary/40">
                  <th
                    scope="rowgroup"
                    className="px-3 py-2 font-bold text-heading text-xs uppercase tracking-widest text-left"
                  >
                    {specialty}
                  </th>
                  <td className="px-3 py-2 text-center font-bold text-heading">{spTotal}</td>
                  <td className="px-3 py-2 text-center text-text">{spAsst || '–'}</td>
                  <td className="px-3 py-2 text-center text-text">{spSupv || '–'}</td>
                  <td className="px-3 py-2 text-center font-semibold text-success">{spIndep || '–'}</td>
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
                      <tr className="bg-surface border-t border-border">
                        <th
                          scope="row"
                          className="px-3 py-1.5 pl-6 text-xs font-semibold text-text-muted uppercase tracking-wide text-left"
                        >
                          {cat}
                        </th>
                        <td className="px-3 py-1.5 text-center text-xs font-medium text-text">{catTotal || '–'}</td>
                        <td className="px-3 py-1.5 text-center text-xs text-text-muted">{catAsst || '–'}</td>
                        <td className="px-3 py-1.5 text-center text-xs text-text-muted">{catSupv || '–'}</td>
                        <td className="px-3 py-1.5 text-center text-xs font-semibold text-success">{catIndep || '–'}</td>
                      </tr>

                      {catRows.map((row, i) => (
                        <tr key={i} className="border-b border-border hover:bg-accent/5 transition-colors">
                          <td className="px-3 py-2 pl-10 text-text">
                            {row.procedure}
                            {row.subcategory && (
                              <span className="ml-1 text-text-muted text-xs">({row.subcategory})</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-heading">{row.total}</td>
                          <td className="px-3 py-2 text-center text-text-muted">{row.assistant || '–'}</td>
                          <td className="px-3 py-2 text-center text-text-muted">{row.supervised || '–'}</td>
                          <td className="px-3 py-2 text-center font-semibold text-success">{row.independent || '–'}</td>
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
