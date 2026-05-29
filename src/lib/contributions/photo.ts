import { z } from "zod";

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
