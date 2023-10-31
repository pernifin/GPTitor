import { default as en } from "../lang/en";
import { default as ru } from "../lang/ru";

export type LangName = keyof typeof langs;
export type LangStringKey = keyof typeof en;
export type Translator = (key: LangStringKey, tokens?: Record<string, string | number>) => string;

const langs = { en, ru };

export default class Translation {
  get supportedLangs() {
    return Object.keys(langs) as LangName[];
  }

  getTranslator(lang: LangName): Translator {
    return (key, tokens) => {
      const text = langs[lang][key];
      if (typeof text === "function") {
        return text(tokens as any);
      }

      if (!tokens) {
        return text;
      }
  
      return text.replace(
        new RegExp(`{{\\s*(${Object.keys(tokens).join("|")})\\s*}}`, "g"),
        (match, token) => String(tokens[token] ?? match)
      );
    }
  }
}