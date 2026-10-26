import { gsap } from "../motion/gsap";
import { getMotionPreference } from "../motion/preferences";

const FOCUSABLE = "a[href], button:not([disabled]), input, [tabindex]:not([tabindex='-1'])";

export const initMenu = (): void => {
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const menu = document.querySelector<HTMLElement>("[data-mobile-menu]");
  const main = document.querySelector<HTMLElement>("main");
  const rail = document.querySelector<HTMLElement>("[data-act-rail]");
  if (!toggle || !menu) return;

  let open = false;
  let lastFocus: HTMLElement | null = null;
  let animation: gsap.core.Timeline | null = null;

  const focusables = (): HTMLElement[] =>
    Array.from(menu.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element.offsetParent !== null,
    );

  const openMenu = (): void => {
    if (open) return;
    open = true;
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
    menu.hidden = false;
    document.body.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    if (main) main.inert = true;
    if (rail) rail.inert = true;
    document.dispatchEvent(new CustomEvent("halcyon:menu", { detail: { open: true } }));

    const reduced = getMotionPreference() === "reduced";
    animation?.kill();
    if (reduced) {
      gsap.set(menu, { clearProps: "opacity,visibility" });
    } else {
      animation = gsap
        .timeline()
        .fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.32, ease: "power2.out" })
        .from(
          menu.querySelectorAll("nav a, .mobile-menu__foot > *"),
          { y: 26, autoAlpha: 0, duration: 0.55, stagger: 0.055, ease: "halcyon" },
          0.06,
        );
    }
    window.setTimeout(() => focusables()[0]?.focus(), reduced ? 0 : 180);
  };

  const closeMenu = (returnFocus = true): void => {
    if (!open) return;
    open = false;
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    if (main) main.inert = false;
    if (rail) rail.inert = false;
    document.dispatchEvent(new CustomEvent("halcyon:menu", { detail: { open: false } }));

    const reduced = getMotionPreference() === "reduced";
    const finish = (): void => {
      menu.hidden = true;
      gsap.set(menu, { clearProps: "opacity,visibility" });
      if (returnFocus) (lastFocus ?? toggle).focus();
    };

    animation?.kill();
    if (reduced) {
      finish();
    } else {
      animation = gsap.timeline({ onComplete: finish }).to(menu, {
        autoAlpha: 0,
        duration: 0.24,
        ease: "power2.in",
      });
    }
  };

  toggle.addEventListener("click", () => {
    if (open) closeMenu();
    else openMenu();
  });

  menu.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key !== "Tab") return;

    const items = focusables();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const desktop = window.matchMedia("(min-width: 981px)");
  const onDesktop = (event: MediaQueryListEvent): void => {
    if (event.matches) closeMenu(false);
  };
  desktop.addEventListener("change", onDesktop);

  document.addEventListener("halcyon:route", () => closeMenu(false));
};
