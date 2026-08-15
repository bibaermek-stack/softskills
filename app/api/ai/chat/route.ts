import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_SYSTEM_PROMPT = `Сен — Қазақстан оқушылары, студенттері мен ұстаздарына арналған заманауи виртуалды STEM платформасының ресми ақылды AI көмекшісісің (DeepSeek V4 Flash).

Басты ережелерің:
1. Барлық жауаптарды таза, сауатты қазақ тілінде, жылы әрі жігерлендіретін ғылыми-педагогикалық үнмен бер.
2. Физика, математика, химия, биология, бағдарламалау (Python, JavaScript, робототехника) және икемді дағдылар (Soft Skills, сыни ойлау, көшбасшылық) бойынша терең әрі түсінікті түсіндір.
3. Формулаларды міндетті түрде LaTeX синтаксисімен жаз:
   - Блоктық формулалар үшін: \\[ E = mc^2 \\] немесе $$ E = mc^2 $$
   - Мәтін ішіндегі формулалар үшін: \\( F = ma \\) немесе $ F = ma $
4. Маңызды түсініктерді қара қаріппен (**...**), тармақталған тізімдермен (- немесе 1.) және мысалдармен айқын көрсет.
5. Қажет болса қысқаша мысал есеп немесе өмірден практикалық мысал келтір.`;

const CANDIDATE_MODELS = [
  process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4-flash",
  "deepseek/deepseek-chat",
  "openrouter/free",
];

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OPENROUTER_API_KEY серверде орнатылмаған. .env.local файлын тексеріңіз.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { messages = [], stream = true, customModel } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Хабарламалар (messages) тізімі бос болмауы керек." },
        { status: 400 }
      );
    }

    // Build payload messages with system instruction
    const formattedMessages = [
      { role: "system", content: DEFAULT_SYSTEM_PROMPT },
      ...messages.map((m: { role?: string; sender?: string; content?: string; text?: string }) => ({
        role: m.role || (m.sender === "user" ? "user" : "assistant"),
        content: m.content || m.text || "",
      })),
    ];

    const modelsToTry = customModel
      ? [customModel, ...CANDIDATE_MODELS.filter((m) => m !== customModel)]
      : CANDIDATE_MODELS;

    let lastError: unknown = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://softskills.edu.kz",
            "X-Title": "STEM Dashboard AI Assistant",
          },
          body: JSON.stringify({
            model,
            messages: formattedMessages,
            stream: Boolean(stream),
            temperature: 0.6,
            max_tokens: 2048,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.warn(`Model ${model} failed with status ${response.status}:`, errData);
          lastError = errData;
          continue; // Try next fallback model
        }

        // If streaming is requested and response body is available
        if (stream && response.body) {
          return new Response(response.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
              "X-Used-Model": model,
            },
          });
        }

        // Standard non-streaming JSON response
        const data = await response.json();
        return NextResponse.json({
          text: data.choices?.[0]?.message?.content || "",
          model: data.model || model,
          usage: data.usage,
        });
      } catch (err) {
        console.warn(`Error connecting to model ${model}:`, err);
        lastError = err;
      }
    }

    return NextResponse.json(
      {
        error: "AI қызметіне қосылу кезінде қате орын алды. Қайта көріңіз.",
        details: lastError,
      },
      { status: 502 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Белгісіз қате";
    console.error("AI API route error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
