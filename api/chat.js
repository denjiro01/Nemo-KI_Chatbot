export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST-Anfragen erlaubt" });
  }

  try {
    const { model, messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Keine oder ungültige Nachrichten vorhanden" });
    }

    // Setze System-Message, falls noch nicht vorhanden
    const systemMessage = {
      role: "system",
      content: "Du bist ein hilfreicher, freundlicher deutscher Assistent.",
    };

    const fullMessages = messages.some(m => m.role === "system")
      ? messages
      : [systemMessage, ...messages];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "deepseek/deepseek-chat-v3-0324:free",
        messages: fullMessages,
      }),
    });

    // 429 Fehler speziell behandeln und weitergeben
    if (response.status === 429) {
  return res.status(200).json({
    choices: [{
      message: {
        content: "⚠️ Du hast das tägliche Limit erreicht. Bitte warte bis morgen."
      }
    }]
  });
}


    // Andere Fehler abfangen
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fehler von OpenRouter:", response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    // Antwort normal weiterleiten
    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error("Interner Serverfehler:", error);
    res.status(500).json({ error: error.message || "Unbekannter Serverfehler" });
  }
}
