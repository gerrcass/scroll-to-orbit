import { describe, expect, it } from "vitest";
import { MANIFEST, manifestById } from "../../src/mission/manifest";
import {
  ORBIT_PROFILES,
  nearestProfile,
  profileById,
  profileFromStep,
} from "../../src/mission/orbit-profiles";

describe("orbit profiles", () => {
  it("has the three advertised profiles", () => {
    expect(ORBIT_PROFILES.map((profile) => profile.id)).toEqual(["LEO", "SSO", "GTO"]);
  });

  it("returns a known profile and falls back to SSO", () => {
    expect(profileById("GTO").altitudeKm).toBe(35786);
    expect(profileById("NOPE" as never).id).toBe("SSO");
  });

  it("snaps to the nearest profile angle", () => {
    expect(nearestProfile(0).id).toBe("LEO");
    expect(nearestProfile(110).id).toBe("SSO");
    expect(nearestProfile(230).id).toBe("GTO");
    expect(nearestProfile(359).id).toBe("LEO");
  });

  it("clamps the step index", () => {
    expect(profileFromStep(-4).id).toBe("LEO");
    expect(profileFromStep(1).id).toBe("SSO");
    expect(profileFromStep(8).id).toBe("GTO");
  });
});

describe("manifest", () => {
  it("lists Vesper-01 on the pad", () => {
    expect(manifestById("VESPER-01")).toMatchObject({
      orbit: "SSO",
      payloadKg: 1180,
      status: "ON PAD",
    });
  });

  it("keeps every mission's orbit in the known set", () => {
    const orbits = new Set(ORBIT_PROFILES.map((profile) => profile.id));
    for (const mission of MANIFEST) {
      expect(orbits.has(mission.orbit)).toBe(true);
      expect(mission.payloadKg).toBeGreaterThan(0);
    }
  });
});
