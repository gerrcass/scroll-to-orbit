export {};

declare global {
  interface Window {
    __HALCYON__?: {
      setProgress: (progress: number) => void;
      getProgress: () => number;
      hasWebGL: boolean;
    };
  }
}
