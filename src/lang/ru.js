export default {
  "greeting": "Здравствуйте! Я - AI-ассистент, созданный для того, чтобы отвечать на ваши вопросы и помогать вам. Если у вас возникнут вопросы или вам нужна помощь, не стесняйтесь обращаться!",
  "help": "Этот бот может ...",

  "command.start": "Запустить бота в этом чате",
  "command.settings": "Настройки бота для текущего чата",
  "command.balance": "Узнать ваш баланс в токенах",
  "command.help": "Что это бот может",

  "balance.message": "У вас осталось {{tokens}} токенов. Каждый день вы получете {{dailyTokens}} токенов если ваш баланс меньше чем {{startTokens}}.",

  "error.noimage": "Изображение не загружено",
  "error.image-not-found": "Изображение не найдено",
  "error.process-image-failed": "Ошибка при обработке изображения",
  "error.generate-image-failed": "Ошибка при генерации изображения",

  "action.split": "🔢 Разделить",
  "action.regenerate": "🔁 Перерисовать",
  "action.variate": "🔄 Варианты",
  "action.variateHigh": "🔄 Значительно перерисовать",
  "action.variateLow": "🔁 Немного перерисовать",
  "action.outpaint20": "🖼️ Обрисовать 2x",
  "action.outpaint15": "🎇 Обрисовать 1.5x",
  "action.close": "❌ Закрыть",
  "action.model": "🛠️ Модель",
  "action.mode": "💡 Режим",

  "settings.message": [
    "```",
    "===== GPT =====",
    "Модель:    {{gpt.model}}",
    "Режим:     {{gpt.mode}}",
    "",
    // "===== Midjourney =====",
    // "Model:        {{midjourney.model}}",
    // "Stylize:      {{midjourney.stylize}}",
    // "Image weight: {{midjourney.iw}}",
    // "Chaos:        {{midjourney.chaos}}",
    "```"
  ].join("\n"),
  "reset.message": "Настройки были сброшены до значений по умолчанию",

  "quota.exceed": "Вы превысили лимит запросов на сегодня. Попробуйте завтра снова."
};