import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Observer } from "gsap/Observer";
import { Flip } from "gsap/Flip";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { TextPlugin } from "gsap/TextPlugin";
import { CustomEase } from "gsap/CustomEase";
import { ExpoScaleEase, RoughEase, SlowMo } from "gsap/EasePack";

gsap.registerPlugin(
  ScrollTrigger,
  ScrollSmoother,
  SplitText,
  DrawSVGPlugin,
  MorphSVGPlugin,
  MotionPathPlugin,
  ScrollToPlugin,
  Observer,
  Flip,
  Draggable,
  InertiaPlugin,
  TextPlugin,
  CustomEase,
  ExpoScaleEase,
  SlowMo,
  RoughEase,
);

CustomEase.create("halcyon", "M0,0 C0.14,0.46 0.12,1 1,1");
CustomEase.create("camera-settle", "M0,0 C0.2,0 0.24,1 1,1");
CustomEase.create("ignition", "M0,0 C0.16,0 0.3,0.98 1,1");
CustomEase.create("expo-soft", "M0,0 C0.16,1 0.3,1 1,1");

gsap.defaults({
  ease: "halcyon",
  duration: 0.9,
});

gsap.config({
  nullTargetWarn: false,
});

export {
  gsap,
  ScrollTrigger,
  ScrollSmoother,
  SplitText,
  DrawSVGPlugin,
  MorphSVGPlugin,
  MotionPathPlugin,
  ScrollToPlugin,
  Observer,
  Flip,
  Draggable,
  InertiaPlugin,
  TextPlugin,
  CustomEase,
  ExpoScaleEase,
  SlowMo,
  RoughEase,
};
