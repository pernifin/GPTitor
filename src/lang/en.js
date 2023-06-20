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
  "reset.message": "Settings have been reset to defaults"
}