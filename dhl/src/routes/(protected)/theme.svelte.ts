const THEMES = ["light", "dark"];
type ThemeKey = (typeof THEMES)[number];

class Theme {
  #current = $state(Theme.getPreferredTheme() ?? Theme.getSystemTheme());

  get current() {
    return this.#current;
  }

  constructor() {
    this.#synchronizeTheme();
  }

  static isTheme(value: unknown): value is ThemeKey {
    return THEMES.includes(value as ThemeKey);
  }

  static getPreferredTheme() {
    let savedTheme = globalThis.localStorage.getItem("theme");
    return Theme.isTheme(savedTheme) ? savedTheme : null;
  }

  static getSystemTheme(): ThemeKey {
    let isDarkPreferred = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
    return isDarkPreferred ? "dark" : "light";
  }

  #synchronizeTheme() {
    globalThis.localStorage.setItem("theme", this.#current);

    let root = globalThis.document.querySelector("html");
    if (root) {
      root.dataset.theme = this.#current;
    }
  }

  toggle() {
    this.#current = this.#current === "dark" ? "light" : "dark";
    this.#synchronizeTheme();
  }
}

export let theme = new Theme();
