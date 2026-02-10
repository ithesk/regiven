'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Donation {
  id: string;
  amount: number;
  donorName: string;
  via: string;
  comment: string;
  fase: number | null;
  createdAt: string;
}

interface Stats {
  totalCount: number;
  totalAmount: number;
  todayCount: number;
  todayAmount: number;
}

interface Fase {
  nombre: string;
  meta: string;
  deadline: string;
}

type FilterPreset = 'all' | 'today' | 'week' | 'month' | 'custom';

export default function AdminDashboard() {
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCount: 0,
    totalAmount: 0,
    todayCount: 0,
    todayAmount: 0,
  });
  const [portalEnabled, setPortalEnabled] = useState(true);
  const [causaNombre, setCausaNombre] = useState('');
  const [causaDescripcion, setCausaDescripcion] = useState('');
  const [metaMonto, setMetaMonto] = useState('3000000');
  const [fases, setFases] = useState<Fase[]>([]);
  const [isSavingCausa, setIsSavingCausa] = useState(false);
  const [causaSaved, setCausaSaved] = useState(false);
  const [causaOpen, setCausaOpen] = useState(false);
  const [fasesOpen, setFasesOpen] = useState(false);
  const [isSavingFases, setIsSavingFases] = useState(false);
  const [fasesSaved, setFasesSaved] = useState(false);
  const isEditingCausa = useRef(false);
  const isEditingFases = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingPortal, setIsTogglingPortal] = useState(false);

  // New donation form
  const [newDonOpen, setNewDonOpen] = useState(false);
  const [newDonName, setNewDonName] = useState('');
  const [newDonAmount, setNewDonAmount] = useState('');
  const [newDonVia, setNewDonVia] = useState('');
  const [newDonComment, setNewDonComment] = useState('');
  const [newDonFase, setNewDonFase] = useState('');
  const [isCreatingDon, setIsCreatingDon] = useState(false);

  // Filters
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hourFrom, setHourFrom] = useState('');
  const [hourTo, setHourTo] = useState('');

  const fetchData = async () => {
    try {
      const [donationsRes, settingsRes] = await Promise.all([
        fetch('/api/donations'),
        fetch('/api/settings'),
      ]);

      if (donationsRes.status === 401 || settingsRes.status === 401) {
        router.push('/admin');
        return;
      }

      const donationsData = await donationsRes.json();
      const settingsData = await settingsRes.json();

      if (donationsData.success) {
        setDonations(donationsData.donations);
        setStats(donationsData.stats);
      }

      if (settingsData) {
        setPortalEnabled(settingsData.portalEnabled);
        if (!isEditingCausa.current) {
          setCausaNombre(settingsData.causaNombre || '');
          setCausaDescripcion(settingsData.causaDescripcion || '');
          setMetaMonto(String(settingsData.metaMonto ?? 3000000));
        }
        if (!isEditingFases.current) {
          const f = (settingsData.fases || []).map((fase: any) => ({
            nombre: fase.nombre || '',
            meta: String(fase.meta || 0),
            deadline: fase.deadline || '',
          }));
          setFases(f);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const handleTogglePortal = async () => {
    setIsTogglingPortal(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalEnabled: !portalEnabled }),
      });
      if (response.ok) {
        const data = await response.json();
        setPortalEnabled(data.portalEnabled);
      }
    } catch (error) {
      console.error('Error toggling portal:', error);
    } finally {
      setIsTogglingPortal(false);
    }
  };

  const handleSaveCausa = async () => {
    setIsSavingCausa(true);
    setCausaSaved(false);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ causaNombre, causaDescripcion, metaMonto: Number(metaMonto) || 3000000 }),
      });
      if (response.ok) {
        setCausaSaved(true);
        isEditingCausa.current = false;
      }
    } catch (error) {
      console.error('Error saving causa:', error);
    } finally {
      setIsSavingCausa(false);
    }
  };

  const handleSaveFases = async () => {
    setIsSavingFases(true);
    setFasesSaved(false);
    try {
      const payload = fases.map((f) => ({
        nombre: f.nombre,
        meta: Number(f.meta) || 0,
        deadline: f.deadline,
      }));
      // Also recalculate total meta from phases
      const totalMeta = payload.reduce((sum, f) => sum + f.meta, 0);
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fases: payload, metaMonto: totalMeta || Number(metaMonto) || 3000000 }),
      });
      if (response.ok) {
        setFasesSaved(true);
        setMetaMonto(String(totalMeta || metaMonto));
        isEditingFases.current = false;
      }
    } catch (error) {
      console.error('Error saving fases:', error);
    } finally {
      setIsSavingFases(false);
    }
  };

  const addFase = () => {
    setFases([...fases, { nombre: `Fase ${fases.length + 1}`, meta: '', deadline: '' }]);
    isEditingFases.current = true;
    setFasesSaved(false);
  };

  const removeFase = (index: number) => {
    setFases(fases.filter((_, i) => i !== index));
    isEditingFases.current = true;
    setFasesSaved(false);
  };

  const updateFase = (index: number, field: keyof Fase, value: string) => {
    const updated = [...fases];
    updated[index] = { ...updated[index], [field]: value };
    setFases(updated);
    isEditingFases.current = true;
    setFasesSaved(false);
  };

  const handleCreateDonation = async () => {
    const amount = Number(newDonAmount);
    if (!amount || amount <= 0) return;
    setIsCreatingDon(true);
    try {
      const faseVal = newDonFase !== '' ? Number(newDonFase) : null;
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          donorName: newDonName,
          via: newDonVia,
          comment: newDonComment,
          fase: faseVal,
        }),
      });
      if (response.ok) {
        setNewDonName('');
        setNewDonAmount('');
        setNewDonVia('');
        setNewDonComment('');
        setNewDonOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating donation:', error);
    } finally {
      setIsCreatingDon(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      router.push('/admin');
    } catch {
      router.push('/admin');
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
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

  // Apply preset filter
  const handlePreset = (preset: FilterPreset) => {
    setFilterPreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setDateFrom(todayStr);
      setDateTo(todayStr);
      setHourFrom('');
      setHourTo('');
    } else if (preset === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      setDateFrom(weekAgo.toISOString().split('T')[0]);
      setDateTo(todayStr);
      setHourFrom('');
      setHourTo('');
    } else if (preset === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      setDateFrom(monthAgo.toISOString().split('T')[0]);
      setDateTo(todayStr);
      setHourFrom('');
      setHourTo('');
    } else if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
      setHourFrom('');
      setHourTo('');
    }
  };

  // Filtered donations
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const date = new Date(d.createdAt);
      const dateStr = date.toISOString().split('T')[0];
      const hour = date.getHours();
      const minute = date.getMinutes();
      const timeVal = hour * 60 + minute;

      if (dateFrom && dateStr < dateFrom) return false;
      if (dateTo && dateStr > dateTo) return false;

      if (hourFrom) {
        const [hf, mf] = hourFrom.split(':').map(Number);
        if (timeVal < hf * 60 + mf) return false;
      }
      if (hourTo) {
        const [ht, mt] = hourTo.split(':').map(Number);
        if (timeVal > ht * 60 + mt) return false;
      }

      return true;
    });
  }, [donations, dateFrom, dateTo, hourFrom, hourTo]);

  // Filtered stats
  const filteredStats = useMemo(() => {
    return {
      count: filteredDonations.length,
      total: filteredDonations.reduce((sum, d) => sum + d.amount, 0),
    };
  }, [filteredDonations]);

  // Group by day
  const dailySummary = useMemo(() => {
    const grouped: Record<string, { count: number; total: number }> = {};
    filteredDonations.forEach((d) => {
      const day = new Date(d.createdAt).toISOString().split('T')[0];
      if (!grouped[day]) grouped[day] = { count: 0, total: 0 };
      grouped[day].count++;
      grouped[day].total += d.amount;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({ date, ...data }));
  }, [filteredDonations]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center animate-logo-pulse">
          <span className="text-white text-lg font-bold">re</span>
        </div>
        <div className="w-28 h-1.5 rounded-full animate-shimmer" />
      </div>
    );
  }

  const hasFilter = dateFrom || dateTo || hourFrom || hourTo;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">re</span>
              </div>
              <h1 className="text-xl font-bold text-black">Panel Admin</h1>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-black font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Portal Toggle */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-black mb-1">
                Estado del Portal
              </h2>
              <p className="text-sm text-gray-500">
                {portalEnabled
                  ? 'El portal de ofrendas está activo'
                  : 'El portal de ofrendas está deshabilitado'}
              </p>
            </div>
            <button
              onClick={handleTogglePortal}
              disabled={isTogglingPortal}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                portalEnabled ? 'bg-black' : 'bg-gray-300'
              } ${isTogglingPortal ? 'opacity-50' : ''}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  portalEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Causa Editor (collapsible) */}
        <div className="bg-white rounded-xl shadow-sm mb-5">
          <button
            onClick={() => setCausaOpen(!causaOpen)}
            className="w-full flex items-center justify-between p-5"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-black">Causa / Ofrenda</h2>
              {causaNombre && !causaOpen && (
                <span className="text-xs text-gray-400 truncate max-w-[200px]">{causaNombre}</span>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${causaOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {causaOpen && (
            <div className="px-5 pb-5 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre de la causa</label>
                <input
                  type="text"
                  value={causaNombre}
                  onChange={(e) => { setCausaNombre(e.target.value); setCausaSaved(false); isEditingCausa.current = true; }}
                  placeholder="Ej: Construcción del templo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                <textarea
                  value={causaDescripcion}
                  onChange={(e) => { setCausaDescripcion(e.target.value); setCausaSaved(false); isEditingCausa.current = true; }}
                  placeholder="Ej: Tu ofrenda será destinada a la construcción del nuevo templo"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Meta de recaudación (RD$)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={metaMonto}
                  onChange={(e) => { setMetaMonto(e.target.value.replace(/[^0-9]/g, '')); setCausaSaved(false); isEditingCausa.current = true; }}
                  placeholder="3000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveCausa}
                  disabled={isSavingCausa}
                  className="px-5 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSavingCausa ? 'Guardando...' : 'Guardar'}
                </button>
                {causaSaved && (
                  <span className="text-sm text-green-600 font-medium">Guardado</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fases / Metas (collapsible) */}
        <div className="bg-white rounded-xl shadow-sm mb-5">
          <button
            onClick={() => setFasesOpen(!fasesOpen)}
            className="w-full flex items-center justify-between p-5"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-black">Fases / Metas</h2>
              {!fasesOpen && (
                <span className="text-xs text-gray-400">{fases.length} fase{fases.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${fasesOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {fasesOpen && (
            <div className="px-5 pb-5 space-y-4">
              {fases.map((fase, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3 relative">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-black">Fase {i + 1}</p>
                    <button
                      onClick={() => removeFase(i)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={fase.nombre}
                      onChange={(e) => updateFase(i, 'nombre', e.target.value)}
                      placeholder="Ej: Fase 1 - Estructura"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Meta (RD$)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={fase.meta}
                        onChange={(e) => updateFase(i, 'meta', e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="1500000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fecha límite</label>
                      <input
                        type="datetime-local"
                        value={fase.deadline}
                        onChange={(e) => updateFase(i, 'deadline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addFase}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700"
              >
                + Agregar fase
              </button>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveFases}
                  disabled={isSavingFases}
                  className="px-5 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSavingFases ? 'Guardando...' : 'Guardar fases'}
                </button>
                {fasesSaved && (
                  <span className="text-sm text-green-600 font-medium">Guardado</span>
                )}
                {fases.length > 0 && (
                  <span className="text-xs text-gray-400 ml-auto">
                    Meta total: RD${formatCurrency(fases.reduce((s, f) => s + (Number(f.meta) || 0), 0))}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-1">Total General</p>
            <p className="text-2xl font-bold text-black">{stats.totalCount}</p>
            <p className="text-xs text-gray-400">donaciones</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-1">Monto General</p>
            <p className="text-xl font-bold text-black">
              RD${formatCurrency(stats.totalAmount)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-1">Hoy</p>
            <p className="text-2xl font-bold text-black">{stats.todayCount}</p>
            <p className="text-xs text-gray-400">donaciones</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-xs text-gray-500 mb-1">Monto Hoy</p>
            <p className="text-xl font-bold text-black">
              RD${formatCurrency(stats.todayAmount)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
          <h2 className="text-base font-semibold text-black mb-3">Filtros</h2>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all' as FilterPreset, label: 'Todo' },
              { key: 'today' as FilterPreset, label: 'Hoy' },
              { key: 'week' as FilterPreset, label: 'Última semana' },
              { key: 'month' as FilterPreset, label: 'Último mes' },
              { key: 'custom' as FilterPreset, label: 'Personalizado' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handlePreset(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterPreset === key
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom Date/Time Inputs */}
          {filterPreset === 'custom' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha desde</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha hasta</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hora desde</label>
                <input
                  type="time"
                  value={hourFrom}
                  onChange={(e) => setHourFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hora hasta</label>
                <input
                  type="time"
                  value={hourTo}
                  onChange={(e) => setHourTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          )}

          {/* Filtered Stats */}
          {hasFilter && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-gray-500">Filtrado: donaciones</p>
                <p className="text-xl font-bold text-black">{filteredStats.count}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Filtrado: monto</p>
                <p className="text-xl font-bold text-black">
                  RD${formatCurrency(filteredStats.total)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Daily Summary */}
        {hasFilter && dailySummary.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-black">Resumen por Día</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donaciones</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dailySummary.map((day) => (
                    <tr key={day.date} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium text-black">
                        {formatDate(day.date + 'T00:00:00')}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{day.count}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-black">
                        RD${formatCurrency(day.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Donation (collapsible) */}
        <div className="bg-white rounded-xl shadow-sm mb-5">
          <button
            onClick={() => setNewDonOpen(!newDonOpen)}
            className="w-full flex items-center justify-between p-5"
          >
            <h2 className="text-base font-semibold text-black">+ Agregar Donación</h2>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${newDonOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {newDonOpen && (
            <div className="px-5 pb-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nombre del donante</label>
                  <input
                    type="text"
                    value={newDonName}
                    onChange={(e) => setNewDonName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Monto (RD$)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newDonAmount}
                    onChange={(e) => setNewDonAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Vía</label>
                <select
                  value={newDonVia}
                  onChange={(e) => setNewDonVia(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Comentario</label>
                  <input
                    type="text"
                    value={newDonComment}
                    onChange={(e) => setNewDonComment(e.target.value)}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fase</label>
                  <select
                    value={newDonFase}
                    onChange={(e) => setNewDonFase(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="">Sin fase</option>
                    {fases.map((f, i) => (
                      <option key={i} value={i}>{f.nombre || `Fase ${i + 1}`}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleCreateDonation}
                disabled={isCreatingDon || !newDonAmount}
                className="px-5 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {isCreatingDon ? 'Guardando...' : 'Registrar donación'}
              </button>
            </div>
          )}
        </div>

        {/* Donations Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-black">
              Historial de Donaciones
              {hasFilter && (
                <span className="text-sm font-normal text-gray-400 ml-2">
                  ({filteredDonations.length} resultados)
                </span>
              )}
            </h2>
          </div>

          {filteredDonations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">
                {hasFilter
                  ? 'No hay donaciones en el rango seleccionado'
                  : 'No hay donaciones registradas'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donante</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vía</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comentario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fase</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDonations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-black">
                        {donation.donorName || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-black">
                        RD${formatCurrency(donation.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {donation.via || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                        {donation.comment || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {donation.fase !== null && donation.fase !== undefined
                          ? (fases[donation.fase]?.nombre || `Fase ${donation.fase + 1}`)
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(donation.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatTime(donation.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
