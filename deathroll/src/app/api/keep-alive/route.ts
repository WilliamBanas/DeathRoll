import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const CRON_SECRET = process.env.CRON_SECRET;

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ message: 'Accès interdit' }, { status: 403 });
  }

  console.log('Cronjob exécuté avec succès');

  return NextResponse.json(null, { status: 204 });
}
