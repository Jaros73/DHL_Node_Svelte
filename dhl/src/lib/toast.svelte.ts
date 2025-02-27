import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { Set } from "svelte/reactivity";

interface ToastNotification {
  icon?: IconDefinition;
  type?: "info" | "success" | "warning" | "error";
  content: string;
}

class Toast {
  #list = new Set<ToastNotification>();

  get list() {
    return this.#list;
  }

  show(toast: ToastNotification) {
    this.#list.add(toast);

    globalThis.setTimeout(() => {
      this.#list.delete(toast);
    }, 4000);
  }

  info(content: string) {
    this.show({ type: "info", content });
  }

  success(content: string) {
    this.show({ type: "success", content });
  }

  warn(content: string) {
    this.show({ type: "warning", content });
  }

  error(content: string) {
    this.show({ type: "error", content });
  }
}

export let toast = new Toast();
