import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';

export async function POST(req) {
  // 1. 디스코드에서 보낸 보안 헤더 가져오기
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  
  // 2. 인증을 위해 본문을 원시 텍스트(Raw Text)로 추출 (이 부분이 가장 에러가 잦습니다)
  const rawBody = await req.text();

  try {
    // 3. Vercel 환경변수(Public Key)를 사용해 서명 검증
    const isValidRequest = verifyKey(
      rawBody,
      signature,
      timestamp,
      process.env.DISCORD_PUBLIC_KEY
    );

    // 4. 인증 실패 시 401 Unauthorized 반환
    if (!isValidRequest) {
      return NextResponse.json({ error: 'Bad request signature' }, { status: 401 });
    }

    // 5. 인증 성공! 디스코드의 연결 확인(Ping, type 1) 요청에 응답
    const message = JSON.parse(rawBody);
    if (message.type === 1) {
      return NextResponse.json({ type: 1 });
    }

    // 6. 핑 이외의 실제 명령어 요청이 들어왔을 때의 기본 응답
    return NextResponse.json({ 
      type: 4, 
      data: { content: "명령어가 정상적으로 수신되었습니다!" } 
    });

  } catch (error) {
    // 코드 실행 중 서버 에러가 나면 500 반환
    console.error("서버 에러 발생:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}