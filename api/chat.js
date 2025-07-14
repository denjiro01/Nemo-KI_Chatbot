try {
  const response = await fetch("https://nemo-ki-chatbot-new.vercel.app/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [
        { role: "system", content: "Du bist ein hilfreicher, freundlicher deutscher Assistent." },
        { role: "user", content: text }
      ],
    }),
  });

  // Bei 429-Fehler spezielle Nachricht anzeigen
  if (response.status === 429) {
    removeLoading();
    const botMsg = document.createElement('div');
    botMsg.classList.add('message', 'bot');
    botMsg.textContent = "⚠️ Du hast das tägliche Limit erreicht. Bitte warte bis morgen oder lade Guthaben auf unter https://openrouter.ai/wallet.";
    chatMessages.appendChild(botMsg);
    scrollToBottom();
    return;
  }

  const data = await response.json();
  removeLoading();

  const fullText = data.choices?.[0]?.message?.content || "⚠️ Keine gültige Antwort erhalten.";

  const botMsg = document.createElement('div');
  botMsg.classList.add('message', 'bot');

  const thinkMatch = fullText.match(/<think>([\s\S]*?)<\/think>/i);
  const sichtbarerText = fullText.replace(/<think>[\s\S]*?<\/think>/i, "").trim();

  const antwortDiv = document.createElement('div');
  antwortDiv.innerHTML = marked.parse(sichtbarerText);
  Prism.highlightAll();

  if (thinkMatch) {
    const gedankenText = thinkMatch[1].trim();

    const toggleBtn = document.createElement('button');
    toggleBtn.classList.add('toggle-btn');
    toggleBtn.textContent = "🧠 Gedanken anzeigen";

    const gedankenDiv = document.createElement('div');
    gedankenDiv.textContent = gedankenText;
    gedankenDiv.style.display = "none";
    gedankenDiv.style.marginTop = "0.5rem";
    gedankenDiv.style.fontStyle = "italic";
    gedankenDiv.style.background = "#002233";
    gedankenDiv.style.padding = "0.6rem 1rem";
    gedankenDiv.style.borderRadius = "12px";
    gedankenDiv.style.boxShadow = "inset 0 0 6px #00fff7aa";

    toggleBtn.onclick = () => {
      const sichtbar = gedankenDiv.style.display === "block";
      if (sichtbar) {
        gedankenDiv.style.display = "none";
        gedankenDiv.classList.remove("gedanken-visible");
        toggleBtn.textContent = "🧠 Gedanken anzeigen";
      } else {
        gedankenDiv.style.display = "block";
        gedankenDiv.classList.add("gedanken-visible");
        toggleBtn.textContent = "🧠 Gedanken ausblenden";
      }
    };

    botMsg.appendChild(antwortDiv);
    botMsg.appendChild(toggleBtn);
    botMsg.appendChild(gedankenDiv);
  } else {
    botMsg.appendChild(antwortDiv);
  }

  chatMessages.appendChild(botMsg);
  scrollToBottom();

} catch (error) {
  removeLoading();
  const errMsg = document.createElement('div');
  errMsg.classList.add('message', 'bot');
  errMsg.textContent = "⚠️ Netzwerkfehler oder ungültige Antwort: " + error.message;
  chatMessages.appendChild(errMsg);
  scrollToBottom();
}
