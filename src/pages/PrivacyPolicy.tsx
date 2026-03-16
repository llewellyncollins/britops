import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-surface p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link to="/settings" className="inline-flex items-center gap-2 text-primary text-sm hover:underline">
          <ArrowLeft size={16} /> Back to Settings
        </Link>

        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-text-muted">Last updated: 16 March 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. What BritOps Is</h2>
          <p className="text-sm leading-relaxed">
            BritOps is a personal surgical operation logbook designed for UK doctors building
            ARCP (Annual Review of Competence Progression) portfolios. It is not a shared
            clinical record system and does not provide clinical decision support.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Data We Collect</h2>
          <p className="text-sm leading-relaxed">When you use BritOps, the following data is stored:</p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
            <li><strong>Account information:</strong> email address (if you create an account)</li>
            <li><strong>Operation records:</strong> date, patient hospital number, diagnosis,
              procedures performed, involvement level, complications, histology, follow-up notes,
              complexity scores, and any free-text notes you enter</li>
            <li><strong>Preferences:</strong> your medical specialty</li>
            <li><strong>Custom procedure types:</strong> any procedures you add beyond the built-in list</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. Why We Process Your Data</h2>
          <p className="text-sm leading-relaxed">
            Your data is processed solely to provide you with a personal surgical logbook for
            professional development and ARCP portfolio evidence. The lawful basis for
            processing is legitimate interests — specifically your professional need to
            maintain a record of surgical experience. Patient data is pseudonymised (identified
            by hospital number only, not by name, NHS number, or date of birth).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">4. Where Your Data Is Stored</h2>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
            <li><strong>Locally on your device:</strong> all data is stored in your browser&apos;s
              IndexedDB and localStorage. This works offline.</li>
            <li><strong>In the cloud (optional):</strong> if you create an account, data syncs to
              Google Cloud Firestore. Data is encrypted in transit (TLS) and at rest (AES-256)
              by Google Cloud.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. Third Parties</h2>
          <p className="text-sm leading-relaxed">
            BritOps uses Firebase (Google Cloud) for authentication and data storage. Google
            acts as a data processor. No other third parties receive your data. There are no
            analytics, tracking, or advertising services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. Data Retention</h2>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
            <li>Active operation records are kept for as long as your account exists</li>
            <li>Deleted operations are permanently removed after 30 days</li>
            <li>If you delete your account, all data is immediately and permanently removed
              from both the cloud and your device</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">7. Your Rights</h2>
          <p className="text-sm leading-relaxed">Under UK GDPR, you have the right to:</p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
            <li><strong>Access:</strong> export all your data via Settings (Excel, CSV, or JSON)</li>
            <li><strong>Rectification:</strong> edit any operation record at any time</li>
            <li><strong>Erasure:</strong> delete individual operations or your entire account and all data</li>
            <li><strong>Portability:</strong> export your data in machine-readable formats (JSON, CSV)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">8. Cookies &amp; Local Storage</h2>
          <p className="text-sm leading-relaxed">
            BritOps uses IndexedDB and localStorage for core app functionality (storing your
            operation records and preferences). These are strictly necessary for the app to
            work and fall under the PECR exemption for essential storage. No tracking cookies
            or third-party cookies are used.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">9. Security</h2>
          <p className="text-sm leading-relaxed">
            Data in transit is protected by TLS encryption. Cloud data is encrypted at rest
            by Google Cloud (AES-256). Access to your data is restricted by Firebase
            Authentication and Firestore Security Rules — only you can read or write your
            own records. You are responsible for securing your device (screen lock, disk
            encryption).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">10. Contact</h2>
          <p className="text-sm leading-relaxed">
            If you have questions about this privacy policy or wish to exercise your data
            rights, please contact the developer at the email address provided in the app
            settings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">11. Changes to This Policy</h2>
          <p className="text-sm leading-relaxed">
            We may update this policy from time to time. The &quot;Last updated&quot; date at the top
            will reflect the most recent revision. Continued use of BritOps after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>
      </div>
    </div>
  );
}
