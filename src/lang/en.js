export default {
  "greeting": "Hello! I am an AI assistant created to answer your questions and help you. If you have any questions or need help, feel free to contact!",
  "help": "This bot can ...",

  "command.start": "Run bot within current chat",
  "command.settings": "Bot configuration menu for current chat",
  "command.balance": "Get your tokens balance",
  "command.help": "What this bot can do",

  "balance.message": "You have {{tokens}} tokens left. You receive {{dailyTokens}} tokens once in a day if your balance is less than {{startTokens}}.",

  "error.noimage": "No image provided",
  "error.image-not-found": "Image not found",
  "error.process-image-failed": "Failed to process image",
  "error.generate-image-failed": "Failed to generate image",

  "action.split": "🔢 Split",
  "action.regenerate": "🔁 Regenerate",
  "action.variate": "🔄 Variate",
  "action.variateHigh": "🔄 Variate strong",
  "action.variateLow": "🔁 Variate subtle",
  "action.outpaint20": "🖼️ Outpaint 2x",
  "action.outpaint15": "🎇 Outpaint 1.5x",
  "action.close": "❌ Close",
  "action.model": "🛠️ Model",
  "action.mode": "💡 Mode",

  "settings.message": [
    "```",
    "===== GPT =====",
    "Model:    {{gpt.model}}",
    "Mode:     {{gpt.mode}}",
    "",
    // "===== Midjourney =====",
    // "Model:        {{midjourney.model}}",
    // "Stylize:      {{midjourney.stylize}}",
    // "Image weight: {{midjourney.iw}}",
    // "Chaos:        {{midjourney.chaos}}",
    "```"
  ].join("\n"),
  "reset.message": "Settings have been reset to defaults",

  "quota.exceed": "You have exceeded the request limit for today. Try again tomorrow.",

  "render.progress": ({ progress }) => `\`Rendering [${"=".repeat(Math.round(progress / 10)).padEnd(10, " ")}] ${progress}%\``,

  "antispam.system": "You are anti-spam bot. Your task is to ask the user any simple question about history, math or physics that is studied at school. You send a short \"yes\" to the user's answer if the answer is correct, otherwise \"no\"",
  "antispam.question": "We detected unusual activity. To verify that you are human, please answer this simple question:",
  "antispam.correct": "Your answer is correct. Thank you. You can continue using the bot",
  "antispam.wrong": "Wrong answer. Try again",
}