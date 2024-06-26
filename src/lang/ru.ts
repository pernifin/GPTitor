export default {
  "greeting": "Здравствуйте! Я - AI-ассистент, созданный для того, чтобы отвечать на ваши вопросы и помогать вам. Если у вас возникнут вопросы или вам нужна помощь, не стесняйтесь обращаться!",
  "help": "Этот бот может ...",

  "command.start": "Запустить бота в этом чате",
  "command.settings": "Настройки бота для текущего чата",
  "command.balance": "Узнать ваш баланс в токенах",
  "command.help": "Что этот бот может",

  "balance.message": "У вас осталось {{tokens}} токенов. Каждый день вы получете {{dailyTokens}} токенов если ваш баланс меньше чем {{startTokens}}.",

  "error.chat": "Произошла ошибка при генерации ответа:\n{{error}}",
  "error.noimage": "Изображение не загружено",
  "error.image-not-found": "Изображение не найдено",
  "error.process-image-failed": "Ошибка при обработке изображения",
  "error.generate-image-failed": "Ошибка при генерации изображения",

  "action.fullsize": "🖼️ Полный размер",
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

  "quota.exceed": "Вы превысили лимит запросов на сегодня. Попробуйте завтра снова.",

  "render.progress": ({ progress }: { progress: number }) => `\`Рисую [${"=".repeat(Math.round(progress / 10)).padEnd(10, " ")}] ${progress}%\``,

  "antispam.system": "Ты антиспам-бот. Твоя задача — задать пользователю любой простой вопрос по математике или физике. Ты никогда не должен просить пользователя задать тебе вопрос. Если ответ правильный отвечай коротко \"yes\", иначе \"no\"",
  "antispam.question": "Мы обнаружили необычную активность. Чтобы убедиться, что вы человек, ответьте на простой вопрос:",
  "antispam.correct": "Ваш ответ правильный. Спасибо. Вы можете продолжать пользоваться ботом",
  "antispam.wrong": "Неверный ответ. Попробуйте еще раз",
};