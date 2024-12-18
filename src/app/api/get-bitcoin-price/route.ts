import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'edge';

export async function GET(request: Request) {
  // Simulate random bitcoin price between 20k and 60k
  const price = Math.floor(Math.random() * (60000 - 20000) + 20000);


  return NextResponse.json({
    price,
    timestamp: new Date().toISOString(),
    request: request.body
  });
}


export const POST = async (request: Request) => {

  return NextResponse.json({
    ...request.body,
    timestamp: new Date().toISOString()
  });
}




