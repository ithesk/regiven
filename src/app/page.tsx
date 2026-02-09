'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

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

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [portalEnabled, setPortalEnabled] = useState(true);
  const [causaNombre, setCausaNombre] = useState('');
  const [causaDescripcion, setCausaDescripcion] = useState('');
  const [metaMonto, setMetaMonto] = useState(3000000);
  const [totalRecaudado, setTotalRecaudado] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setPortalEnabled(data.portalEnabled);
        setCausaNombre(data.causaNombre || '');
        setCausaDescripcion(data.causaDescripcion || '');
        setMetaMonto(data.metaMonto ?? 3000000);
        setTotalRecaudado(data.totalRecaudado ?? 0);
        setTotalCount(data.totalCount ?? 0);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const formatCurrency = (amount: number) =>
    amount.toLocaleString('es-DO');

  const pct = metaMonto > 0 ? Math.min(Math.round((totalRecaudado / metaMonto) * 100), 100) : 0;

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
      <div className="w-full relative overflow-hidden bg-black aspect-[4/3] max-h-[400px]">
        <Image
          src="/imare.jpg"
          alt={causaNombre || 'Iglesia Revoluciona'}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Content */}
      <div className="px-5 py-6 max-w-lg mx-auto">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {causaNombre || 'Iglesia Revoluciona'}
        </h1>

        {/* Organizer */}
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/logo.png"
            alt="Iglesia Revoluciona"
            width={36}
            height={36}
            className="rounded-full"
          />
          <div>
            <p className="text-xs text-gray-400">Organizado por</p>
            <p className="text-sm font-semibold text-gray-900">Iglesia Revoluciona</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Raised / Meta */}
        <div className="flex items-baseline justify-between mb-6">
          <p className="text-base">
            <span className="font-bold text-gray-900">RD${formatCurrency(totalRecaudado)}</span>{' '}
            <span className="text-gray-400 text-sm">recaudado de RD${formatCurrency(metaMonto)}</span>
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 rounded-2xl py-4 text-center">
            <p className="text-xl font-bold text-gray-900">{totalCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Donantes</p>
          </div>
          <div className="bg-gray-50 rounded-2xl py-4 text-center">
            <p className="text-xl font-bold text-gray-900">{pct}%</p>
            <p className="text-xs text-gray-400 mt-0.5">Completado</p>
          </div>
          <div className="bg-gray-50 rounded-2xl py-4 text-center">
            <p className="text-xl font-bold text-gray-900">Meta</p>
            <p className="text-xs text-gray-400 mt-0.5">RD${formatCurrency(metaMonto)}</p>
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

          {/* Plano */}
          <div className="mt-6 rounded-2xl overflow-hidden bg-white border border-gray-200">
            <Image
              src="/plano1.png"
              alt="Plano de construcción"
              width={600}
              height={900}
              className="w-full h-auto"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Plano del proyecto</p>
        </div>
      </div>

      {/* Modal cuentas bancarias */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8 animate-fade-in">
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Image src="/logo.png" alt="Iglesia Revoluciona" width={40} height={40} className="rounded-full" />
              <div>
                <p className="text-lg font-bold text-gray-900">Donar ahora</p>
                <p className="text-xs text-gray-400">Transferencia bancaria</p>
              </div>
            </div>

            {/* Cuenta info */}
            <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Entidad</p>
                <p className="text-base font-bold text-gray-900">Iglesia Revoluciona</p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">RNC</p>
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-gray-900 tracking-wide">4-20-35200-3-7</p>
                  <CopyButton text="4203520037" />
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
          </div>
        </div>
      )}
    </div>
  );
}
