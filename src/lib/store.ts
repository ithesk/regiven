import { supabase } from './supabase';

export interface Donation {
  id: string;
  amount: number;
  created_at: string;
}

export interface Settings {
  portal_enabled: boolean;
  causa_nombre: string;
  causa_descripcion: string;
  meta_monto: number;
}

// --- Donations ---

export async function createDonation(amount: number): Promise<Donation> {
  const { data, error } = await supabase
    .from('donations')
    .insert({ amount })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAllDonations(): Promise<Donation[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTotalStats(): Promise<{ count: number; total: number }> {
  const { data, error } = await supabase
    .from('donations')
    .select('amount');

  if (error) throw error;
  const donations = data || [];
  return {
    count: donations.length,
    total: donations.reduce((sum, d) => sum + d.amount, 0),
  };
}

export async function getTodayDonations(): Promise<{ count: number; total: number }> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('donations')
    .select('amount')
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${today}T23:59:59.999`);

  if (error) throw error;
  const donations = data || [];
  return {
    count: donations.length,
    total: donations.reduce((sum, d) => sum + d.amount, 0),
  };
}

// --- Settings ---

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) return { portal_enabled: true, causa_nombre: '', causa_descripcion: '', meta_monto: 3000000 };
  return {
    portal_enabled: data.portal_enabled,
    causa_nombre: data.causa_nombre ?? '',
    causa_descripcion: data.causa_descripcion ?? '',
    meta_monto: data.meta_monto ?? 3000000,
  };
}

export async function updateSettings(fields: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .update(fields)
    .eq('id', 1)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// --- Sessions (stored in Supabase) ---

export async function createSession(sessionId: string): Promise<void> {
  await supabase
    .from('sessions')
    .insert({ id: sessionId, created_at: new Date().toISOString() });
}

export async function validateSession(sessionId: string): Promise<boolean> {
  const { data } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .single();
  return !!data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);
}
