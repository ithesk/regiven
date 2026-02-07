'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];

export default function DonationPage() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingPortal, setIsCheckingPortal] = useState(true);
  const [portalEnabled, setPortalEnabled] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const [showSplash, setShowSplash] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [donationResult, setDonationResult] = useState<{ amount: number; createdAt: string } | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const checkPortal = useCallback(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const wasEnabled = portalEnabled;
        setPortalEnabled(data.portalEnabled);
        setIsCheckingPortal(false);
        if (wasEnabled && !data.portalEnabled) {
          setCountdown(3);
        }
      })
      .catch(() => setIsCheckingPortal(false));
  }, [portalEnabled]);

  useEffect(() => {
    checkPortal();
    const interval = setInterval(checkPortal, 15000);
    return () => clearInterval(interval);
  }, [checkPortal]);

  // Preload video as blob AFTER page is visible
  useEffect(() => {
    if (isCheckingPortal) return;
    const timer = setTimeout(() => {
      fetch('/animacion1.mp4')
        .then(res => res.blob())
        .then(blob => setVideoBlobUrl(URL.createObjectURL(blob)))
        .catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [isCheckingPortal]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const videoPlaying = useRef(false);

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

  const handleDonate = async () => {
    if (!portalEnabled) return;
    const amount = selectedAmount || (customAmount ? parseInt(customAmount) : 0);
    if (amount <= 0) {
      alert('Por favor selecciona o ingresa un monto válido');
      return;
    }
    setIsLoading(true);
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
        <img src="/logo.png" alt="Iglesia Revoluciona" className="w-24 h-24 animate-logo-pulse" />
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
            <img src="/logo.png" alt="Iglesia Revoluciona" className="w-28 h-28 drop-shadow-2xl animate-splash-text" />
            {!videoBlobUrl && <div className="w-24 h-1 rounded-full animate-shimmer" />}
          </div>
        </div>
      )}

      {/* Form */}
      <div className={`flex-1 flex items-center justify-center px-5 py-8 transition-all duration-700 ${!portalEnabled ? 'blur-md pointer-events-none select-none' : ''}`}>
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <img src="/logo.png" alt="Iglesia Revoluciona" className="w-32 h-32" />
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
                className={`py-3.5 rounded-2xl text-base font-bold transition-all ${
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
      {!portalEnabled && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mx-6 max-w-sm w-full text-center animate-fade-in">
            {countdown > 0 ? (
              <>
                <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-4xl font-bold">{countdown}</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">Deshabilitando portal...</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Portal no disponible</h2>
                <p className="text-gray-500 text-sm">El portal de ofrendas se encuentra temporalmente deshabilitado. Intenta más tarde.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
