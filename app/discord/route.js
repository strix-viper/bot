import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';

// 캐싱 강제 차단
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing headers' }, { status: 401 });
    }

    // 💡 핵심: Next.js의 텍스트 파싱(req.text) 간섭을 막기 위해 바이트(Buffer) 단위로 직접 추출
    const arrayBuffer = await req.arrayBuffer();
    const rawBody = Buffer.from(arrayBuffer).toString('utf8');

    const isValidRequest = verifyKey(
      rawBody,
      signature,
      timestamp,
      process.env.DISCORD_PUBLIC_KEY
    );

    if (!isValidRequest) {
      console.error("서명 검증 실패 - PUBLIC KEY 오류");
      return NextResponse.json({ error: 'Bad request signature' }, { status: 401 });
    }

    const message = JSON.parse(rawBody);
    
    // 💡 로그에 이 메시지가 찍히는지 확인하기 위한 트래커
    console.log("✅ 인증 성공! 디스코드 메시지 타입:", message.type);

    if (message.type === 1) {
      // NextResponse를 활용하여 가장 완벽한 형태의 JSON 응답 강제
      return NextResponse.json({ type: 1 }, { status: 200 });
    }

    return NextResponse.json({ 
      type: 4, 
      data: { content: "봇 연결 성공!" } 
    }, { status: 200 });

  } catch (error) {
    console.error("🚨 서버 내부 크래시 발생:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}