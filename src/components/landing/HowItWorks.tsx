import { useTranslations } from 'next-intl';

export default function HowItWorks() {
  const t = useTranslations();

  const steps = [
    {
      number: 1,
      title: t('s1_title'),
      description: t('s1_desc'),
    },
    {
      number: 2,
      title: t('s2_title'),
      description: t('s2_desc'),
    },
    {
      number: 3,
      title: t('s3_title'),
      description: t('s3_desc'),
    },
  ];

  return (
    <div className="py-24 bg-white" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-50 rounded-full">
            {t('how_label')}
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
          {t('how_title')}
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto">
          {t('how_desc')}
        </p>

        {/* Steps Container */}
        <div className="relative">
          {/* Connecting Line - Hidden on Mobile */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-purple-400 z-0"></div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                {/* Numbered Circle */}
                <div className="mb-6 flex items-center justify-center">
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-4xl font-bold text-white">{step.number}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
