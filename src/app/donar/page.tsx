'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];

export default function DonationPage() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingPortal, setIsCheckingPortal] = useState(true);
  const [portalEnabled, setPortalEnabled] = useState(true);

  const [metaMonto, setMetaMonto] = useState(3000000);
  const [totalRecaudado, setTotalRecaudado] = useState(0);
  const [ringAnimated, setRingAnimated] = useState(false);
  const progressVideoRef = useRef<HTMLVideoElement>(null);

  const [showSplash, setShowSplash] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [donationResult, setDonationResult] = useState<{ amount: number; createdAt: string } | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoPlaying = useRef(false);

  // Check portal status
  const portalEnabledRef = useRef(portalEnabled);
  portalEnabledRef.current = portalEnabled;

  const checkPortal = useCallback(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const wasEnabled = portalEnabledRef.current;
        setPortalEnabled(data.portalEnabled);
        setMetaMonto(data.metaMonto ?? 3000000);
        setTotalRecaudado(data.totalRecaudado ?? 0);
        setIsCheckingPortal(false);
      })
      .catch(() => setIsCheckingPortal(false));
  }, []);

  useEffect(() => {
    checkPortal();
    const interval = setInterval(checkPortal, 30000);
    return () => clearInterval(interval);
  }, [checkPortal]);

  // Animate ring after mount
  useEffect(() => {
    if (!portalEnabled) {
      const t = setTimeout(() => setRingAnimated(true), 100);
      return () => clearTimeout(t);
    }
    setRingAnimated(false);
  }, [portalEnabled]);

  // Play construction video up to donation percentage and pause
  useEffect(() => {
    const video = progressVideoRef.current;
    if (!video || portalEnabled) return;

    const pct = metaMonto > 0 ? Math.min(totalRecaudado / metaMonto, 1) : 0;

    const onLoaded = () => {
      const stopAt = video.duration * pct;
      video.currentTime = 0;
      video.play().catch(() => {});

      const onTime = () => {
        if (video.currentTime >= stopAt) {
          video.pause();
          video.removeEventListener('timeupdate', onTime);
        }
      };
      video.addEventListener('timeupdate', onTime);
    };

    if (video.readyState >= 1) {
      onLoaded();
    } else {
      video.addEventListener('loadedmetadata', onLoaded, { once: true });
    }
  }, [portalEnabled, totalRecaudado, metaMonto]);

  // Play video when splash is shown and video is ready
  useEffect(() => {
    if (!showSplash || !donationResult || !videoBlobUrl || videoPlaying.current) return;
    videoPlaying.current = true;

    const video = videoRef.current;
    if (!video) return;

    video.src = videoBlobUrl;
    video.play().catch(() => {});
    video.onended = () => {
      setSplashFading(true);
      setTimeout(() => {
        router.push(
          `/gracias?amount=${donationResult.amount}&date=${encodeURIComponent(donationResult.createdAt)}`
        );
      }, 600);
    };
  }, [showSplash, donationResult, videoBlobUrl, router]);

  const handlePresetClick = (amount: number) => {
    if (!portalEnabled) return;
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!portalEnabled) return;
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const formatCurrency = (amount: number) => amount.toLocaleString('es-DO');

  // Download video as blob (single download)
  const downloadVideo = () => {
    if (videoBlobUrl) return; // already downloaded
    fetch('/animacion1.mp4')
      .then(res => res.blob())
      .then(blob => setVideoBlobUrl(URL.createObjectURL(blob)))
      .catch(() => {});
  };

  const handleDonate = async () => {
    if (!portalEnabled) return;
    const amount = selectedAmount || (customAmount ? parseInt(customAmount) : 0);
    if (amount <= 0) {
      alert('Por favor selecciona o ingresa un monto válido');
      return;
    }
    setIsLoading(true);

    // Start video download in parallel with donation POST
    downloadVideo();

    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setDonationResult({ amount: data.donation.amount, createdAt: data.donation.createdAt });
        setShowSplash(true);
      } else {
        alert('Error al procesar la donación. Intenta nuevamente.');
        setIsLoading(false);
      }
    } catch {
      alert('Error al procesar la donación. Intenta nuevamente.');
      setIsLoading(false);
    }
  };

  if (isCheckingPortal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-5">
        <Image src="/logo.png" alt="Iglesia Revoluciona" width={96} height={96} className="animate-logo-pulse" priority />
        <div className="w-32 h-1.5 rounded-full animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Splash */}
      {showSplash && (
        <div className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-600 ${splashFading ? 'opacity-0' : 'opacity-100'}`}>
          <video ref={videoRef} muted playsInline className="absolute inset-0 w-full h-full object-cover" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <Image src="/logo.png" alt="Iglesia Revoluciona" width={112} height={112} className="drop-shadow-2xl animate-splash-text" />
            {!videoBlobUrl && <div className="w-24 h-1 rounded-full animate-shimmer" />}
          </div>
        </div>
      )}

      {/* Form */}
      <div className={`flex-1 flex items-center justify-center px-5 py-8 transition-all duration-700 ${!portalEnabled ? 'blur-md pointer-events-none select-none' : ''}`}>
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <Image src="/logo.png" alt="Iglesia Revoluciona" width={128} height={128} priority />
          </div>

          <h1 className="text-center text-2xl font-bold text-gray-900 mb-1">
            Iglesia Revoluciona
          </h1>
          <p className="text-center text-gray-400 text-sm mb-8">Tu ofrenda de fe</p>

          {/* Amount label */}
          <p className="text-xs font-semibold text-gray-400 tracking-[0.2em] uppercase mb-3">
            Monto
          </p>

          {/* 3-column grid */}
          <div className="grid grid-cols-3 gap-2.5 mb-7">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handlePresetClick(amount)}
                className={`py-3.5 rounded-2xl text-base font-bold ${
                  selectedAmount === amount
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm hover:border-gray-300'
                }`}
              >
                RD${formatCurrency(amount)}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <p className="text-xs font-semibold text-gray-400 tracking-[0.2em] uppercase mb-3">
            O ingresa un monto personalizado
          </p>
          <div className="relative mb-8">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 text-xl font-semibold">
              RD$
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={customAmount}
              onChange={handleCustomAmountChange}
              placeholder="0.00"
              disabled={!portalEnabled}
              className="w-full py-4 pl-16 pr-5 bg-white border border-gray-200 rounded-2xl text-xl font-bold text-gray-900 placeholder-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Donate button */}
          <button
            onClick={handleDonate}
            disabled={isLoading || !portalEnabled}
            className="w-full bg-gray-900 text-white py-4 rounded-full text-lg font-bold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Donar
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Disabled overlay */}
      {!portalEnabled && (() => {
        const pct = metaMonto > 0 ? Math.min(Math.round((totalRecaudado / metaMonto) * 100), 100) : 0;
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        const offset = ringAnimated ? circumference - (pct / 100) * circumference : circumference;
        return (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            {/* Construction video - plays up to donation % then pauses */}
            <video
              ref={progressVideoRef}
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              src="/animacion2.mp4"
            />
            <div className="relative z-10 flex flex-col items-center animate-fade-in">
              {/* Ring progress with logo */}
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  {/* Background ring */}
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8" />
                  {/* Progress ring */}
                  <circle
                    cx="60" cy="60" r={radius} fill="none"
                    stroke="white" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="progress-ring-circle"
                  />
                </svg>
                {/* Logo center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">re</span>
                  </div>
                </div>
              </div>
              {/* Percentage */}
              <p className="text-3xl font-bold text-white mt-4 drop-shadow-lg">{pct}%</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
