export function portal(node: Node, target = "body") {
  globalThis.document.querySelector(target)?.appendChild(node);
}
