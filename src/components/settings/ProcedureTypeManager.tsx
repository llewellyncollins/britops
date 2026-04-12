import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trackCustomProcedureAdded } from "../../firebase/analytics";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useProcedureTypes } from "../../hooks/useProcedureTypes";
import { useTier } from "../../hooks/useTier";
import { DEFAULT_PROCEDURES } from "../../data/procedures";
import type { ProcedureType } from "../../types";

function generateId(name: string, specialty: string): string {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  return `custom_${slug(specialty)}_${slug(name)}_${Date.now()}`;
}

interface NewProcedureForm {
  specialty: string;
  customSpecialty: string;
  category: string;
  customCategory: string;
  subcategory: string;
  name: string;
}

const EMPTY_FORM: NewProcedureForm = {
  specialty: "",
  customSpecialty: "",
  category: "",
  customCategory: "",
  subcategory: "",
  name: "",
};

export function ProcedureTypeManager() {
  const { allProcedures, customTypes, addProcedureType, removeProcedureType } =
    useProcedureTypes();
  const { can } = useTier();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<NewProcedureForm>(EMPTY_FORM);
  const [expandedSpecialties, setExpandedSpecialties] = useState<Set<string>>(
    new Set(),
  );

  // Available specialties from the full list for suggestions
  const existingSpecialties = [
    ...new Set(allProcedures.map((p) => p.specialty)),
  ].sort();

  const resolvedSpecialty =
    form.specialty === "__new__" ? form.customSpecialty : form.specialty;

  // Categories for the selected specialty
  const categoriesForSpecialty = resolvedSpecialty
    ? [
        ...new Set(
          allProcedures
            .filter((p) => p.specialty === resolvedSpecialty)
            .map((p) => p.category),
        ),
      ].sort()
    : [];

  const resolvedCategory =
    form.category === "__new__" ? form.customCategory : form.category;

  async function handleAdd() {
    if (!resolvedSpecialty || !resolvedCategory || !form.name.trim()) return;
    const newProc: Omit<ProcedureType, "isCustom"> = {
      id: generateId(form.name, resolvedSpecialty),
      name: form.name.trim(),
      specialty: resolvedSpecialty.trim(),
      category: resolvedCategory.trim(),
      subcategory: form.subcategory.trim() || undefined,
    };
    await addProcedureType(newProc);
    trackCustomProcedureAdded();
    setForm(EMPTY_FORM);
    setShowAdd(false);
  }

  function toggleSpecialty(sp: string) {
    setExpandedSpecialties((prev) => {
      const next = new Set(prev);
      if (next.has(sp)) {
        next.delete(sp);
      } else {
        next.add(sp);
      }
      return next;
    });
  }

  // Group custom types by specialty
  const customBySpecialty = customTypes.reduce<Record<string, ProcedureType[]>>(
    (acc, p) => {
      (acc[p.specialty] ??= []).push(p);
      return acc;
    },
    {},
  );

  // Default procedures grouped by specialty (for the "view/browse" section)
  const defaultBySpecialty = DEFAULT_PROCEDURES.reduce<
    Record<string, ProcedureType[]>
  >((acc, p) => {
    (acc[p.specialty] ??= []).push(p);
    return acc;
  }, {});

  const allSpecialtiesWithCustom = Object.keys(customBySpecialty).sort();
  const allDefaultSpecialties = Object.keys(defaultBySpecialty).sort();

  return (
    <div className="space-y-4">
      {/* Add new procedure */}
      {!showAdd ? (
        <button
          onClick={() => can('customProcedures') ? setShowAdd(true) : navigate('/upgrade')}
          className="w-full flex items-center gap-2 p-3 border border-dashed border-border rounded-lg hover:border-accent text-accent text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add custom procedure
        </button>
      ) : (
        <div className="border border-accent/40 rounded-lg p-4 space-y-3 bg-surface-raised">
          <p className="text-sm font-semibold text-text">New Procedure</p>

          {/* Specialty */}
          <div>
            <label htmlFor="new-proc-specialty" className="block text-xs font-medium text-text mb-1">
              Specialty *
            </label>
            <select
              id="new-proc-specialty"
              value={form.specialty}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  specialty: e.target.value,
                  category: "",
                  customCategory: "",
                }))
              }
              className="input text-sm"
            >
              <option value="">Select specialty...</option>
              {existingSpecialties.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
              <option value="__new__">+ New specialty</option>
            </select>
            {form.specialty === "__new__" && (
              <input
                type="text"
                placeholder="Specialty name"
                value={form.customSpecialty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customSpecialty: e.target.value }))
                }
                className="input text-sm mt-2"
                aria-label="Custom specialty name"
              />
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="new-proc-category" className="block text-xs font-medium text-text mb-1">
              Category (type) *
            </label>
            <select
              id="new-proc-category"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: e.target.value,
                  customCategory: "",
                }))
              }
              className="input text-sm"
              disabled={!resolvedSpecialty}
            >
              <option value="">Select category...</option>
              {categoriesForSpecialty.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__new__">+ New category</option>
            </select>
            {form.category === "__new__" && (
              <input
                type="text"
                placeholder="Category name"
                value={form.customCategory}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customCategory: e.target.value }))
                }
                className="input text-sm mt-2"
                aria-label="Custom category name"
              />
            )}
          </div>

          {/* Subcategory */}
          <div>
            <label htmlFor="new-proc-subcategory" className="block text-xs font-medium text-text mb-1">
              Subtype <span className="font-normal">(optional)</span>
            </label>
            <input
              id="new-proc-subcategory"
              type="text"
              placeholder="e.g., Laparoscopic, Open, Robotic"
              value={form.subcategory}
              onChange={(e) =>
                setForm((f) => ({ ...f, subcategory: e.target.value }))
              }
              className="input text-sm"
            />
          </div>

          {/* Name */}
          <div>
            <label htmlFor="new-proc-name" className="block text-xs font-medium text-text mb-1">
              Procedure name *
            </label>
            <input
              id="new-proc-name"
              type="text"
              placeholder="e.g., Whipple procedure"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={
                !resolvedSpecialty || !resolvedCategory || !form.name.trim()
              }
              className="flex-1 bg-accent text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-accent-dark transition-colors"
            >
              Add Procedure
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setForm(EMPTY_FORM);
              }}
              className="px-4 py-2 border border-border rounded-lg text-sm text-text hover:bg-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Custom procedures list */}
      {allSpecialtiesWithCustom.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text uppercase tracking-wide">
            Your custom procedures
          </p>
          {allSpecialtiesWithCustom.map((sp) => (
            <div
              key={sp}
              className="border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleSpecialty(sp)}
                aria-expanded={expandedSpecialties.has(sp)}
                aria-controls={`custom-sp-${sp}`}
                className="w-full flex items-center justify-between px-3 py-2 bg-surface hover:bg-primary/10 text-sm font-semibold text-text"
              >
                <span>
                  {sp}{" "}
                  <span className="text-text-muted font-normal">
                    ({customBySpecialty[sp].length})
                  </span>
                </span>
                {expandedSpecialties.has(sp) ? (
                  <ChevronDown size={15} />
                ) : (
                  <ChevronRight size={15} />
                )}
              </button>
              {expandedSpecialties.has(sp) && (
                <div id={`custom-sp-${sp}`} className="divide-y divide-border">
                  {customBySpecialty[sp].map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-primary/10"
                    >
                      <div>
                        <span className="text-sm">{p.name}</span>
                        {p.subcategory && (
                          <span className="ml-1 text-xs text-text-muted">
                            ({p.subcategory})
                          </span>
                        )}
                        <span className="ml-2 text-xs text-text-muted bg-surface px-1.5 py-0.5 rounded">
                          {p.category}
                        </span>
                      </div>
                      <button
                        onClick={() => removeProcedureType(p.id)}
                        className="text-text-muted hover:text-danger p-1 rounded transition-colors"
                        aria-label={`Remove ${p.name}`}
                      >
                        <Trash2 aria-hidden="true" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Default procedures browser */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Built-in procedures ({DEFAULT_PROCEDURES.length})
        </p>
        {allDefaultSpecialties.map((sp) => (
          <div
            key={sp}
            className="border border-border rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleSpecialty(`default_${sp}`)}
              aria-expanded={expandedSpecialties.has(`default_${sp}`)}
              aria-controls={`default-sp-${sp}`}
              className="w-full flex items-center justify-between px-3 py-2 bg-surface hover:bg-primary/10 text-sm text-text"
            >
              <span className="font-medium">{sp}</span>
              <span className="flex items-center gap-1 text-text-muted text-xs">
                {defaultBySpecialty[sp].length} procedures
                {expandedSpecialties.has(`default_${sp}`) ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </span>
            </button>
            {expandedSpecialties.has(`default_${sp}`) && (
              <div id={`default-sp-${sp}`} className="divide-y divide-border max-h-48 overflow-y-auto">
                {defaultBySpecialty[sp].map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-1.5 text-sm text-text"
                  >
                    <span>
                      {p.name}
                      {p.subcategory && (
                        <span className="ml-1 text-xs">({p.subcategory})</span>
                      )}
                    </span>
                    <span className="text-xs text-text-muted bg-surface px-1.5 py-0.5 rounded shrink-0 ml-2">
                      {p.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
