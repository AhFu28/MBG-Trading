import json
import os
import tempfile
import unittest
from unittest.mock import patch, MagicMock
from engine.database.private_state import PrivateStateStore, PrivateStateError
from engine.database.supabase_client import DatabaseClient
from engine.analyzer.arena_runner_247 import ArenaRunner247

PRIVATE_ENV = {'SUPABASE_URL': 'https://private.example', 'SUPABASE_SERVICE_ROLE_KEY': 'sb_secret_test_only', 'MBG_REQUIRE_PRIVATE_PUBLISH': 'true'}

class TestPrivateState(unittest.TestCase):
    def test_required_private_publish_rejects_missing_and_anonymous_configuration(self):
        for env in [{}, {'SUPABASE_URL': 'https://private.example', 'SUPABASE_ANON_KEY': 'anonymous'}]:
            with self.subTest(env=env), patch.dict(os.environ, {**env, 'MBG_REQUIRE_PRIVATE_PUBLISH': 'true'}, clear=True):
                with self.assertRaises(PrivateStateError):
                    PrivateStateStore()

    def test_publish_error_is_not_reported_as_success_or_leaked(self):
        with patch.dict(os.environ, PRIVATE_ENV, clear=True), patch('urllib.request.urlopen', side_effect=RuntimeError('sensitive provider details')):
            with self.assertRaisesRegex(PrivateStateError, '^Private snapshot request failed$'):
                PrivateStateStore().write('LATEST_COCKPIT_BUNDLE', {'plans': []})

    def test_private_store_round_trip_headers_and_real_empty_value(self):
        reply = MagicMock()
        reply.__enter__.return_value = reply
        reply.read.return_value = b'[{"val": []}]'
        with patch.dict(os.environ, PRIVATE_ENV, clear=True), patch('urllib.request.urlopen', return_value=reply) as opener:
            store = PrivateStateStore()
            self.assertEqual(store.read('RESEARCH_ARCHIVE'), [])
            reply.read.return_value = b''
            self.assertTrue(store.write('RESEARCH_ARCHIVE', []))
            req = opener.call_args.args[0]
            self.assertNotIn('Authorization', req.headers)  # secret API keys are not JWTs
            self.assertEqual(json.loads(req.data)['val'], [])

    def test_arena_restores_private_state_in_a_fresh_workspace(self):
        state = {'agents': [], 'positions': [{'id': 'existing'}], 'journal': [], 'session_id': 123}
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, PRIVATE_ENV, clear=True), patch('database.private_state.PrivateStateStore.read', return_value=state), patch('database.private_state.PrivateStateStore.write') as write:
            runner = ArenaRunner247(os.path.join(tmp, 'arena.json'))
            self.assertEqual(runner.state['positions'][0]['id'], 'existing')
            runner._save_state()
            write.assert_called_once_with('LATEST_ARENA_STATE', runner.state)

    def test_arena_does_not_reset_on_invalid_private_state_or_storage_outage(self):
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, PRIVATE_ENV, clear=True):
            with patch('database.private_state.PrivateStateStore.read', return_value={'positions': []}):
                with self.assertRaises(ValueError):
                    ArenaRunner247(os.path.join(tmp, 'arena.json'))
            with patch('database.private_state.PrivateStateStore.read', side_effect=PrivateStateError('offline')):
                with self.assertRaises(RuntimeError):
                    ArenaRunner247(os.path.join(tmp, 'arena.json'))

    def test_arena_publication_failure_propagates(self):
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, {}, clear=True):
            runner = ArenaRunner247(os.path.join(tmp, 'arena.json'))
            with patch.object(runner.private_store, 'write', side_effect=RuntimeError('offline')):
                with self.assertRaises(RuntimeError):
                    runner._save_state()

    def test_db_master_publication_failure_propagates(self):
        with patch.dict(os.environ, {}, clear=True):
            db = DatabaseClient()
            with patch.object(db, '_save_local_fallback'), patch.object(db.private_store, 'write', side_effect=PrivateStateError('offline')):
                with self.assertRaises(PrivateStateError):
                    db.sync_complete_bundle({'daily_trade_plans': []})

class TestPrivateIntradayRefresh(unittest.TestCase):
    def test_intraday_uses_private_bundle_without_a_tracked_cache(self):
        from engine import run_pipeline as pipeline
        previous = {'daily_trade_plans': [{'symbol': 'TEST.JK', 'entry_price': 100}], 'research_marker': 'preserve-me', 'section_timestamps': {'trade_plans': '2026-09-01T00:00:00Z'}}
        db = MagicMock()
        db.private_store.configured = True
        db.load_system_state.return_value = previous
        with patch.object(pipeline, 'DatabaseClient', return_value=db), \
             patch.object(pipeline, 'NewsMacroFetcher') as news, \
             patch.object(pipeline, 'IDXMarketFetcher') as idx, \
             patch.object(pipeline, 'CryptoSpotFetcher') as crypto, \
             patch.object(pipeline, 'LLMBrain'), patch.object(pipeline, 'TelegramNotifier'), \
             patch('sys.argv', ['pipeline', '--mode', 'intraday_idx_refresh']):
            idx.return_value.execute.return_value = {'all_records': [{'ticker': 'TEST', 'price': 123, 'change_pct': 2, 'volume': 1000}]}
            news.return_value.execute.return_value = {'headline': 'test-only'}
            crypto.return_value.execute.return_value = []
            pipeline.main()
        bundle = db.sync_complete_bundle.call_args.args[0]
        self.assertEqual(bundle['daily_trade_plans'][0]['current_price'], 123)
        self.assertEqual(bundle['research_marker'], 'preserve-me')
        self.assertEqual(bundle['section_timestamps']['trade_plans'], '2026-09-01T00:00:00Z')
        db.publish_private_cache.assert_called_once()

    def test_intraday_refuses_to_replace_missing_private_bundle(self):
        from engine import run_pipeline as pipeline
        db = MagicMock()
        db.private_store.configured = True
        db.load_system_state.return_value = None
        with patch.object(pipeline, 'DatabaseClient', return_value=db), \
             patch.object(pipeline, 'NewsMacroFetcher'), patch.object(pipeline, 'IDXMarketFetcher') as idx, \
             patch.object(pipeline, 'CryptoSpotFetcher'), patch.object(pipeline, 'LLMBrain'), \
             patch.object(pipeline, 'TelegramNotifier'), patch('sys.argv', ['pipeline', '--mode', 'intraday_idx_refresh']):
            idx.return_value.execute.return_value = {'all_records': []}
            with self.assertRaisesRegex(RuntimeError, 'requires an existing private cockpit bundle'):
                pipeline.main()
        db.sync_complete_bundle.assert_not_called()
