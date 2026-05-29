import { z } from "zod";
import { isWithinTennessee } from "../maps";
import { DIFFICULTIES, REGIONS, ROUTE_TYPES } from "../trails/schema";

/**
 * An in-app proposal for a new trail, submitted by a signed-in member without
 * GitHub. Mirrors the fields of the GitHub "new trail" issue form
 * (`.github/ISSUE_TEMPLATE/new_trail.yml`); a maintainer reviews it before any
 * content is published. Validation is pure so it can back both the API route
 * and the submit form.
 */
export const trailSubmissionSchema = z
  .object({
    name: z.string().min(1),
    region: z.enum(REGIONS),
    area: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
    description: z.string().min(1),
    lengthMiles: z.number().positive().optional(),
    elevationGainFt: z.number().nonnegative().optional(),
    difficulty: z.enum(DIFFICULTIES).optional(),
    routeType: z.enum(ROUTE_TYPES).optional(),
    links: z.string().optional(),
  })
  .refine((s) => isWithinTennessee({ lat: s.lat, lng: s.lng }), {
    message: "coordinates must be within Tennessee",
    path: ["lat"],
  });

export type TrailSubmissionInput = z.infer<typeof trailSubmissionSchema>;

/** Validate raw submit input. Returns Zod's safeParse result. */
export function validateTrailSubmission(input: unknown) {
  return trailSubmissionSchema.safeParse(input);
}
