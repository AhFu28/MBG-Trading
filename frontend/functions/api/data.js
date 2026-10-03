import { serveSnapshot, isObject } from './_snapshot.js';
export async function onRequestGet(context) {
  return serveSnapshot(context, { feature: 'cockpit.read', key: 'LATEST_COCKPIT_BUNDLE', validate: isObject });
}
