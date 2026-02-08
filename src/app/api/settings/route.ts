import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings, validateSession } from '@/lib/store';

export const dynamic = 'force-dynamic';

// GET /api/settings - Get portal settings
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({
      portalEnabled: settings.portal_enabled,
      causaNombre: settings.causa_nombre || '',
      causaDescripcion: settings.causa_descripcion || '',
    });
  } catch (error) {
    return NextResponse.json({ portalEnabled: true, causaNombre: '', causaDescripcion: '' });
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
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Error updating settings' },
      { status: 500 }
    );
  }
}
