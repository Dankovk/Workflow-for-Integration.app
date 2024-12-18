import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = request.body

  return NextResponse.json({
    received: body,
    timestamp: new Date().toISOString()
  });
}

export async function GET() {
  return NextResponse.json({
    message: "This endpoint accepts POST requests",
    timestamp: new Date().toISOString()
  });
}
