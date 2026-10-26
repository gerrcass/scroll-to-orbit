import { Observer } from "../motion/gsap";

export const initHeaderState = (): void => {
  const header = document.querySelector<HTMLElement>("[data-header]");
  if (!header) return;

  let hidden = false;

  const setScrolled = (): void => {
    header.classList.toggle("is-scrolled", window.scrollY > 32);
  };

  const show = (): void => {
    if (!hidden) return;
    hidden = false;
    header.classList.remove("is-hidden");
  };

  const hide = (): void => {
    if (hidden || document.body.classList.contains("menu-open") || window.scrollY < 220) return;
    hidden = true;
    header.classList.add("is-hidden");
  };

  window.addEventListener("scroll", setScrolled, { passive: true });
  setScrolled();

  Observer.create({
    target: window,
    type: "wheel,touch,scroll",
    tolerance: 12,
    onUp: show,
    onDown: hide,
  });

  document.addEventListener("halcyon:menu", show);
  document.addEventListener("focusin", (event) => {
    if (header.contains(event.target as Node)) show();
  });
};
