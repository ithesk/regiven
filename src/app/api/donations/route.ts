import { NextRequest, NextResponse } from 'next/server';
import {
  createDonation,
  getAllDonations,
  validateSession,
  getTodayDonations,
  getTotalStats,
} from '@/lib/store';

export const dynamic = 'force-dynamic';

// POST /api/donations - Create a new donation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const donation = await createDonation(amount);

    return NextResponse.json({
      success: true,
      donation: {
        ...donation,
        createdAt: donation.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    return NextResponse.json(
      { success: false, error: 'Error creating donation' },
      { status: 500 }
    );
  }
}

// GET /api/donations - Get all donations (admin only)
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session');

    if (!sessionCookie || !(await validateSession(sessionCookie.value))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [donations, todayStats, totalStats] = await Promise.all([
      getAllDonations(),
      getTodayDonations(),
      getTotalStats(),
    ]);

    return NextResponse.json({
      success: true,
      donations: donations.map(d => ({
        ...d,
        createdAt: d.created_at,
      })),
      stats: {
        totalCount: totalStats.count,
        totalAmount: totalStats.total,
        todayCount: todayStats.count,
        todayAmount: todayStats.total,
      },
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching donations' },
      { status: 500 }
    );
  }
}
