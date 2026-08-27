// app/api/chat/route.ts
import { siteConfig } from '../../../siteConfig';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.LLM_API_KEY?.trim();
    if (!apiKey) return new Response(JSON.stringify({ error: "Key missing" }), { status: 500 });

    const baseURL = process.env.LLM_BASE_URL || 'https://api.deepseek.com';
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: siteConfig.geminiConfig.systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: siteConfig.geminiConfig.maxOutputTokens,
        temperature: siteConfig.geminiConfig.temperature,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'LLM Error' }), { status: response.status });
    }
    const reply = data.choices?.[0]?.message?.content || "本喵现在不想理你喵...";
    return new Response(JSON.stringify({ reply }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: "Ready", model: "DeepSeek" }), { status: 200 });
}
