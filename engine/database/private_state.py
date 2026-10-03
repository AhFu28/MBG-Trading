"""Private snapshot persistence for ephemeral runners (stdlib only)."""
import base64
import json
import os
import urllib.request
from datetime import datetime, timezone


class PrivateStateError(RuntimeError):
    pass


class PrivateStateStore:
    def __init__(self):
        self.url = os.getenv('SUPABASE_URL', '').rstrip('/')
        self.key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY', '')
        self.required = os.getenv('MBG_REQUIRE_PRIVATE_PUBLISH', '').lower() == 'true'
        privileged = self.key.startswith('sb_secret_')
        try:
            if not privileged:
                part = self.key.split('.')[1]
                privileged = json.loads(base64.urlsafe_b64decode(part + '=' * (-len(part) % 4)))['role'] == 'service_role'
        except (ValueError, IndexError, KeyError):
            pass
        self.configured = self.url.startswith('https://') and privileged
        if self.required and not self.configured:
            raise PrivateStateError('Private storage requires a server secret/service-role key')

    def _request(self, path, method='GET', value=None):
        if not self.configured:
            return None
        headers = {'apikey': self.key, 'Content-Type': 'application/json', 'Accept': 'application/json'}
        if not self.key.startswith('sb_secret_'):
            headers['Authorization'] = 'Bearer ' + self.key
        if method == 'POST':
            headers['Prefer'] = 'resolution=merge-duplicates,return=minimal'
        body = json.dumps(value, allow_nan=False, default=str).encode() if value is not None else None
        request = urllib.request.Request(self.url + '/rest/v1/' + path, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                raw = response.read()
                return json.loads(raw) if raw else None
        except Exception:
            # Never include URLs, credentials, payloads or provider exception text in logs.
            raise PrivateStateError('Private snapshot request failed') from None

    def read(self, key):
        from urllib.parse import urlencode
        rows = self._request('system_state?' + urlencode({'key': 'eq.' + key, 'select': 'val,updated_at', 'limit': '1'}))
        if not self.configured:
            return None
        if not isinstance(rows, list):
            raise PrivateStateError('Invalid private snapshot response')
        return rows[0].get('val') if rows else None

    def write(self, key, value):
        if not self.configured:
            return False
        self._request('system_state?on_conflict=key', 'POST', {
            'key': key, 'val': value, 'updated_at': datetime.now(timezone.utc).isoformat(),
        })
        return True
