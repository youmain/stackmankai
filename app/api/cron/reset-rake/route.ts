import { NextResponse } from 'next/server';
import { applyStackResetAndRake } from '@/lib/firestore';

export async function POST(request: Request) {
  // 認証トークンやIP制限などでアクセスを保護することを推奨します。
  // 例: if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new NextResponse('Unauthorized', { status: 401 });
  // }

  try {
    console.log('Starting scheduled stack reset and rake process...');
    await applyStackResetAndRake();
    console.log('Scheduled stack reset and rake process completed.');
    return NextResponse.json({ message: 'Stack reset and rake applied successfully.' });
  } catch (error) {
    console.error('Error applying stack reset and rake:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Error applying stack reset and rake.', error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
