import { describe, it, expect } from "vitest";
import {
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
  isWithinTennessee,
} from "./maps";

describe("googleMapsDirectionsUrl", () => {
  it("builds a directions deep link for valid coordinates", () => {
    // Mt. LeConte summit, Great Smoky Mountains.
    const url = googleMapsDirectionsUrl({ lat: 35.6539, lng: -83.4407 });
    expect(url).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=35.6539%2C-83.4407",
    );
  });

  it("rejects an out-of-range latitude", () => {
    expect(() => googleMapsDirectionsUrl({ lat: 200, lng: 0 })).toThrow(
      RangeError,
    );
  });

  it("rejects a non-finite longitude", () => {
    expect(() => googleMapsDirectionsUrl({ lat: 36, lng: NaN })).toThrow(
      RangeError,
    );
  });
});

describe("googleMapsPlaceUrl", () => {
  it("builds a place/search deep link", () => {
    const url = googleMapsPlaceUrl({ lat: 35.95, lng: -84 });
    expect(url).toContain("query=35.95%2C-84");
  });
});

describe("isWithinTennessee", () => {
  it("accepts a trailhead inside Tennessee", () => {
    // Mt. LeConte
    expect(isWithinTennessee({ lat: 35.6539, lng: -83.4407 })).toBe(true);
  });

  it("rejects coordinates south of the border (Atlanta, GA)", () => {
    expect(isWithinTennessee({ lat: 33.749, lng: -84.388 })).toBe(false);
  });

  it("rejects coordinates west of the state", () => {
    expect(isWithinTennessee({ lat: 35.5, lng: -92.0 })).toBe(false);
  });
});
