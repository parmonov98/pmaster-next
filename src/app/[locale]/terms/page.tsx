import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/landing/Footer';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-gray-600 mb-8">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

          <div className="prose prose-blue max-w-none">
            <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By accessing and using pMaster, you agree to be bound by these Terms of Service
                and all applicable laws and regulations. If you do not agree with any of these terms,
                you are prohibited from using the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Use License</h2>
              <p className="text-gray-600 mb-4">
                Upon subscribing to pMaster, we grant you a limited, non-exclusive, non-transferable
                license to use our service for your repair business operations.
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Free plan users are limited to 10 repairs and customers</li>
                <li>Premium plan users have access to unlimited repairs</li>
                <li>You may not resell or redistribute the service</li>
                <li>You must maintain the security of your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Service Availability</h2>
              <p className="text-gray-600">
                We strive to maintain 99.9% uptime, but we do not guarantee uninterrupted access
                to the service. We reserve the right to suspend service for maintenance or updates
                with reasonable notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Payment Terms</h2>
              <p className="text-gray-600 mb-4">
                For Premium plan subscribers:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Monthly subscription fee of 129,000 UZS</li>
                <li>Automatic renewal unless cancelled</li>
                <li>No refunds for partial months</li>
                <li>30-day notice required for cancellation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Ownership</h2>
              <p className="text-gray-600">
                You retain all rights to your data. We will not share or sell your data to third
                parties. You are responsible for maintaining appropriate backups of your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Termination</h2>
              <p className="text-gray-600">
                We reserve the right to terminate or suspend access to our service immediately,
                without prior notice, for any breach of these Terms of Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Contact</h2>
              <p className="text-gray-600">
                For any questions regarding these Terms of Service, please contact us at:
                <br />
                Email: info@thedevs.uz
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
