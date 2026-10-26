import { getMotionPreference, setMotionPreference, subscribeMotion } from "../motion/preferences";

export const initMotionToggle = (): void => {
  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-motion-toggle]");
  const labels = document.querySelectorAll<HTMLElement>("[data-motion-label]");

  const render = (): void => {
    const reduced = getMotionPreference() === "reduced";
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(reduced));
    });
    labels.forEach((label) => {
      label.textContent = reduced ? "REDUCED" : "FULL";
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const next = getMotionPreference() === "full" ? "reduced" : "full";
      setMotionPreference(next);
      render();
    });
  });

  render();
  subscribeMotion(() => render());
};
