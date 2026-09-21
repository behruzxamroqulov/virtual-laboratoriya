import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/session';
import { getResourceStats } from '@/lib/monitoring';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: 'Tizimga kirish talab qilinadi.' }, { status: 401 });

  const stats = await getResourceStats();
  return NextResponse.json(stats);
}
