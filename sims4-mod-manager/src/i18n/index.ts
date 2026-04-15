import en from "./en";
import zh from "./zh";
import ja from "./ja";
import ko from "./ko";

export const translations = {
  en,
  zh,
  ja,
  ko,
};

export type LanguageKey = keyof typeof translations;
export type TranslationSet = (typeof translations)[LanguageKey];