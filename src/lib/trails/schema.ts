import { z } from "zod";
import { isWithinTennessee } from "../maps";

export const REGIONS = ["East", "Middle", "West"] as const;
export const DIFFICULTIES = ["easy", "moderate", "hard", "strenuous"] as const;
export const ROUTE_TYPES = ["loop", "out-and-back", "point-to-point"] as const;
export const ALERT_LEVELS = ["info", "caution", "closure"] as const;

/** kebab-case: lowercase words separated by single hyphens. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** An ISO `yyyy-mm-dd` date. YAML parses an unquoted date as a Date object, so
 *  accept that too and normalise to the string form. */
const reportDate = z
  .union([z.string().min(1), z.date()])
  .transform((v) => (typeof v === "string" ? v : v.toISOString().slice(0, 10)));

/** A pinned, official closure or alert curated into trail content. */
const alertSchema = z.object({
  level: z.enum(ALERT_LEVELS),
  message: z.string().min(1),
  date: reportDate,
  source: z.url().optional(),
});

/** A recent, community-sourced condition report curated into trail content. */
const conditionReportSchema = z.object({
  date: reportDate,
  status: z.string().min(1),
  note: z.string().optional(),
  /** Contributor handle of the reporter, for recognition (provider-agnostic). */
  by: z.string().min(1).optional(),
});

/** An ordered point on a trail's route, used for the elevation profile and GPX
 *  export. */
const routePointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  elevationFt: z.number(),
});

/** The trailhead parking area: where to actually leave the car. `note` covers
 *  fee, capacity, gate hours, and surface (2WD/4WD); `seasonal` covers seasonal
 *  road closures or accessibility. */
const parkingSchema = z
  .object({
    lat: z.number(),
    lng: z.number(),
    note: z.string().optional(),
    seasonal: z.string().optional(),
  })
  .refine(isWithinTennessee, {
    message: "parking coordinates must be within Tennessee",
  });

/**
 * The trail data model: the executable spec for all trail content.
 * Front-matter from `content/trails/*.md` is validated against this; invalid
 * data throws at build/test time so the site never ships broken trails.
 */
export const trailSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN, "slug must be kebab-case"),
  name: z.string().min(1),
  region: z.enum(REGIONS),
  area: z.string().min(1),
  coordinates: z
    .object({ lat: z.number(), lng: z.number() })
    .refine(isWithinTennessee, {
      message: "coordinates must be within Tennessee",
    }),
  lengthMiles: z.number().positive(),
  elevationGainFt: z.number().nonnegative(),
  difficulty: z.enum(DIFFICULTIES),
  routeType: z.enum(ROUTE_TYPES),
  dogFriendly: z.boolean().optional(),
  kidFriendly: z.boolean().optional(),
  feeRequired: z.boolean().optional(),
  tags: z.array(z.string()).default([]),
  photos: z
    .array(
      z.object({
        src: z.string().min(1),
        alt: z.string().min(1),
        credit: z.string().optional(),
        /** Contributor handle of the photographer, for recognition. */
        by: z.string().min(1).optional(),
      }),
    )
    .default([]),
  externalLinks: z
    .array(z.object({ label: z.string().min(1), url: z.url() }))
    .optional(),
  summary: z.string().min(1),
  body: z.string().default(""),
  alerts: z.array(alertSchema).default([]),
  conditionReports: z.array(conditionReportSchema).default([]),
  route: z.array(routePointSchema).optional(),
  parking: parkingSchema.optional(),
  /** Contributor handles of people who contributed this trail, for recognition. */
  contributors: z.array(z.string().min(1)).optional(),
});

export type Trail = z.infer<typeof trailSchema>;
export type Region = (typeof REGIONS)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type TrailAlert = z.infer<typeof alertSchema>;
export type ConditionReport = z.infer<typeof conditionReportSchema>;
export type TrailParking = z.infer<typeof parkingSchema>;
