import { z } from "zod";
import { isWithinTennessee } from "../maps";
import { WAYPOINT_TYPES, waypointSchema } from "@/lib/trails/schema";
import { yamlScalar, appendListItem } from "./frontmatter";

/**
 * An in-app waypoint/landmark suggestion (#191) for an existing trail. Validation
 * is pure so it backs both the API route and the submit form. The trail's
 * existence is checked in the route (against the content), not here. Coordinates
 * must fall within Tennessee, mirroring the trail/parking checks.
 */
export const waypointSubmissionSchema = z
  .object({
    trailSlug: z.string().trim().min(1),
    lat: z.number(),
    lng: z.number(),
    name: z.string().trim().min(1).max(80),
    type: z.enum(WAYPOINT_TYPES),
    description: z.string().trim().max(280).optional(),
  })
  .refine((s) => isWithinTennessee({ lat: s.lat, lng: s.lng }), {
    message: "coordinates must be within Tennessee",
    path: ["lat"],
  });

export type WaypointSubmissionInput = z.infer<typeof waypointSubmissionSchema>;

export function validateWaypointSubmission(input: unknown) {
  return waypointSubmissionSchema.safeParse(input);
}

export type WaypointEntry = {
  lat: number;
  lng: number;
  name: string;
  type: (typeof WAYPOINT_TYPES)[number];
  description?: string | null;
  /** Submitter handle, recorded as a comment so the maintainer can credit them. */
  by?: string | null;
};

/**
 * Render an approved suggestion as a `waypoints[]` YAML entry the maintainer
 * pastes into the trail file, and report whether it validates against the trail
 * schema. The content model has no per-waypoint attribution field, so the
 * submitter is credited via a comment (add them to the trail's `contributors`).
 */
export function generateWaypointEntry(entry: WaypointEntry): {
  yaml: string;
  valid: boolean;
} {
  const lines = [
    `  - lat: ${entry.lat}`,
    `    lng: ${entry.lng}`,
    `    name: ${yamlScalar(entry.name)}`,
    `    type: ${entry.type}`,
  ];
  if (entry.description?.trim())
    lines.push(`    description: ${yamlScalar(entry.description.trim())}`);
  if (entry.by?.trim()) lines.push(`    # suggested by ${entry.by.trim()}`);

  const parsed = waypointSchema.safeParse({
    lat: entry.lat,
    lng: entry.lng,
    name: entry.name,
    type: entry.type,
    ...(entry.description?.trim() ? { description: entry.description.trim() } : {}),
  });

  return { yaml: lines.join("\n"), valid: parsed.success };
}

/** Append a waypoint entry to a trail Markdown file's `waypoints[]` (#155 style). */
export function appendWaypoint(fileText: string, entry: WaypointEntry): string {
  return appendListItem(fileText, "waypoints", generateWaypointEntry(entry).yaml);
}
