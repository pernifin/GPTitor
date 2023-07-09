import { default as en } from "../lang/en";
import { default as ru } from "../lang/ru";
import config from "../config";

export type LangName = keyof typeof langs;
export type LangStringKey = keyof typeof en;
export type Translator = (key: LangStringKey, tokens?: Record<string, string | number>) => string;

const langs = { en, ru };

export default class Translation {
  get supportedLangs() {
    return Object.keys(langs) as LangName[];
  }

  getTranslator(lang: string): Translator {
    const strings = langs[lang as LangName] ?? langs[config.defaultLang];
    // return new Translation(strings);
    return (key, tokens) => {
      const text = strings[key];
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