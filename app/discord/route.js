import { verifyKey } from 'discord-interactions';
import { translate } from '@vitalets/google-translate-api';

export async function POST(req) {
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  const rawBody = await req.text();

  const isValidRequest = verifyKey(
    rawBody, signature, timestamp, process.env.DISCORD_PUBLIC_KEY
  );

  if (!isValidRequest) return new Response('Bad request signature', { status: 401 });

  const body = JSON.parse(rawBody);
  if (body.type === 1) return Response.json({ type: 1 });

  if (body.type === 2 && body.data.name === '번역') {
    const textToTranslate = body.data.options[0].value;
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(textToTranslate);
    const targetLang = hasKorean ? 'en' : 'ko';
    const targetFlag = hasKorean ? '🇺🇸' : '🇰🇷';

    try {
      const res = await translate(textToTranslate, { to: targetLang });
      return Response.json({
        type: 4, 
        data: { content: `🌍 **원문:** ${textToTranslate}\n${targetFlag} **번역:** ${res.text}` }
      });
    } catch (error) {
      return Response.json({ type: 4, data: { content: '번역 처리 중 문제가 발생했습니다.' } });
    }
  }
  return new Response('Not found', { status: 404 });
}