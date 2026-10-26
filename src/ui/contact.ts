import { Flip, gsap } from "../motion/gsap";
import { getMotionPreference } from "../motion/preferences";

export const initContact = (): void => {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  if (!form) return;

  const status = form.querySelector<HTMLElement>("[data-form-status]");
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const label = button?.querySelector<HTMLElement>("span") ?? null;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.classList.contains("is-sent")) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const targets = form.querySelectorAll<HTMLElement>(
      ".contact__field, .contact__note, .form-status",
    );
    const state = Flip.getState(targets);

    form.classList.add("is-sent");
    if (button) button.disabled = true;
    if (label) label.textContent = "Brief requested";

    const now = new Date();
    const reference = `VSP-01-${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
      now.getUTCDate(),
    ).padStart(2, "0")}`;
    if (status) {
      status.textContent = `Intent logged / ${reference}. Mission ops will reply from missions@halcyon.space within two working days.`;
    }

    if (getMotionPreference() !== "reduced") {
      Flip.from(state, {
        duration: 0.55,
        ease: "halcyon",
        absolute: true,
        nested: true,
      });
      gsap.fromTo(
        status,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.15, ease: "halcyon" },
      );
    }
  });
};
