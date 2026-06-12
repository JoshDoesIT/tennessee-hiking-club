import { z } from "zod";
import { photoItemSchema } from "@/lib/trails/schema";
import { yamlScalar, appendListItem } from "./frontmatter";

/**
 * An in-app photo submission (#149) for an existing trail. Validation is pure so
 * it backs both the API route and the submit form. `alt` is required so every
 * published photo has accessible alt text; the file itself is validated with
 * `isAcceptableImage`.
 */
export const photoSubmissionSchema = z.object({
  trailSlug: z.string().trim().min(1),
  alt: z.string().trim().min(1).max(200),
  credit: z.string().trim().max(200).optional(),
});

export type PhotoSubmissionInput = z.infer<typeof photoSubmissionSchema>;

export function validatePhotoSubmission(input: unknown) {
  return photoSubmissionSchema.safeParse(input);
}

/** The largest contributed image we accept before compression (8 MB). */
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export function isAcceptableImage(type: string, size: number): boolean {
  return type.startsWith("image/") && size > 0 && size <= MAX_PHOTO_BYTES;
}

export type PhotoEntry = {
  src: string;
  alt: string;
  credit?: string | null;
  by?: string | null;
};

/** Render a photo as a `photos[]` YAML entry, validated against the schema. */
export function generatePhotoEntry(photo: PhotoEntry): {
  yaml: string;
  valid: boolean;
} {
  const lines = [
    `  - src: ${yamlScalar(photo.src)}`,
    `    alt: ${yamlScalar(photo.alt)}`,
  ];
  if (photo.credit?.trim()) lines.push(`    credit: ${yamlScalar(photo.credit.trim())}`);
  if (photo.by?.trim()) lines.push(`    by: ${yamlScalar(photo.by.trim())}`);

  const parsed = photoItemSchema.safeParse({
    src: photo.src,
    alt: photo.alt,
    ...(photo.credit?.trim() ? { credit: photo.credit.trim() } : {}),
    ...(photo.by?.trim() ? { by: photo.by.trim() } : {}),
  });

  return { yaml: lines.join("\n"), valid: parsed.success };
}

/** Append a photo to a trail Markdown file's `photos[]` (#157). */
export function appendPhoto(fileText: string, photo: PhotoEntry): string {
  return appendListItem(fileText, "photos", generatePhotoEntry(photo).yaml);
}
