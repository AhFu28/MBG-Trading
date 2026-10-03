"""Preview or seed missing private snapshots from an operator's local cache.

No network access unless --apply is passed. Existing private rows are preserved.
Usage: python -m engine.database.seed_private_cache --cache-dir /private/cache
"""
import argparse
import json
from pathlib import Path
from .private_state import PrivateStateStore, PrivateStateError
from .supabase_client import DatabaseClient, _sanitize_for_json


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache-dir', required=True, type=Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    mapping = {
        **DatabaseClient.PRIVATE_CACHE_KEYS,
        'latest_cockpit_bundle.json': 'LATEST_COCKPIT_BUNDLE',
        'latest_arena_state.json': 'LATEST_ARENA_STATE',
    }
    store = PrivateStateStore() if args.apply else None
    if store and not store.configured:
        raise PrivateStateError('Private storage must be configured before seeding')
    for filename, key in mapping.items():
        path = args.cache_dir / filename
        if not path.exists():
            print(f'MISSING {filename}')
            continue
        value = _sanitize_for_json(json.loads(path.read_text(encoding='utf-8')))
        if not isinstance(value, (dict, list)):
            raise ValueError(f'Invalid cache shape: {filename}')
        if key == 'RESEARCH_ARCHIVE' and not isinstance(value, list):
            raise ValueError('Research archive must be a list')
        if key == 'LATEST_COCKPIT_BUNDLE' and not isinstance(value, dict):
            raise ValueError('Cockpit bundle must be an object')
        if key == 'LATEST_ARENA_STATE' and (not isinstance(value, dict) or not isinstance(value.get('agents'), list) or not isinstance(value.get('positions'), list)):
            raise ValueError('Arena snapshot must contain agent and position lists')
        if not store:
            print(f'PREVIEW {filename} -> {key}')
        elif store.read(key) is not None:
            print(f'PRESERVED {key}')
        else:
            store.write(key, value)
            print(f'SEEDED {key}')


if __name__ == '__main__':
    main()
