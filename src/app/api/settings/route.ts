import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings, validateSession } from '@/lib/store';

export const dynamic = 'force-dynamic';

// GET /api/settings - Get portal settings
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ portalEnabled: settings.portal_enabled });
  } catch (error) {
    return NextResponse.json({ portalEnabled: true });
  }
}

// PUT /api/settings - Update portal settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session');

    if (!sessionCookie || !validateSession(sessionCookie.value)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { portalEnabled } = body;

    if (typeof portalEnabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid portalEnabled value' },
        { status: 400 }
      );
    }

    const updated = await updateSettings(portalEnabled);

    return NextResponse.json({ portalEnabled: updated.portal_enabled });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Error updating settings' },
      { status: 500 }
    );
  }
}
