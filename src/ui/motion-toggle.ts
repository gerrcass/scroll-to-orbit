import { getMotionPreference, setMotionPreference } from "../motion/preferences";

export const initMotionToggle = (): void => {
  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-motion-toggle]");
  const labels = document.querySelectorAll<HTMLElement>("[data-motion-label]");

  const render = (): void => {
    const reduced = getMotionPreference() === "reduced";
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(reduced));
      button.setAttribute(
        "aria-label",
        reduced ? "Switch to full motion" : "Switch to reduced motion",
      );
    });
    labels.forEach((label) => {
      label.textContent = reduced ? "REDUCED" : "FULL";
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const next = getMotionPreference() === "full" ? "reduced" : "full";
      setMotionPreference(next);
      document.dispatchEvent(new CustomEvent("halcyon:motion", { detail: { preference: next } }));
      render();
    });
  });

  render();
};
