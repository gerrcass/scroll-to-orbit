export type MotionPreference = "full" | "reduced";

const STORAGE_KEY = "halcyon:motion";
const listeners = new Set<(preference: MotionPreference) => void>();

const media = (): MediaQueryList | null =>
  typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

const readStored = (): MotionPreference | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "full" || stored === "reduced" ? stored : null;
  } catch {
    return null;
  }
};

const osPreference = (): MotionPreference => (media()?.matches ? "reduced" : "full");

let current: MotionPreference | null = null;

const apply = (preference: MotionPreference): void => {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.motion = preference;
};

const notify = (preference: MotionPreference): void => {
  apply(preference);
  listeners.forEach((listener) => listener(preference));
  if (typeof document !== "undefined") {
    document.dispatchEvent(
      new CustomEvent("halcyon:motion", { detail: { preference } }),
    );
  }
};

export const getMotionPreference = (): MotionPreference => {
  if (current) return current;
  current = readStored() ?? osPreference();
  apply(current);
  return current;
};

export const setMotionPreference = (
  preference: MotionPreference,
  persist = true,
): MotionPreference => {
  current = preference;
  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Storage can be disabled; the preference still applies for this session.
    }
  }
  notify(preference);
  return preference;
};

export const toggleMotionPreference = (): MotionPreference =>
  setMotionPreference(getMotionPreference() === "full" ? "reduced" : "full");

export const subscribeMotion = (
  listener: (preference: MotionPreference) => void,
): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const initMotionPreference = (): MotionPreference => {
  const preference = getMotionPreference();
  const query = media();
  query?.addEventListener("change", (event) => {
    if (readStored()) return;
    current = event.matches ? "reduced" : "full";
    notify(current);
  });
  return preference;
};
