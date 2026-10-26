import { scrollToTop } from "./scroll-links";

export const initBackToTop = (): void => {
  document.querySelectorAll<HTMLButtonElement>("[data-back-to-top]").forEach((button) => {
    button.addEventListener("click", () => scrollToTop());
  });
};
