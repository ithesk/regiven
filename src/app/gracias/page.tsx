'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const amount = searchParams.get('amount');
  const dateString = searchParams.get('date');

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
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          {/* Checkmark Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-center text-2xl font-bold text-black mb-2">
            ¡Gracias por tu fe!
          </h1>

          {/* Subtitle */}
          <p className="text-center text-gray-400 mb-8">
            Tu ofrenda ha sido recibida con gratitud
          </p>

          {/* Bible Verse Card */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              "Cada uno dé como propuso en su corazón: no con tristeza, ni por
              necesidad, porque Dios ama al dador alegre."
            </p>
            <p className="text-gray-500 text-sm font-semibold">
              2 Corintios 9:7
            </p>
          </div>

          {/* Donation Details */}
          {amount && dateString && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Monto</p>
                  <p className="text-2xl font-bold text-black">
                    RD${formatCurrency(amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Fecha</p>
                  <p className="text-sm font-semibold text-black">
                    {formatDate(dateString)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatTime(dateString)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Home Button */}
          <button
            onClick={() => router.push('/')}
            className="w-full bg-black text-white py-4 rounded-xl text-lg font-semibold hover:bg-gray-900"
          >
            Inicio
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
