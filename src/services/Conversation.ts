import { type Message } from 'telegraf/types';
import OpenAIApi from "openai";

import config from "../config";

type Dialog = {
  question: string,
  answer: string,
  replyTo?: number
};

export default class Conversation {
  dialogs = new Map<string, Dialog>();

  private loadDialog(chatId: number, replyId: number): Dialog | undefined {
    return this.dialogs.get(`${chatId}/${replyId}`);
  }

  private saveDialog(chatId: number, replyId: number, dialog: Dialog) {
    return this.dialogs.set(`${chatId}/${replyId}`, dialog);
  }

  getCleanMessage(msg: string) {
    return msg.replace(/(^|\s)([/@]\w+(?=\s|\/|@|$))+/gm, '').trim();
  }

  load(msg: Message.TextMessage) {
    const conversation: OpenAIApi.ChatCompletionMessageParam[] = [];

    if (msg.reply_to_message) {
      let dialog = this.loadDialog(msg.chat.id, msg.reply_to_message.message_id);

      // When there is no dialog stored, use the reply message
      if (!dialog && "text" in msg.reply_to_message) {
        conversation.push({
          role: msg.reply_to_message.from?.is_bot ? "assistant" : "user",
          content: msg.reply_to_message.text
        });
      }
    
      // Otherwise retrieve the whole conversation
      while (dialog) {
        conversation.unshift(
          { role: "user", content: dialog.question },
          { role: "assistant", content: dialog.answer }
        );

        dialog = dialog.replyTo ? this.loadDialog(msg.chat.id, dialog.replyTo) : undefined;
      }
    }

    const question = this.getCleanMessage(msg.text!);
    if (question) {
      conversation.push({ role: "user", content: question });
    }

    if (conversation.length === 0 || conversation[conversation.length - 1].role !== "user") {
      return [];
    }

    if (config.systemMessage) {
      conversation.unshift({ role: "system", content: config.systemMessage });
    }

    return conversation;
  }

  save(msg: Message.TextMessage, reply: Message.TextMessage, question: string, answer: string) {
    this.saveDialog(msg.chat.id, reply.message_id, {
      question,
      answer,
      replyTo: msg.reply_to_message?.message_id
    });
  }
}