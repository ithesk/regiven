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

  // Splash animation state
  const [showSplash, setShowSplash] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [donationResult, setDonationResult] = useState<{ amount: number; createdAt: string } | null>(null);
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
      .catch(() => {
        setIsCheckingPortal(false);
      });
  }, [portalEnabled]);

  useEffect(() => {
    checkPortal();
    const interval = setInterval(checkPortal, 3000);
    return () => clearInterval(interval);
  }, [checkPortal]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // When splash is shown, play video and navigate after it ends
  useEffect(() => {
    if (!showSplash || !donationResult) return;

    const navigateToGracias = () => {
      setSplashFading(true);
      setTimeout(() => {
        router.push(
          `/gracias?amount=${donationResult.amount}&date=${encodeURIComponent(donationResult.createdAt)}`
        );
      }, 600);
    };

    // Fallback: navigate after 5s even if video doesn't end
    const fallback = setTimeout(navigateToGracias, 5000);

    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // If video can't autoplay, still navigate after delay
      });
      video.onended = () => {
        clearTimeout(fallback);
        navigateToGracias();
      };
    }

    return () => clearTimeout(fallback);
  }, [showSplash, donationResult, router]);

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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-DO');
  };

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
        setDonationResult({
          amount: data.donation.amount,
          createdAt: data.donation.createdAt,
        });
        setShowSplash(true);
      } else {
        alert('Error al procesar la donación. Intenta nuevamente.');
        setIsLoading(false);
      }
    } catch (error) {
      alert('Error al procesar la donación. Intenta nuevamente.');
      setIsLoading(false);
    }
  };

  if (isCheckingPortal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Splash animation overlay */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center transition-opacity duration-600 ${
            splashFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Video background */}
          <video
            ref={videoRef}
            src="/animacion1.mp4"
            muted
            playsInline
            autoPlay
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Logo on top of video */}
          <div className="relative z-10 animate-splash-text">
            <img
              src="/logo.png"
              alt="Iglesia Revoluciona"
              className="w-28 h-28 drop-shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Main form */}
      <div
        className={`flex-1 flex items-center justify-center px-6 py-8 transition-all duration-700 ${
          !portalEnabled ? 'blur-md pointer-events-none select-none' : ''
        }`}
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
              <span className="text-white text-3xl font-bold">re</span>
            </div>
          </div>

          <h1 className="text-center text-2xl font-bold text-black mb-2">
            Iglesia Revoluciona
          </h1>

          <p className="text-center text-gray-400 mb-8">Tu ofrenda de fe</p>

          <h2 className="text-lg font-bold text-black mb-4">
            Selecciona tu aporte
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handlePresetClick(amount)}
                className={`py-4 px-6 rounded-xl text-lg font-semibold transition-all ${
                  selectedAmount === amount
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                RD${formatCurrency(amount)}
              </button>
            ))}
          </div>

          <div className="mb-8">
            <label className="block text-sm text-gray-600 mb-2">
              O ingresa otro monto
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
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
                className="w-full py-4 pl-16 pr-4 bg-gray-100 rounded-xl text-lg font-semibold text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <button
            onClick={handleDonate}
            disabled={isLoading || !portalEnabled}
            className="w-full bg-black text-white py-4 rounded-xl text-lg font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            {isLoading ? 'Procesando...' : 'Donar'}
          </button>
        </div>
      </div>

      {/* Disabled overlay */}
      {!portalEnabled && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mx-6 max-w-sm w-full text-center animate-fade-in">
            {countdown > 0 ? (
              <>
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-4xl font-bold">{countdown}</span>
                </div>
                <p className="text-lg font-semibold text-black">
                  Deshabilitando portal...
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-black mb-2">
                  Portal no disponible
                </h2>
                <p className="text-gray-500 text-sm">
                  El portal de ofrendas se encuentra temporalmente deshabilitado. Intenta más tarde.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
