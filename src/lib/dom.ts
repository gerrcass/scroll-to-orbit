export const setText = (element: Element | null | undefined, value: string): void => {
  if (element && element.textContent !== value) element.textContent = value;
};
