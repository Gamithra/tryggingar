import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tryggingar-lang';
const DEFAULT_LANGUAGE = 'is';

function readLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'en' || stored === 'is' ? stored : DEFAULT_LANGUAGE;
}

export function useLanguage() {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = readLanguage();
    setLanguageState(stored);
    document.documentElement.lang = stored === 'en' ? 'en-GB' : 'is-IS';
  }, []);

  const setLanguage = useCallback((next) => {
    setLanguageState((current) => {
      const value = typeof next === 'function' ? next(current) : next;
      if (value !== 'en' && value !== 'is') return current;
      localStorage.setItem(STORAGE_KEY, value);
      document.documentElement.lang = value === 'en' ? 'en-GB' : 'is-IS';
      return value;
    });
  }, []);

  return [language, setLanguage];
}

export function localeForLanguage(language) {
  return language === 'en' ? 'en-GB' : 'is-IS';
}
