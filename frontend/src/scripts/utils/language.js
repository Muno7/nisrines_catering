const STORAGE_KEY = "siteLanguage";
const SUPPORTED = new Set(["en", "ar"]);

function normalize(lang) {
  return SUPPORTED.has(lang) ? lang : "en";
}

function persist(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (error) {
    console.warn("Unable to persist language preference", error);
  }
}

export function getCurrentLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return normalize(stored);
  } catch (_error) {
    return "en";
  }
}

export function applyLanguageAttributes(lang) {
  const value = normalize(lang);
  document.documentElement.lang = value === "ar" ? "ar" : "en";
  // Preserve layout direction regardless of language to avoid UI shifts.
  document.documentElement.dir = "ltr";
  document.documentElement.dataset.lang = value;
}

export function setLanguage(lang) {
  const value = normalize(lang);
  persist(value);
  applyLanguageAttributes(value);
  window.dispatchEvent(
    new CustomEvent("site-language-change", { detail: { lang: value } })
  );
}

export function initLanguage() {
  const lang = getCurrentLanguage();
  applyLanguageAttributes(lang);
  return lang;
}
