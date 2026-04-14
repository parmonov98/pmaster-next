import { useTranslations } from 'next-intl';
import { DollarSign, ClipboardList, Phone, Camera, ArrowRight } from 'lucide-react';

export default function Problems() {
  const t = useTranslations();

  const problems = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: t('p1_title'),
      description: t('p1_desc'),
      solution: t('p1_fix'),
      iconColor: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      icon: <ClipboardList className="w-8 h-8" />,
      title: t('p2_title'),
      description: t('p2_desc'),
      solution: t('p2_fix'),
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      icon: <Phone className="w-8 h-8" />,
      title: t('p3_title'),
      description: t('p3_desc'),
      solution: t('p3_fix'),
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: t('p4_title'),
      description: t('p4_desc'),
      solution: t('p4_fix'),
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">
            {t('problems_label')}
          </p>
          <h2 className="text-4xl font-bold text-gray-900 mb-6 max-w-3xl mx-auto">
            {t('problems_title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('problems_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {problems.map((problem, index) => (
            <ProblemCard key={index} {...problem} />
          ))}
        </div>
      </div>
    </div>
  );
}

type ProblemCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  solution: string;
  iconColor: string;
  bgColor: string;
};

function ProblemCard({
  icon,
  title,
  description,
  solution,
  iconColor,
  bgColor,
}: ProblemCardProps) {
  return (
    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className={`w-16 h-16 ${bgColor} rounded-2xl flex items-center justify-center mb-6 ${iconColor}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed mb-6">{description}</p>
      <div className="flex items-center gap-3 text-blue-600 font-semibold">
        <span>{solution}</span>
        <ArrowRight className="w-5 h-5" />
      </div>
    </div>
  );
}
