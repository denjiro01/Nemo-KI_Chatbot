export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Only POST allowed");

  const { messages } = req.body;

  const systemMessage = {
    role: "system",
    content:
      "Du bist ein hilfreicher, freundlicher deutscher KI-Assistent. Bevor du antwortest, denke laut im Format <think>Deine Gedanken hier</think> nach. Danach gib deine eigentliche Antwort.",
  };

  const fullMessages = [
    ...(messages[0]?.role === "system" ? [] : [systemMessage]),
    ...messages,
  ];

  // Modelle in Reihenfolge der Priorität
  const modelFallbacks = [
    "deepseek/deepseek-chat-v3-0324:free",
    "deepseek/deepseek-chat-r1-0528:free",
  ];

  let lastError = null;

  for (const model of modelFallbacks) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.OPENROUTER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: fullMessages,
        }),
      });

      if (response.status === 429) {
        return res.status(429).json({
          choices: [{
            message: {
              content: "⚠️ Du hast das tägliche Limit erreicht. Bitte warte bis morgen oder lade Guthaben auf unter https://openrouter.ai/wallet.",
            }
          }]
        });
      }

      if (!response.ok) {
        lastError = `Modell ${model} fehlgeschlagen: ${response.status}`;
        continue;
      }

      const result = await response.json();
      return res.status(200).json(result);

    } catch (err) {
      lastError = `Modell ${model} hat folgenden Fehler geworfen: ${err.message}`;
    }
  }

  return res.status(500).json({
    error: "❌ Alle Modelle fehlgeschlagen.",
    detail: lastError,
  });
}
