export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(timeout: number, func: T) {
  let timer: number | undefined;

  return (...args: Parameters<T>) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => func(...args), timeout);
  };
}
