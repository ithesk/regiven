'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface FaseData {
  nombre: string;
  meta: number;
  deadline: string;
  recaudado: number;
  donantes: number;
}

function useCountdown(deadline: Date) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, deadline.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const expired = diff === 0;

  return { days, hours, minutes, seconds, expired };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-semibold text-gray-500 bg-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-300 active:bg-gray-400"
    >
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  );
}

function FaseCard({
  nombre,
  meta,
  recaudado,
  deadline,
  formatCurrency,
}: {
  nombre: string;
  meta: number;
  recaudado: number;
  deadline: Date;
  formatCurrency: (n: number) => string;
}) {
  const countdown = useCountdown(deadline);
  const fasePct = meta > 0 ? Math.min(Math.round((recaudado / meta) * 100), 100) : 0;
  const completed = fasePct >= 100;

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-5">
      {/* Header row */}
      <div className="flex items-start justify-between mb-1">
        <p className="text-base font-bold text-gray-900">{nombre}</p>
        <p className="text-xs text-gray-400 mt-1">
          {deadline.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Amount row */}
      <div className="flex items-baseline gap-2 mb-4">
        <p className="text-2xl font-bold text-gray-900">RD${formatCurrency(recaudado)}</p>
        <p className="text-sm text-gray-400">de RD${formatCurrency(meta)}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-5">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${completed ? 'bg-green-500' : 'bg-gray-900'}`}
          style={{ width: `${Math.max(fasePct, 1)}%` }}
        />
      </div>

      {/* Countdown */}
      {completed ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-base font-bold text-green-600">Meta alcanzada</p>
        </div>
      ) : countdown.expired ? (
        <p className="text-base font-bold text-red-500 text-center py-2">Tiempo agotado</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: countdown.days, label: 'Días' },
            { value: countdown.hours, label: 'Horas' },
            { value: countdown.minutes, label: 'Min' },
            { value: countdown.seconds, label: 'Seg' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white rounded-xl py-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-[10px] text-gray-400 font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [portalEnabled, setPortalEnabled] = useState(true);
  const [causaNombre, setCausaNombre] = useState('');
  const [causaDescripcion, setCausaDescripcion] = useState('');
  const [metaMonto, setMetaMonto] = useState(3000000);
  const [fases, setFases] = useState<FaseData[]>([]);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setPortalEnabled(data.portalEnabled);
        setCausaNombre(data.causaNombre || '');
        setCausaDescripcion(data.causaDescripcion || '');
        setMetaMonto(data.metaMonto ?? 3000000);
        setFases(data.fases || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const formatCurrency = (amount: number) =>
    amount.toLocaleString('es-DO');

  const fasesDonantes = fases.reduce((sum, f) => sum + (f.donantes || 0), 0);
  const fasesRecaudado = fases.reduce((sum, f) => sum + (f.recaudado || 0), 0);
  const metaTotal = fases.length > 0 ? fases.reduce((sum, f) => sum + (f.meta || 0), 0) : metaMonto;
  const pct = metaTotal > 0 ? Math.min(Math.round((fasesRecaudado / metaTotal) * 100), 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-5">
        <Image src="/logo.png" alt="Iglesia Revoluciona" width={96} height={96} className="animate-logo-pulse" priority />
        <div className="w-32 h-1.5 rounded-full animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/imare.jpg"
        alt={causaNombre || 'Iglesia Revoluciona'}
        className="w-full object-cover max-h-[400px]"
      />

      {/* Content */}
      <div className="px-5 py-6 max-w-lg mx-auto">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {causaNombre || 'Iglesia Revoluciona'}
        </h1>

        {/* Organizer */}
        <div className="flex items-center gap-2.5 mb-6">
          <Image src="/logo.png" alt="Iglesia Revoluciona" width={32} height={32} className="rounded-full" />
          <div>
            <p className="text-[11px] text-gray-400 leading-tight">Organizado por</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight">Iglesia Revoluciona</p>
          </div>
        </div>

        {/* Fases */}
        {fases.map((fase, i) => {
          const dl = fase.deadline.includes('+') || fase.deadline.includes('Z')
            ? fase.deadline
            : fase.deadline + ':00-04:00';
          return (
            <FaseCard
              key={i}
              nombre={fase.nombre || `Fase ${i + 1}`}
              meta={fase.meta}
              recaudado={fase.recaudado}
              deadline={new Date(dl)}
              formatCurrency={formatCurrency}
            />
          );
        })}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">{fasesDonantes}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Donantes</p>
              <p className="text-[11px] text-gray-400">{fasesDonantes === 0 ? 'Sin donaciones aún' : `${fasesDonantes} persona${fasesDonantes !== 1 ? 's' : ''}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">{pct}%</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Completado</p>
              <p className="text-[11px] text-gray-400">{pct === 0 ? 'Comenzando' : pct < 50 ? 'En progreso' : pct < 100 ? 'Casi listo' : 'Logrado'}</p>
            </div>
          </div>
        </div>

        {/* Donate button */}
        <button
          onClick={() => setShowModal(true)}
          disabled={!portalEnabled}
          className="w-full bg-gray-900 text-white py-4 rounded-full text-lg font-bold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl mb-8"
        >
          Donar ahora
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        {/* Historia */}
        <div className="border-t border-gray-100 pt-6 pb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Historia</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {causaDescripcion || 'Iglesia Revoluciona es una comunidad de fe comprometida con transformar vidas. Tu donación nos ayuda a seguir construyendo un espacio donde todos puedan encontrar propósito y esperanza.'}
          </p>

          <div className="mt-6 rounded-2xl overflow-hidden bg-white border border-gray-200">
            <Image src="/plano1.png" alt="Plano de construcción" width={600} height={900} className="w-full h-auto" />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Plano del proyecto</p>
        </div>
      </div>

      {/* Modal cuentas bancarias */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8 animate-fade-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <Image src="/logo.png" alt="Iglesia Revoluciona" width={40} height={40} className="rounded-full" />
              <div>
                <p className="text-lg font-bold text-gray-900">Donar ahora</p>
                <p className="text-xs text-gray-400">Elige tu método de pago</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Entidad</p>
                <p className="text-base font-bold text-gray-900">Iglesia Revolucionaria</p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">RNC</p>
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-gray-900 tracking-wide">4-30-38250-7</p>
                  <CopyButton text="430382507" />
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Banco</p>
                <p className="text-base font-bold text-gray-900">Banreservas</p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Cuenta</p>
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-gray-900 tracking-wide">9606691535</p>
                  <CopyButton text="9606691535" />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <a
                href="https://www.paypal.me/REVOLUCIONAIGLESIA"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-[#0070ba] text-white py-3.5 rounded-2xl text-base font-bold hover:bg-[#005ea6] active:bg-[#004d8c] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.648h6.012c1.988 0 3.39.462 4.166 1.374.727.855.96 2.022.69 3.466l-.018.095v.838l.652.33c.552.272.99.593 1.312.964.392.453.644.998.75 1.62.11.644.074 1.39-.103 2.22-.204.953-.533 1.783-.978 2.467a5.1 5.1 0 0 1-1.493 1.56 5.71 5.71 0 0 1-1.869.85c-.676.178-1.438.268-2.264.268h-.538a1.62 1.62 0 0 0-1.6 1.37l-.04.218-.68 4.315-.032.156a.178.178 0 0 1-.05.105.163.163 0 0 1-.106.04H7.076z"/>
                </svg>
                Donar con PayPal
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
