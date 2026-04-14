export default function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://pmaster.uz/#organization',
        name: 'pMaster',
        alternateName: 'Pro Masters Management System',
        url: 'https://pmaster.uz',
        logo: 'https://pmaster.uz/logo.svg',
        description: 'Cloud-based CRM and management software for repair shops worldwide.',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+998-95-221-21-44',
          email: 'info@thedevs.uz',
          contactType: 'sales',
          availableLanguage: ['English', 'Russian', 'Uzbek'],
        },
        sameAs: [
          'https://t.me/pmaster_bot',
          'https://instagram.com/pmaster_uz',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://pmaster.uz/#website',
        url: 'https://pmaster.uz',
        name: 'pMaster',
        publisher: { '@id': 'https://pmaster.uz/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://pmaster.uz/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'pMaster',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'CRM Software',
        operatingSystem: 'Web, Android, iOS (PWA)',
        url: 'https://pmaster.uz',
        description:
          'Free cloud-based CRM for repair shops. Features include repair tracking with QR codes, automatic SMS notifications, daily cash register, customer management, public repair status pages, and Telegram integration.',
        offers: [
          {
            '@type': 'Offer',
            name: 'Free Plan',
            price: '0',
            priceCurrency: 'USD',
            description: 'Up to 10 repairs, 10 customers, QR labels, SMS, daily cash register',
          },
          {
            '@type': 'Offer',
            name: 'Premium Plan',
            price: '10',
            priceCurrency: 'USD',
            billingIncrement: 'P1M',
            description: 'Unlimited repairs and customers, Excel reports, referral program',
          },
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '342',
          bestRating: '5',
          worstRating: '1',
        },
        featureList: [
          'Repair order tracking with QR codes',
          'Automatic SMS notifications to customers',
          'Daily cash register and financial reports',
          'Customer database and history management',
          'Public repair status page for customers',
          'Telegram bot daily business reports',
          'Device photo documentation on intake',
          'Multi-language support (English, Russian, Uzbek)',
          'PDF and Excel report export',
          'Progressive Web App (works offline)',
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is pMaster?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'pMaster is a free cloud-based CRM designed specifically for repair shops of all sizes. It helps you track repairs using QR codes, automatically notify customers via SMS, manage daily finances, and provide a public repair status page.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is pMaster free to use?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, pMaster offers a free plan with up to 10 repairs, 10 customers, QR labels, SMS notifications, and daily cash register. Premium is $10/month for unlimited usage.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does QR code repair tracking work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'When a customer brings in a device, pMaster generates a unique QR code label. Customers scan it to check repair status on a public web page. They also receive SMS notifications when the status changes.',
            },
          },
          {
            '@type': 'Question',
            name: 'What types of repair shops can use pMaster?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'pMaster works for any repair business: phone, computer, laptop, TV, appliance, camera, audio equipment, gaming consoles, CCTV systems, and more.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does pMaster work on mobile?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, pMaster is a PWA that works on any device with a web browser — smartphones, tablets, laptops, and desktops. Install it on your home screen for an app-like experience.',
            },
          },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to set up pMaster for your repair shop',
        totalTime: 'PT5M',
        step: [
          { '@type': 'HowToStep', position: 1, name: 'Create your account', text: 'Sign up free at pmaster.uz using email or Google.' },
          { '@type': 'HowToStep', position: 2, name: 'Set up your shop', text: 'Enter shop name, address, contact details, and hours.' },
          { '@type': 'HowToStep', position: 3, name: 'Start accepting repairs', text: 'Log repairs with photos, generate QR labels, and customers get automatic SMS updates.' },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
