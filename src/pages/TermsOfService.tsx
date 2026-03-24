import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-surface p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link to="/settings" className="inline-flex items-center gap-2 text-primary text-sm hover:underline">
          <ArrowLeft size={16} /> Back to Settings
        </Link>

        <h1 className="text-2xl font-bold">Terms of Service</h1>
        <p className="text-sm text-text-muted">Last updated: 16 March 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Purpose</h2>
          <p className="text-sm leading-relaxed">
            Theatrelog is a personal surgical operation logbook tool designed to help UK doctors
            record their operative experience for ARCP portfolio purposes. It is provided as
            a personal productivity tool and is not a clinical decision support system, medical
            device, or shared clinical record.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. User Responsibilities</h2>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
            <li>You are responsible for the accuracy and completeness of data you enter</li>
            <li>You must comply with your NHS trust&apos;s information governance policies
              regarding the recording of patient data</li>
            <li>You should not enter directly identifiable patient information (full name,
              NHS number, date of birth) — use hospital numbers only</li>
            <li>You are responsible for securing your device and account credentials</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. Clinical Disclaimer</h2>
          <p className="text-sm leading-relaxed">
            Theatrelog is a record-keeping tool only. It does not provide clinical advice,
            diagnostic support, or treatment recommendations. No clinical decisions should
            be made based solely on data recorded in this application. The developer accepts
            no liability for clinical outcomes related to the use of this tool.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">4. Data &amp; Privacy</h2>
          <p className="text-sm leading-relaxed">
            Your use of Theatrelog is subject to our{' '}
            <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>,
            which explains how your data is collected, stored, and protected.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. Service Availability</h2>
          <p className="text-sm leading-relaxed">
            Theatrelog is provided on an &quot;as is&quot; basis. While we aim for high availability,
            we do not guarantee uninterrupted access. The offline-first architecture means
            your data remains accessible on your device even without an internet connection.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. Intellectual Property</h2>
          <p className="text-sm leading-relaxed">
            The Theatrelog application and its original content are the property of the developer.
            Your operation records and data remain your property at all times.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">7. Account Termination</h2>
          <p className="text-sm leading-relaxed">
            You may delete your account and all associated data at any time from the Settings
            page. We recommend exporting your data before account deletion as this action is
            irreversible.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">8. Changes to Terms</h2>
          <p className="text-sm leading-relaxed">
            We may update these terms from time to time. The &quot;Last updated&quot; date at the top
            will reflect the most recent revision. Continued use of Theatrelog after changes
            constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">9. Governing Law</h2>
          <p className="text-sm leading-relaxed">
            These terms are governed by the laws of England and Wales.
          </p>
        </section>

        <p className="text-xs text-text-muted">© 2026 Theatrelog</p>
      </div>
    </div>
  );
}
