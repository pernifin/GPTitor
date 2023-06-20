import { existsSync } from "fs";
import { join } from "path";

import config from "../config";

type LangStrings = Record<string, Record<string, string>>;

export default class Translation {
  private constructor(private strings: LangStrings) {}

  static async create() {
    const strings: LangStrings = {};

    for (const lang of config.langs.supported) {
      if (!existsSync(join(__dirname, `../lang/${lang}.js`))) {
        throw new Error(`Language file not found: ${lang}.js`);
      }

      strings[lang] = (await import(`../lang/${lang}.js`)).default;
    }

    return new Translation(strings);
  }

  private replaceTokens(text: string, tokens?: Record<string, string | number>) {
    if (!tokens) {
      return text;
    }

    return text.replace(
      new RegExp(`{{\\s*(${Object.keys(tokens).join("|")})\\s*}}`, "g"),
      (match, token) => String(tokens[token] ?? match)
    );
  }

  get langs() {
    return Object.keys(this.strings);
  }

  get(lang: string) {
    return (text: string, tokens?: Record<string, string | number>) =>
      this.replaceTokens(this.strings[lang]?.[text] ?? `[[${text}]]`, tokens);
  }

  hasSupport(lang: string) {
    return this.langs.includes(lang);
  }
}