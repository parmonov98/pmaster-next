import { useTranslations } from 'next-intl';
import {
  ClipboardList,
  QrCode,
  MessageSquare,
  Wallet,
  Globe,
  Send,
} from 'lucide-react';

export default function Features() {
  const t = useTranslations();

  const features = [
    {
      icon: <ClipboardList className="w-8 h-8" />,
      title: t('f1_title'),
      description: t('f1_desc'),
    },
    {
      icon: <QrCode className="w-8 h-8" />,
      title: t('f2_title'),
      description: t('f2_desc'),
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: t('f3_title'),
      description: t('f3_desc'),
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: t('f4_title'),
      description: t('f4_desc'),
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: t('f5_title'),
      description: t('f5_desc'),
    },
    {
      icon: <Send className="w-8 h-8" />,
      title: t('f6_title'),
      description: t('f6_desc'),
    },
  ];

  return (
    <div className="py-24 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">
            {t('features_label')}
          </p>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            {t('features_title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('features_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
}

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
