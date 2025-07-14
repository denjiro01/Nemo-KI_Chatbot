export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Only POST allowed");

  const { messages, model } = req.body;

  const systemMessage = {
    role: "system",
    content:
      "Du bist ein hilfreicher, freundlicher deutscher KI-Assistent. Bevor du antwortest, denke laut im Format <think>Deine Gedanken hier</think> nach. Danach gib deine eigentliche Antwort.",
  };

  const fullMessages = [
    ...(messages[0]?.role === "system" ? [] : [systemMessage]),
    ...messages,
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "deepseek/deepseek-chat-v3-0324:free",
        messages: fullMessages,
      }),
    });

    // 🛑 Wenn zu viele Anfragen → gib Hinweis
    if (response.status === 429) {
      return res.status(429).json({
        choices: [{
          message: {
            content: "⚠️ Du hast das tägliche Limit erreicht. Bitte versuche es morgen erneut oder lade Guthaben auf unter https://openrouter.ai/wallet.",
          }
        }]
      });
    }

    // 🛑 Wenn andere Fehler (z. B. 500, 403)
    if (!response.ok) {
      return res.status(response.status).json({
        choices: [{
          message: {
            content: `⚠️ Fehler bei der Anfrage: ${response.status} ${response.statusText}`
          }
        }]
      });
    }

    // ✅ Alles okay → parse Antwort und sende zurück
    const result = await response.json();
    return res.status(200).json(result);

  } catch (error) {
    // 🔥 Netzwerk- oder Parsingfehler
    return res.status(500).json({
      choices: [{
        message: {
          content: `⚠️ Interner Fehler: ${error.message}`
        }
      }]
    });
  }
}
