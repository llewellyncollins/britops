import { describe, it, expect } from 'vitest';
import { DEFAULT_PROCEDURES } from './procedures';
import {
  getFieldsForSpecialty,
  getSchemaForSpecialty,
  getDefaultValues,
  getExtraFieldKeys,
} from './formSchemas';

const allSpecialties = [...new Set(DEFAULT_PROCEDURES.map(p => p.specialty))];

describe('formSchemas', () => {
  describe('getExtraFieldKeys', () => {
    it('returns all optional fields when specialty is null', () => {
      const keys = getExtraFieldKeys(null);
      expect(keys).toContain('chemotherapy');
      expect(keys).toContain('histology');
      expect(keys).toContain('complexityScore');
      expect(keys).toContain('pci');
    });

    it('returns only complexityScore for Orthopaedics', () => {
      const keys = getExtraFieldKeys('Orthopaedics');
      expect(keys).toEqual(['complexityScore']);
    });

    it('does not include pci for Orthopaedics', () => {
      expect(getExtraFieldKeys('Orthopaedics')).not.toContain('pci');
    });

    it('does not include chemotherapy for Orthopaedics', () => {
      expect(getExtraFieldKeys('Orthopaedics')).not.toContain('chemotherapy');
    });

    it('includes all fields for General Surgery', () => {
      const keys = getExtraFieldKeys('General Surgery');
      expect(keys).toContain('chemotherapy');
      expect(keys).toContain('histology');
      expect(keys).toContain('complexityScore');
      expect(keys).toContain('pci');
    });

    it('returns no extra fields for Ophthalmology', () => {
      expect(getExtraFieldKeys('Ophthalmology')).toEqual([]);
    });

    it('falls back to all fields for unknown specialty', () => {
      const keys = getExtraFieldKeys('Unknown Specialty');
      expect(keys).toContain('chemotherapy');
      expect(keys).toContain('pci');
    });
  });

  describe('getFieldsForSpecialty', () => {
    it('includes universal base fields for all specialties', () => {
      for (const sp of [...allSpecialties, null]) {
        const fields = getFieldsForSpecialty(sp);
        const keys = fields.map(f => f.key);
        expect(keys).toContain('date');
        expect(keys).toContain('patientId');
        expect(keys).toContain('diagnosis');
        expect(keys).toContain('procedures');
        expect(keys).toContain('involvement');
        expect(keys).toContain('followUp');
        expect(keys).toContain('notes');
        expect(keys).toContain('intraOpComplications');
        expect(keys).toContain('postOpComplications');
      }
    });

    it('does not include discussedMDT for any specialty', () => {
      for (const sp of [...allSpecialties, null]) {
        const keys = getFieldsForSpecialty(sp).map(f => f.key);
        expect(keys).not.toContain('discussedMDT');
      }
    });

    it('includes pci for General Surgery', () => {
      const keys = getFieldsForSpecialty('General Surgery').map(f => f.key);
      expect(keys).toContain('pci');
    });

    it('excludes pci for Orthopaedics', () => {
      const keys = getFieldsForSpecialty('Orthopaedics').map(f => f.key);
      expect(keys).not.toContain('pci');
    });

    it('has fewer fields for Ophthalmology than General Surgery', () => {
      const ophFields = getFieldsForSpecialty('Ophthalmology');
      const gsFields = getFieldsForSpecialty('General Surgery');
      expect(ophFields.length).toBeLessThan(gsFields.length);
    });
  });

  describe('getSchemaForSpecialty', () => {
    it('validates base fields for null specialty', () => {
      const schema = getSchemaForSpecialty(null);
      const valid = schema.safeParse({
        date: '2025-03-15',
        grade: '',
        patientId: '',
        diagnosis: '',
        procedures: ['gs_lap_chole'],
        involvement: 'independent',
        otherDetails: '',
        intraOpComplications: '',
        postOpComplications: '',
        followUp: true,
        notes: '',
        chemotherapy: '',
        histology: '',
        complexityScore: null,
        pci: null,
      });
      expect(valid.success).toBe(true);
    });

    it('rejects empty procedures', () => {
      const schema = getSchemaForSpecialty(null);
      const result = schema.safeParse({
        date: '2025-03-15',
        patientId: '',
        diagnosis: '',
        procedures: [],
        involvement: 'independent',
        otherDetails: '',
        intraOpComplications: '',
        postOpComplications: '',
        followUp: false,
        notes: '',
        chemotherapy: '',
        histology: '',
        complexityScore: null,
        pci: null,
      });
      expect(result.success).toBe(false);
    });

    it('Orthopaedics schema does not require pci', () => {
      const schema = getSchemaForSpecialty('Orthopaedics');
      const result = schema.safeParse({
        date: '2025-03-15',
        grade: '',
        patientId: '',
        diagnosis: '',
        procedures: ['ortho_thr'],
        involvement: 'supervised',
        otherDetails: '',
        intraOpComplications: '',
        postOpComplications: '',
        followUp: false,
        notes: '',
        complexityScore: 5,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getDefaultValues', () => {
    it('returns defaults with today date', () => {
      const defaults = getDefaultValues(null);
      expect(defaults.date).toBe(new Date().toISOString().split('T')[0]);
      expect(defaults.procedures).toEqual([]);
      expect(defaults.followUp).toBe(false);
    });

    it('overlays existing values', () => {
      const defaults = getDefaultValues(null, {
        date: '2024-01-01',
        diagnosis: 'Test',
        followUp: true,
      });
      expect(defaults.date).toBe('2024-01-01');
      expect(defaults.diagnosis).toBe('Test');
      expect(defaults.followUp).toBe(true);
    });
  });
});
