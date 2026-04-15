'use client';

import { useEffect } from 'react';
import { Camera, Image, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PhotoSourceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
}

export default function PhotoSourceSheet({ isOpen, onClose, onSelectCamera, onSelectGallery }: PhotoSourceSheetProps) {
  const t = useTranslations();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 pb-8 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('photoSourceTitle')}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <button
            onClick={() => { onClose(); onSelectCamera(); }}
            className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-base font-medium text-gray-900">{t('photoSourceCamera')}</span>
          </button>

          <button
            onClick={() => { onClose(); onSelectGallery(); }}
            className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <Image className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-base font-medium text-gray-900">{t('photoSourceGallery')}</span>
          </button>
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-center text-gray-500 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          {t('photoSourceCancel')}
        </button>
      </div>
    </div>
  );
}
