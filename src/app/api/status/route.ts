import { NextResponse } from 'next/server';
import { getDbStatus } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getDbStatus();
    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve database status' },
      { status: 500 }
    );
  }
}
