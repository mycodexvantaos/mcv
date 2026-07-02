export const dynamic = 'force-static';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'hello from the API',
    items: [1, 2, 3, 4, 5],
    status: 'ok',
  });
}
