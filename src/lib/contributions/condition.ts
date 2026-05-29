import { z } from "zod";
import { conditionReportSchema } from "@/lib/trails/schema";

/**
 * An in-app condition report (#149) for an existing trail. Validation is pure so
 * it backs both the API route and the submit form. The trail's existence is
 * checked in the route (against the content), not here.
 */
export const conditionSubmissionSchema = z.object({
  trailSlug: z.string().trim().min(1),
  status: z.string().trim().min(1).max(80),
  note: z.string().trim().max(280).optional(),
});

export type ConditionSubmissionInput = z.infer<typeof conditionSubmissionSchema>;

export function validateConditionSubmission(input: unknown) {
  return conditionSubmissionSchema.safeParse(input);
}

/** Double-quote a scalar so it round-trips as a string (and never as a YAML
 *  date) when a maintainer pastes the entry into trail content. */
function yamlScalar(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export type ConditionEntry = {
  date: string;
  status: string;
  note?: string | null;
  by?: string | null;
};

/**
 * The #150 analog for conditions: render an approved report as a
 * `conditionReports[]` YAML entry the maintainer pastes into the trail file, and
 * report whether it validates against the schema.
 */
export function generateConditionEntry(report: ConditionEntry): {
  yaml: string;
  valid: boolean;
} {
  const lines = [
    `  - date: ${yamlScalar(report.date)}`,
    `    status: ${yamlScalar(report.status)}`,
  ];
  if (report.note?.trim()) lines.push(`    note: ${yamlScalar(report.note.trim())}`);
  if (report.by?.trim()) lines.push(`    by: ${yamlScalar(report.by.trim())}`);

  const parsed = conditionReportSchema.safeParse({
    date: report.date,
    status: report.status,
    ...(report.note?.trim() ? { note: report.note.trim() } : {}),
    ...(report.by?.trim() ? { by: report.by.trim() } : {}),
  });

  return { yaml: lines.join("\n"), valid: parsed.success };
}
