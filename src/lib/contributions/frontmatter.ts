/**
 * Shared helpers for editing trail Markdown front-matter as a targeted text
 * insertion (#149/#155/#157), so an automated edit produces a clean PR diff
 * rather than a full re-serialization.
 */

/** Double-quote a scalar so it round-trips as a string (never a YAML date). */
export function yamlScalar(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Append a block list item under a front-matter `key`, adding the key if absent
 * and converting an inline empty list (`key: []`) to block form. `itemYaml` is a
 * pre-indented `  - ...` block.
 */
export function appendListItem(
  fileText: string,
  key: string,
  itemYaml: string,
): string {
  const match = fileText.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return fileText;

  const front = match[1];
  const lines = front.split("\n");
  const keyPattern = new RegExp(`^${key}:\\s*(\\[\\s*\\])?\\s*$`);
  const keyIndex = lines.findIndex((line) => keyPattern.test(line));

  if (keyIndex === -1) {
    lines.push(`${key}:`, itemYaml);
  } else {
    lines[keyIndex] = `${key}:`;
    lines.splice(keyIndex + 1, 0, itemYaml);
  }

  return fileText.replace(front, lines.join("\n"));
}
