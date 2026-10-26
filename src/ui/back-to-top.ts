import { getMotionPreference } from "../motion/preferences";

export const initBackToTop = (): void => {
  document.querySelectorAll<HTMLButtonElement>("[data-back-to-top]").forEach((button) => {
    button.addEventListener("click", () => {
      const reduced = getMotionPreference() === "reduced";
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  });
};
