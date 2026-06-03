import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * Save or share a text file (#245). In the browser, a `<a download>` blob
 * download works; in the native WebView it does nothing, so on a Capacitor
 * build the file is written to the cache directory and handed to the native
 * share sheet (save to Files, send to a GPS app, etc.).
 */
export async function saveOrShareTextFile(
  filename: string,
  text: string,
  mimeType: string,
): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: filename, url: uri });
    return;
  }

  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
