/**
 * Firebase Analytics event tracking.
 *
 * PRIVACY: Never pass PHI to Firebase Analytics.
 * Prohibited OperationEntry fields: patientId, diagnosis, histology,
 * notes, intraOpComplications, postOpComplications, chemotherapy.
 * These fields contain patient-identifiable clinical information.
 *
 * Safe fields: involvement, procedures.length (count only), complexityScore
 * (null/not-null only), pci (null/not-null only), discussedMDT, followUp,
 * hospital (institutional identifier, not patient-linked), grade, specialty.
 */

import {
  getAnalytics,
  logEvent,
  setUserProperties,
  type Analytics,
} from 'firebase/analytics';
import { app, isConfigured, useEmulators } from './config';

let _analytics: Analytics | null = null;

function getAnalyticsInstance(): Analytics | null {
  if (!isConfigured || !app || useEmulators) return null;
  if (!_analytics) {
    try {
      _analytics = getAnalytics(app);
    } catch {
      return null;
    }
  }
  return _analytics;
}

function track(eventName: string, params?: Record<string, string | number | boolean>) {
  try {
    const a = getAnalyticsInstance();
    if (a) logEvent(a, eventName, params);
  } catch {
    // Analytics failures must never break the app
  }
}

// ─── Operations ──────────────────────────────────────────────────────────────

export function trackOperationLogged(params: {
  involvement: string;
  procedure_count: number;
  has_complications: boolean;
  discussed_mdt: boolean;
  has_complexity_score: boolean;
  has_pci: boolean;
}) {
  track('operation_logged', params);
}

export function trackOperationUpdated(params: {
  involvement: string;
  procedure_count: number;
}) {
  track('operation_updated', params);
}

export function trackOperationDeleted() {
  track('operation_deleted');
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function trackSignIn(params: { method: 'email' | 'google' }) {
  track('login', params);
}

export function trackSignUp(params: { method: 'email' | 'google' }) {
  track('sign_up', params);
}

export function trackSignOut() {
  track('sign_out');
}

export function trackSignInPrompted(params: {
  source: 'settings' | 'export' | 'import' | 'custom_procedure' | 'support';
}) {
  track('sign_in_prompted', params);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function trackThemeChanged(params: { theme: 'system' | 'light' | 'dark' }) {
  track('theme_changed', params);
}

export function trackGradeSet(params: { has_grade: boolean }) {
  track('grade_set', params);
}

export function trackSpecialtySet(params: { has_specialty: boolean }) {
  track('specialty_set', params);
}

export function trackProcedureTypesOpened() {
  track('procedure_types_opened');
}

export function trackExport(params: { format: 'xlsx' | 'csv' | 'json' }) {
  track('export_triggered', params);
}

export function trackImport(params: { row_count: number }) {
  track('import_triggered', params);
}

export function trackDataCleared() {
  track('data_cleared');
}

export function trackAccountDeleteInitiated() {
  track('account_delete_initiated');
}

export function trackAccountDeleteConfirmed() {
  track('account_delete_confirmed');
}

export function trackSupportOpened() {
  track('support_opened');
}

export function trackPrivacyPolicyViewed() {
  track('privacy_policy_viewed');
}

export function trackTermsViewed() {
  track('terms_viewed');
}

export function trackCustomProcedureAdded() {
  track('custom_procedure_added');
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export function trackPortfolioDateFilterApplied(params: {
  has_from: boolean;
  has_to: boolean;
}) {
  track('portfolio_date_filter', params);
}

export function trackPortfolioDateFilterCleared() {
  track('portfolio_date_filter_cleared');
}

export function trackPortfolioSpecialtyFiltered(params: { has_filter: boolean }) {
  track('portfolio_specialty_filter', params);
}

export function trackPortfolioGradeFiltered(params: { has_filter: boolean }) {
  track('portfolio_grade_filter', params);
}

export function trackPortfolioSectionToggled(params: {
  section: 'overview' | 'activity' | 'involvement';
  open: boolean;
}) {
  track('portfolio_section_toggled', params);
}

// ─── Page views ───────────────────────────────────────────────────────────────

export function trackPageView(params: {
  page_name:
    | 'Dashboard'
    | 'Portfolio'
    | 'Settings'
    | 'LogOperation'
    | 'EditOperation'
    | 'Login'
    | 'Support';
}) {
  track('page_view', params);
}

// ─── User properties ──────────────────────────────────────────────────────────

export function setAnalyticsUserProperties(params: {
  specialty: string;
  grade: string;
}) {
  try {
    const a = getAnalyticsInstance();
    if (a) setUserProperties(a, params);
  } catch {
    // silently ignore
  }
}
