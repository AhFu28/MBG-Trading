import { serveSnapshot } from './_snapshot.js';
export async function onRequestGet(context) {
  return serveSnapshot(context, { feature: 'research.read', key: 'RESEARCH_ARCHIVE', bundleField: 'research_archive', validate: Array.isArray });
}
