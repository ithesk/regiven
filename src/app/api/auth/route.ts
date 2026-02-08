import { NextRequest, NextResponse } from 'next/server';
import { createSession, deleteSession } from '@/lib/store';

// POST /api/auth - Login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const ADMIN_USER = process.env.ADMIN_USER || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'regiven2024';

    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
      // Create session
      const sessionId = Math.random().toString(36).substring(2, 15);
      await createSession(sessionId);

      // Create response with cookie
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
      });

      response.cookies.set('admin_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error logging in' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth - Logout
export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session');

    if (sessionCookie) {
      await deleteSession(sessionCookie.value);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

    response.cookies.delete('admin_session');

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error logging out' },
      { status: 500 }
    );
  }
}
