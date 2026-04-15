import { describe, it, expect } from "vitest";
import { DEFAULT_PROCEDURES, getAllSpecialties, getCategoriesForSpecialty } from "./procedures";

describe("DEFAULT_PROCEDURES data integrity", () => {
  it("contains exactly 193 procedures", () => {
    expect(DEFAULT_PROCEDURES).toHaveLength(193);
  });

  it("every procedure has required non-empty fields", () => {
    for (const proc of DEFAULT_PROCEDURES) {
      expect(proc.id, `procedure missing id`).toBeTruthy();
      expect(proc.name, `${proc.id} missing name`).toBeTruthy();
      expect(proc.category, `${proc.id} missing category`).toBeTruthy();
      expect(proc.specialty, `${proc.id} missing specialty`).toBeTruthy();
    }
  });

  it("all IDs are unique", () => {
    const ids = DEFAULT_PROCEDURES.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("all procedures have isCustom set to false", () => {
    for (const proc of DEFAULT_PROCEDURES) {
      expect(proc.isCustom, `${proc.id} has isCustom !== false`).toBe(false);
    }
  });

  it("covers expected specialties", () => {
    const specialties = [
      ...new Set(DEFAULT_PROCEDURES.map((p) => p.specialty)),
    ].sort();
    expect(specialties).toContain("General Surgery");
    expect(specialties).toContain("Orthopaedics");
    expect(specialties).toContain("Urology");
    expect(specialties).toContain("Vascular Surgery");
    expect(specialties).toContain("Cardiothoracic");
    expect(specialties).toContain("Neurosurgery");
    expect(specialties).toContain("ENT");
    expect(specialties).toHaveLength(13);
  });

  it("no procedure has an empty name (would break UI rendering)", () => {
    for (const proc of DEFAULT_PROCEDURES) {
      expect(
        proc.name.trim().length,
        `${proc.id} has empty name`,
      ).toBeGreaterThan(0);
    }
  });

  it("every procedure with a subcategory also has a non-empty category", () => {
    const withSubcategory = DEFAULT_PROCEDURES.filter((p) => p.subcategory);
    for (const proc of withSubcategory) {
      expect(
        proc.category.trim().length,
        `${proc.id} has subcategory but empty category`,
      ).toBeGreaterThan(0);
    }
  });
});

describe("getAllSpecialties", () => {
  it("returns sorted unique specialties", () => {
    const specialties = getAllSpecialties(DEFAULT_PROCEDURES);
    expect(specialties).toContain("General Surgery");
    expect(specialties).toContain("Orthopaedics");
    // Check sorted
    const sorted = [...specialties].sort();
    expect(specialties).toEqual(sorted);
  });

  it("returns empty array for empty input", () => {
    expect(getAllSpecialties([])).toEqual([]);
  });
});

describe("getCategoriesForSpecialty", () => {
  it("returns categories for a specific specialty", () => {
    const categories = getCategoriesForSpecialty(DEFAULT_PROCEDURES, "General Surgery");
    expect(categories.length).toBeGreaterThan(0);
    expect(categories).toContain("Hepatobiliary");
  });

  it("returns empty array for unknown specialty", () => {
    expect(getCategoriesForSpecialty(DEFAULT_PROCEDURES, "Nonexistent")).toEqual([]);
  });
});
