import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';

// 1. Next.js의 캐싱을 완벽하게 차단 (항상 실시간으로 응답하도록 강제)
export const dynamic = 'force-dynamic';
// 2. 서버리스 콜드 스타트 방지
export const runtime = 'edge';

export async function POST(req) {
  try {
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    
    if (!signature || !timestamp) {
        return new Response('Missing headers', { status: 401 });
    }

    const rawBody = await req.text();

    const isValidRequest = verifyKey(
      rawBody,
      signature,
      timestamp,
      process.env.DISCORD_PUBLIC_KEY
    );

    if (!isValidRequest) {
      return new Response('Bad request signature', { status: 401 });
    }

    const message = JSON.parse(rawBody);

    // 3. NextResponse 대신 가장 날것의 표준 Response 객체 사용 (호환성 극대화)
    if (message.type === 1) {
      return new Response(JSON.stringify({ type: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      type: 4, 
      data: { content: "디스코드 봇이 성공적으로 연결되었습니다!" } 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("서버 내부 에러 발생:", error);
    return new Response('Internal Server Error', { status: 500 });
  }
}