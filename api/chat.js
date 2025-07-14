export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Only POST allowed");

  const { messages, model } = req.body;

  // Stelle sicher, dass immer ein System-Prompt mit <think> verwendet wird
  const systemMessage = {
    role: "system",
    content:
      "Du bist ein hilfreicher, freundlicher deutscher KI-Assistent. Bevor du antwortest, denke laut im Format <think>Deine Gedanken hier</think> nach. Danach gib deine eigentliche Antwort.",
  };

  const fullMessages = [
    // Falls vom Frontend schon ein system-Prompt gesendet wird, ersetze ihn
    ...(messages[0]?.role === "system" ? [] : [systemMessage]),
    ...messages,
  ];

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

  const result = await response.json();
  res.status(200).json(result);
}
