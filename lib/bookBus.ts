import type { BookId } from "./content";

/**
 * The hero owns the only WebGL canvas on the page. Sections further down that
 * want to drive it (the "Open in 3D" buttons) publish through this tiny event
 * bus instead of threading a provider through the whole tree.
 */
const OPEN_BOOK = "vstem:open-book";

export function requestOpenBook(id: BookId) {
  window.dispatchEvent(new CustomEvent<BookId>(OPEN_BOOK, { detail: id }));
}

export function onOpenBook(handler: (id: BookId) => void) {
  const listener = (event: Event) => handler((event as CustomEvent<BookId>).detail);
  window.addEventListener(OPEN_BOOK, listener);
  return () => window.removeEventListener(OPEN_BOOK, listener);
}
