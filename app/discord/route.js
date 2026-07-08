import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';

// ✨ 가장 핵심: Vercel 서버의 콜드 스타트(수면 모드) 딜레이를 없애기 위해 Edge 환경으로 설정
export const runtime = 'edge';

export async function POST(req) {
  try {
    // 1. 디스코드에서 보낸 보안 헤더 가져오기
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    
    // 비정상적인 접근(헤더 누락) 시 바로 튕겨내기
    if (!signature || !timestamp) {
        return NextResponse.json({ error: 'Missing headers' }, { status: 401 });
    }

    // 2. 인증을 위해 본문을 원시 텍스트(Raw Text)로 추출
    const rawBody = await req.text();

    // 3. Vercel 환경변수(Public Key)를 사용해 서명 검증
    const isValidRequest = verifyKey(
      rawBody,
      signature,
      timestamp,
      process.env.DISCORD_PUBLIC_KEY
    );

    // 4. 인증 실패 시 401 Unauthorized 반환 (디스코드가 아닌 접근 차단)
    if (!isValidRequest) {
      return NextResponse.json({ error: 'Bad request signature' }, { status: 401 });
    }

    // 5. 인증 성공! 본문을 JSON 객체로 변환
    const message = JSON.parse(rawBody);

    // 디스코드의 연결 확인(Ping, type 1) 요청에 정상적으로 응답 (가장 중요한 부분)
    if (message.type === 1) {
      return NextResponse.json({ type: 1 });
    }

    // 6. 핑 이외의 실제 명령어 요청이 들어왔을 때의 기본 응답 (타입 4)
    return NextResponse.json({ 
      type: 4, 
      data: { content: "디스코드 봇이 성공적으로 연결되었습니다!" } 
    });

  } catch (error) {
    // 코드 실행 중 서버 에러가 나면 500 반환 후 로그 출력
    console.error("서버 내부 에러 발생:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}