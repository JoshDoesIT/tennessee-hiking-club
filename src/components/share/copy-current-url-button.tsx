"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Copies the current page URL to the clipboard - used on the shared
 * "/share/my-tennessee/..." page so a visitor can pass the link along without
 * any extra round trip to the site that generated it.
 */
export function CopyCurrentUrlButton() {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        Copy this share link
      </Button>
      <span role="status" aria-live="polite" className="text-pine text-sm">
        {status === "copied"
          ? "Link copied!"
          : status === "error"
            ? "Could not copy"
            : ""}
      </span>
    </div>
  );
}
