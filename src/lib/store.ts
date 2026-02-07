import { supabase } from './supabase';

export interface Donation {
  id: string;
  amount: number;
  created_at: string;
}

export interface Settings {
  portal_enabled: boolean;
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
    .select('portal_enabled')
    .eq('id', 1)
    .single();

  if (error) return { portal_enabled: true }; // default
  return data;
}

export async function updateSettings(portal_enabled: boolean): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .update({ portal_enabled })
    .eq('id', 1)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// --- Sessions (still in-memory, fine for MVP) ---

const globalStore = globalThis as any;
if (!globalStore.__sessions) {
  globalStore.__sessions = new Set<string>();
}
const sessions: Set<string> = globalStore.__sessions;

export function createSession(sessionId: string): void {
  sessions.add(sessionId);
}

export function validateSession(sessionId: string): boolean {
  return sessions.has(sessionId);
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}
