// Captures a DOM element as a PNG and triggers a browser download. Used by
// every "share as image" button (bet cards, stats, insights) so the
// html-to-image wiring lives in one place.
export async function shareElementAsPng(element: HTMLElement, filename: string): Promise<void> {
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(element, { pixelRatio: 2 });

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// Turns free text into a safe download filename segment (lowercase, dashes).
export function slugifyForFilename(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/gi, '-');
}
