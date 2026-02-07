'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const amount = searchParams.get('amount');
  const dateString = searchParams.get('date');

  const [causaNombre, setCausaNombre] = useState('');
  const [causaDescripcion, setCausaDescripcion] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setCausaNombre(data.causaNombre || '');
        setCausaDescripcion(data.causaDescripcion || '');
      })
      .catch(() => {});
  }, []);

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return num.toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          {/* Checkmark */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-center text-2xl font-bold text-gray-900 mb-1">
            ¡Gracias por tu fe!
          </h1>
          <p className="text-center text-gray-400 text-sm mb-8">
            Tu ofrenda ha sido recibida con gratitud
          </p>

          {/* Verse card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <p className="text-gray-600 text-sm leading-relaxed mb-3 italic">
              &ldquo;Cada uno dé como propuso en su corazón: no con tristeza, ni por
              necesidad, porque Dios ama al dador alegre.&rdquo;
            </p>
            <p className="text-gray-400 text-xs font-semibold tracking-[0.15em] uppercase">
              2 Corintios 9:7
            </p>
          </div>

          {/* Causa card */}
          {causaNombre && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
              <p className="text-xs font-semibold text-gray-400 tracking-[0.15em] uppercase mb-2">
                Causa
              </p>
              <p className="text-lg font-bold text-gray-900 mb-1">{causaNombre}</p>
              {causaDescripcion && (
                <p className="text-sm text-gray-500 leading-relaxed">{causaDescripcion}</p>
              )}
            </div>
          )}

          {/* Donation details card */}
          {amount && dateString && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-gray-400 tracking-[0.15em] uppercase">
                  Has ofrendado
                </p>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-4">
                RD${formatCurrency(amount)}
              </p>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 tracking-[0.15em] uppercase mb-2">
                  Fecha
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(dateString)}
                  </p>
                  <span className="text-gray-300">·</span>
                  <p className="text-sm text-gray-500">
                    {formatTime(dateString)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Back button */}
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-900 text-white py-4 rounded-full text-lg font-bold hover:bg-black flex items-center justify-center gap-3 shadow-xl"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-5">
          <img src="/logo.png" alt="Iglesia Revoluciona" className="w-24 h-24 animate-logo-pulse" />
          <div className="w-32 h-1.5 rounded-full animate-shimmer" />
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
