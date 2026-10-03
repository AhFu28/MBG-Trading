import { serveSnapshot, isObject } from './_snapshot.js';
export async function onRequestGet(context) {
  return serveSnapshot(context, {
    feature: 'arena.read', key: 'LATEST_ARENA_STATE', bundleField: 'arena_state',
    validate: value => isObject(value) && Array.isArray(value.agents) && Array.isArray(value.positions),
  });
}
