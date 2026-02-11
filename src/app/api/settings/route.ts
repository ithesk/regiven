import { NextRequest, NextResponse } from 'next/server';
import { getSettings, getTotalStats, getStatsByFase, getMinDonation, updateSettings, validateSession } from '@/lib/store';

export const dynamic = 'force-dynamic';

// GET /api/settings - Get portal settings
export async function GET() {
  try {
    const [settings, stats, faseStats, minDonation] = await Promise.all([getSettings(), getTotalStats(), getStatsByFase(), getMinDonation()]);
    const fasesWithStats = (settings.fases || []).map((f, i) => ({
      ...f,
      recaudado: faseStats[i]?.total ?? 0,
      donantes: faseStats[i]?.count ?? 0,
    }));
    return NextResponse.json({
      portalEnabled: settings.portal_enabled,
      causaNombre: settings.causa_nombre || '',
      causaDescripcion: settings.causa_descripcion || '',
      metaMonto: settings.meta_monto,
      totalRecaudado: stats.total,
      totalCount: stats.count,
      fases: fasesWithStats,
      minDonation,
    });
  } catch (error) {
    return NextResponse.json({ portalEnabled: true, causaNombre: '', causaDescripcion: '', metaMonto: 3000000, totalRecaudado: 0, totalCount: 0, fases: [] });
  }
}

// PUT /api/settings - Update portal settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session');

    if (!sessionCookie || !(await validateSession(sessionCookie.value))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (typeof body.portalEnabled === 'boolean') {
      updates.portal_enabled = body.portalEnabled;
    }
    if (typeof body.causaNombre === 'string') {
      updates.causa_nombre = body.causaNombre;
    }
    if (typeof body.causaDescripcion === 'string') {
      updates.causa_descripcion = body.causaDescripcion;
    }
    if (typeof body.metaMonto === 'number' && body.metaMonto > 0) {
      updates.meta_monto = body.metaMonto;
    }
    if (Array.isArray(body.fases)) {
      updates.fases = body.fases;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updated = await updateSettings(updates);

    return NextResponse.json({
      portalEnabled: updated.portal_enabled,
      causaNombre: updated.causa_nombre || '',
      causaDescripcion: updated.causa_descripcion || '',
      metaMonto: updated.meta_monto,
      fases: updated.fases || [],
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Error updating settings' },
      { status: 500 }
    );
  }
}
