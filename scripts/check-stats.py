from datetime import datetime, timezone
import concurrent.futures
import json
import sqlite3
from pathlib import Path
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'server'))
from stats import Store, create_server, shanghai_day


class StatsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / 'stats.sqlite3'
        self.day = '2026-10-25'
        self.store = Store(self.path, today=lambda: self.day)

    def tearDown(self):
        self.temp.cleanup()

    def expected(self, visits, visitors, today_visits, today_visitors):
        return dict(visits=visits, visitors=visitors, today_visits=today_visits,
                    today_visitors=today_visitors, date=self.day, timezone='Asia/Shanghai')

    def test_beijing_day_uses_utc_plus_eight(self):
        self.assertEqual(shanghai_day(datetime(2026, 10, 24, 15, 59, 59, tzinfo=timezone.utc)), '2026-10-24')
        self.assertEqual(shanghai_day(datetime(2026, 10, 24, 16, 0, 0, tzinfo=timezone.utc)), '2026-10-25')

    def test_midnight_and_returning_visitors(self):
        self.store.visit('a'*32, '1'*32)
        self.store.visit('b'*32, '2'*32)
        self.day = '2026-10-26'
        self.assertEqual(self.store.read(), self.expected(2, 2, 0, 0))
        self.assertEqual(self.store.visit('a'*32, '3'*32), self.expected(3, 2, 1, 1))
        self.assertEqual(self.store.visit('a'*32, '4'*32), self.expected(4, 2, 2, 1))
        self.assertEqual(self.store.visit('a'*32, '4'*32), self.expected(4, 2, 2, 1))
        self.assertEqual(Store(self.path, today=lambda: self.day).read(), self.expected(4, 2, 2, 1))

    def test_legacy_migration_is_once_and_preserves_totals(self):
        legacy = Path(self.temp.name) / 'legacy.sqlite3'
        with sqlite3.connect(str(legacy)) as db:
            db.executescript("CREATE TABLE visitors(id TEXT PRIMARY KEY); CREATE TABLE totals(id INTEGER PRIMARY KEY,visits INTEGER); INSERT INTO totals VALUES(1,7); INSERT INTO visitors VALUES('old-hash');")
        migrated = Store(legacy, today=lambda: self.day, legacy_day=self.day)
        self.assertEqual(migrated.read(), self.expected(7, 1, 7, 1))
        self.day = '2026-10-26'
        again = Store(legacy, today=lambda: self.day, legacy_day=self.day)
        self.assertEqual(again.read(), self.expected(7, 1, 0, 0))

    def test_persistence_deduplication_and_concurrency(self):
        self.assertEqual(self.store.visit('a'*32, '1'*32), self.expected(1, 1, 1, 1))
        self.assertEqual(self.store.visit('a'*32, '1'*32), self.expected(1, 1, 1, 1))
        self.store.visit('a'*32, '2'*32)
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(lambda i: self.store.visit(format(i, '032x'), format(i+100, '032x')), range(20)))
        self.assertEqual(Store(self.path, today=lambda: self.day).read(), self.expected(22, 21, 22, 21))
        with self.store.connect() as db:
            ids = [r[0] for r in db.execute('SELECT id FROM visitors')]
            self.assertTrue(all(len(v) == 64 for v in ids))
            self.assertNotIn('a'*32, ids)

    def test_http_rejections_and_reads_do_not_count(self):
        server = create_server('127.0.0.1', 0, self.store, 'https://agent.harrylab.cn')
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        url = 'http://127.0.0.1:' + str(server.server_port)
        try:
            with urllib.request.urlopen(url+'/stats') as r:
                self.assertEqual(json.load(r), self.expected(0, 0, 0, 0))
                self.assertEqual(r.headers['Cache-Control'], 'no-store')
            for origin, data, expected in [('https://other.example', {}, 403),
                                           ('https://agent.harrylab.cn', {'visitor_id': 'bad'}, 400)]:
                req = urllib.request.Request(url+'/visit', data=json.dumps(data).encode(),
                    headers={'Origin': origin, 'Content-Type': 'application/json'})
                with self.assertRaises(urllib.error.HTTPError) as ctx:
                    urllib.request.urlopen(req)
                self.assertEqual(ctx.exception.code, expected)
            self.assertEqual(self.store.read(), self.expected(0, 0, 0, 0))
            req = urllib.request.Request(url+'/visit', data=json.dumps({'visitor_id': 'b'*32, 'event_id': 'c'*32}).encode(),
                headers={'Origin': 'https://agent.harrylab.cn', 'Content-Type': 'application/json'})
            with urllib.request.urlopen(req) as r:
                self.assertEqual(json.load(r), self.expected(1, 1, 1, 1))
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == '__main__':
    unittest.main()
