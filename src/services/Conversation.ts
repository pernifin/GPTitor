import { Message } from 'telegraf/types';
import { ChatCompletionRequestMessage } from "openai";

import { type Store } from "../bot";

type Dialog = {
  question: string,
  answer: string,
  replyTo?: number
};

export default class Conversation {
  constructor(private store: Store<Dialog>, private botUsername: string) { }

  private async loadDialog(chatId: number, replyId: number): Promise<Dialog | undefined> {
    return this.store.get(`${chatId}/${replyId}`);
  }

  private async saveDialog(chatId: number, replyId: number, dialog: Dialog) {
    return this.store.set(`${chatId}/${replyId}`, dialog);
  }

  static getCleanMessage(msg: string) {
    return msg.replace(/(^|\s)([/@]\w+(?=\s|\/|@|$))+/gm, '').trim();
  }

  async load(msg: Message.TextMessage) {
    const conversation: ChatCompletionRequestMessage[] = [];

    if (msg.reply_to_message) {
      let { message_id: replyId } = msg.reply_to_message;
      let dialog = await this.loadDialog(msg.chat.id, replyId);

      // When there is no dialog stored, use the reply message
      if (!dialog && "text" in msg.reply_to_message) {
        const fromBot = msg.reply_to_message.from?.username === this.botUsername;
        conversation.push({
          role: fromBot ? "assistant" : "user",
          content: msg.reply_to_message.text
        });
      }
    
      // Otherwise retrieve the whole conversation
      while (dialog) {
        conversation.unshift(
          { role: "user", content: dialog.question },
          { role: "assistant", content: dialog.answer }
        );

        dialog = dialog.replyTo ? await this.loadDialog(msg.chat.id, dialog.replyTo) : undefined;
      }
    }

    const question = Conversation.getCleanMessage(msg.text!);
    if (question) {
      conversation.push({ role: "user", content: question });
    }

    return conversation;
  }

  async save(msg: Message.TextMessage, reply: Message.TextMessage, question: string, answer: string) {
    return this.saveDialog(msg.chat.id, reply.message_id, {
      question,
      answer,
      replyTo: msg.reply_to_message?.message_id
    });
  }
}