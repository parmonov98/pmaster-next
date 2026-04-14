import { useTranslations } from 'next-intl';

export default function DeviceTypes() {
  const t = useTranslations();

  // Device types as hardcoded SEO keywords - NOT translated
  const deviceTypes = [
    'Smartphone',
    'Laptop',
    'Computer',
    'Tablet',
    'TV',
    'Monitor',
    'Printer',
    'Camera',
    'Smartwatch',
    'Audio Equipment',
    'Refrigerator',
    'Washing Machine',
    'Microwave',
    'Air Conditioner',
    'WiFi Router',
    'CCTV',
    'Gaming Console',
    'Power Bank',
    'Headphones',
    'Keyboard & Mouse',
  ];

  return (
    <div className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-50 rounded-full">
            {t('devices_label')}
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
          {t('devices_title')}
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          {t('devices_desc')}
        </p>

        {/* Device Types Tags */}
        <div className="flex flex-wrap justify-center gap-3">
          {deviceTypes.map((device, index) => (
            <div
              key={index}
              className="px-4 py-2 bg-white border border-gray-300 rounded-full text-gray-700 font-medium transition-all duration-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
            >
              {device}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
