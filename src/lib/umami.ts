export function getUmamiScriptConfig(websiteId?: string, scriptUrl?: string) {
  const id = websiteId?.trim();
  const url = scriptUrl?.trim();
  if (!id || !url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    return { websiteId: id, scriptUrl: parsed.href };
  } catch {
    return null;
  }
}
