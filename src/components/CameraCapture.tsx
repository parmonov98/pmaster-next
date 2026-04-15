'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const t = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setError(null);
    setCapturedImage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError(t('cameraPermissionDenied'));
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError(t('cameraNotFound'));
      } else {
        setError(t('cameraError'));
      }
    }
  }, [t]);

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, facingMode, startCamera]);

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);

    // Stop video while reviewing
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;
    // Convert data URL to File
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        cleanup();
      });
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 z-10">
        <button onClick={cleanup} className="p-2 text-white">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-medium">{t('photoSourceCamera')}</span>
        <button onClick={switchCamera} className="p-2 text-white">
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Camera view or captured image */}
      <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
        {error ? (
          <div className="text-center p-6">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-white text-sm">{error}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              {t('tryAgain')}
            </button>
          </div>
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/80 flex items-center justify-center gap-8">
        {capturedImage ? (
          <>
            <button
              onClick={retake}
              className="p-4 rounded-full bg-gray-700 text-white"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            <button
              onClick={confirmPhoto}
              className="p-4 rounded-full bg-green-600 text-white"
            >
              <Check className="w-8 h-8" />
            </button>
          </>
        ) : !error ? (
          <button
            onClick={takePhoto}
            className="w-16 h-16 rounded-full border-4 border-white bg-white/20 active:bg-white/40 transition-colors"
          />
        ) : null}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
