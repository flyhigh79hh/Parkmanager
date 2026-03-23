import en from '../dictionaries/en.json';
import de from '../dictionaries/de.json';

const dictionaries = {
  en,
  de,
};

export type Locale = keyof typeof dictionaries;

export const getDictionary = (locale: Locale) => dictionaries[locale] ?? dictionaries.de;
