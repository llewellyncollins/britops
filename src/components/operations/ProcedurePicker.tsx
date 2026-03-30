import { useState, useRef, useEffect } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import type { ProcedureType } from '../../types';

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
  procedures: ProcedureType[];
}

const TRIGGER_ID = 'procedure-picker-trigger';

export function ProcedurePicker({ selected, onChange, procedures }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const q = search.toLowerCase().trim();
  const filtered = q
    ? procedures.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.specialty.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.subcategory?.toLowerCase().includes(q) ?? false),
      )
    : procedures;

  // Group: specialty → category → procedures
  const specialties = [...new Set(filtered.map(p => p.specialty))].sort();
  const grouped = specialties.map(sp => {
    const spProcs = filtered.filter(p => p.specialty === sp);
    const categories = [...new Set(spProcs.map(p => p.category))];
    return {
      specialty: sp,
      categories: categories.map(cat => ({
        category: cat,
        items: spProcs.filter(p => p.category === cat),
      })),
    };
  });

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(c => c !== id) : [...selected, id]);
  }

  const selectedProcs = selected
    .map(id => procedures.find(p => p.id === id))
    .filter(Boolean) as ProcedureType[];

  return (
    <div ref={ref} className="relative">
      <label htmlFor={TRIGGER_ID} className="block text-sm font-medium text-text mb-1">
        Procedures<span aria-hidden="true" className="text-danger ml-0.5">*</span>
      </label>

      {/* Selected chips + open trigger */}
      <button
        id={TRIGGER_ID}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(!open)}
        className="min-h-[42px] w-full border border-border rounded-lg px-3 py-2 bg-surface-raised text-text cursor-pointer flex flex-wrap gap-1.5 items-center text-left"
      >
        {selectedProcs.length === 0 && (
          <span className="text-text-muted text-sm flex-1">Select procedures...</span>
        )}
        {selectedProcs.map(p => (
          <span key={p.id} className="inline-flex items-center gap-1 bg-blue-100 text-primary text-xs px-2 py-0.5 rounded-full">
            <span className="font-medium">{p.name}</span>
            {p.subcategory && <span className="opacity-70">({p.subcategory})</span>}
            <button
              type="button"
              aria-label={`Remove ${p.name}`}
              onClick={e => { e.stopPropagation(); toggle(p.id); }}
              className="hover:text-danger ml-0.5"
            >
              <X aria-hidden="true" size={12} />
            </button>
          </span>
        ))}
        <ChevronDown
          aria-hidden="true"
          size={16}
          className={`ml-auto text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Procedures"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 w-full bg-surface-raised border border-border rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {/* Search bar */}
          <div className="sticky top-0 bg-surface-raised p-2 border-b border-border">
            <div className="relative">
              <Search aria-hidden="true" size={15} className="absolute left-2.5 top-2.5 text-text-muted" />
              <input
                type="text"
                aria-label="Search procedures"
                placeholder="Search by name, specialty or category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
                autoFocus
              />
            </div>
          </div>

          {grouped.length === 0 && (
            <p className="px-3 py-4 text-sm text-text-muted text-center">No procedures found</p>
          )}

          {grouped.map(({ specialty, categories }) => (
            <div key={specialty}>
              {/* Specialty header */}
              <div aria-hidden="true" className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider sticky top-[52px]">
                {specialty}
              </div>

              {categories.map(({ category, items }) => (
                <div key={category}>
                  {/* Category sub-header */}
                  <div aria-hidden="true" className="px-4 py-1 bg-surface text-xs font-semibold text-text-muted uppercase tracking-wide">
                    {category}
                  </div>

                  {items.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      role="option"
                      aria-selected={selected.includes(p.id)}
                      onClick={() => toggle(p.id)}
                      className={`w-full text-left px-5 py-2 text-sm text-text hover:bg-primary/10 flex items-center justify-between gap-2 ${
                        selected.includes(p.id) ? 'bg-primary/10 text-primary font-medium' : ''
                      }`}
                    >
                      <span>
                        {p.name}
                        {p.subcategory && (
                          <span className="ml-1 text-text-muted font-normal">({p.subcategory})</span>
                        )}
                      </span>
                      {selected.includes(p.id) && (
                        <span aria-hidden="true" className="text-accent shrink-0">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
