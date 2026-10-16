"""
Behavioural guard for the macro cache rules (P0-4).

WHAT THIS LOCKS IN
------------------
fetch_macro_indicators() reads engine/cache/last_known_macro.json as a starting
point for its price fields. Three rules keep that honest:

1. A cache older than 24 h is treated as absent, so an 11-day-old price can
   never be served as if fresh.
2. data_source claims "live" only when a price field actually moved during the
   yfinance sweep. The old code stamped live unconditionally, so a sweep that
   returned nothing still relabelled stale numbers as live AND wrote the lie
   into the cache.
3. A fresh cache keeps its age in the label (cached:<n>h) instead of a bare
   "cached" that hides how old the numbers are.

HOW IT RUNS WITHOUT NETWORK
---------------------------
yfinance is patched to answer from a fake history object, so no ticker is
contacted and the test needs no API key. The real cache file is briefly
rewritten and then restored byte for byte, because its path is derived from the
module location and is not injectable.

Run: python -m pytest engine/tests/test_macro_cache_age.py -q
"""

import importlib
import json
import os
import sys
import time
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(HERE, "..")
CACHE = os.path.join(ENGINE, "cache", "last_known_macro.json")

sys.path.insert(0, ENGINE)
news_macro = importlib.import_module("fetchers.news_macro")


class _FakeSeries:
    def __init__(self, values):
        self._values = values

    def __getitem__(self, key):
        return self

    @property
    def iloc(self):
        holder = self

        class _I:
            def __getitem__(self, i):
                return holder._values[i]

        return _I()


class _FakeHistory:
    def __init__(self, values):
        self._values = values

    @property
    def empty(self):
        return len(self._values) == 0

    def __len__(self):
        return len(self._values)

    def __getitem__(self, key):
        return _FakeSeries(self._values)


def _ticker_factory(values):
    def factory(symbol):
        ticker = mock.Mock()
        ticker.history.return_value = _FakeHistory(values)
        return ticker

    return factory


_BACKUP = None


def _write_cache(payload, age_hours):
    with open(CACHE, "w", encoding="utf-8") as handle:
        json.dump(payload, handle)
    stamp = time.time() - age_hours * 3600.0
    os.utime(CACHE, (stamp, stamp))


def setup_module():
    global _BACKUP
    _BACKUP = None
    if os.path.exists(CACHE):
        with open(CACHE, "rb") as handle:
            _BACKUP = handle.read()


def teardown_module():
    if _BACKUP is not None:
        with open(CACHE, "wb") as handle:
            handle.write(_BACKUP)
    elif os.path.exists(CACHE):
        os.remove(CACHE)


def test_cache_older_than_24h_is_ignored_entirely():
    # 48 h is past the limit: the stored gold price must never leak through,
    # and with yfinance answering empty the honest label is fallback.
    _write_cache({"gold_price": 9999.0, "dxy_index": 55.0}, age_hours=48.0)
    with mock.patch.object(news_macro, "yf", mock.MagicMock()):
        with mock.patch.object(news_macro.yf, "Ticker", side_effect=_ticker_factory([])):
            result = news_macro.NewsMacroFetcher().fetch_macro_indicators()
    assert result["gold_price"] != 9999.0
    assert result["data_source"] == "fallback"


def test_fresh_cache_is_used_and_carries_its_age_in_the_label():
    payload = {"gold_price": 4100.0, "brent_oil_price": 80.0, "dxy_index": 101.0,
               "us10y_yield": 4.1, "ihsg_price": 7000.0}
    _write_cache(payload, age_hours=2.0)
    with mock.patch.object(news_macro, "yf", mock.MagicMock()):
        with mock.patch.object(news_macro.yf, "Ticker", side_effect=_ticker_factory([])):
            result = news_macro.NewsMacroFetcher().fetch_macro_indicators()
    assert result["data_source"].startswith("cached:")
    assert result["gold_price"] == 4100.0


def test_live_sweep_overwrites_and_labels_live():
    _write_cache({"gold_price": 4100.0}, age_hours=1.0)
    # history closes: [4200.0, 4242.0] -> current 4242.0 is inside the gold
    # sanity band, so the field must move and the label must say live.
    with mock.patch.object(news_macro, "yf", mock.MagicMock()):
        with mock.patch.object(news_macro.yf, "Ticker", side_effect=_ticker_factory([4200.0, 4242.0])):
            result = news_macro.NewsMacroFetcher().fetch_macro_indicators()
    assert result["data_source"] == "live"
    assert result["gold_price"] == 4242.0


def test_empty_sweep_does_not_relabel_nor_rewrite_the_cache():
    payload = {"gold_price": 4100.0, "dxy_index": 101.0}
    _write_cache(payload, age_hours=1.0)
    before_mtime = os.path.getmtime(CACHE)
    time.sleep(0.02)
    with mock.patch.object(news_macro, "yf", mock.MagicMock()):
        with mock.patch.object(news_macro.yf, "Ticker", side_effect=_ticker_factory([])):
            result = news_macro.NewsMacroFetcher().fetch_macro_indicators()
    assert result["data_source"] != "live"
    assert os.path.getmtime(CACHE) == before_mtime


def test_missing_cache_falls_back_and_says_so():
    if os.path.exists(CACHE):
        os.remove(CACHE)
    with mock.patch.object(news_macro, "yf", mock.MagicMock()):
        with mock.patch.object(news_macro.yf, "Ticker", side_effect=_ticker_factory([])):
            result = news_macro.NewsMacroFetcher().fetch_macro_indicators()
    assert result["data_source"] == "fallback"
    # The hardcoded last-resort prices are documented in the source; what this
    # test owns is that a missing cache is not silently served as if it existed.
    assert result["gold_price"] == 2750.0
