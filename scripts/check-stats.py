import concurrent.futures
import json
from pathlib import Path
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'server'))
from stats import Store, create_server


class StatsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / 'stats.sqlite3'
        self.store = Store(self.path)

    def tearDown(self):
        self.temp.cleanup()

    def test_persistence_deduplication_and_concurrency(self):
        self.assertEqual(self.store.visit('a'*32, '1'*32), {'visits': 1, 'visitors': 1})
        self.assertEqual(self.store.visit('a'*32, '1'*32), {'visits': 1, 'visitors': 1})
        self.store.visit('a'*32, '2'*32)
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(lambda i: self.store.visit(format(i, '032x'), format(i+100, '032x')), range(20)))
        self.assertEqual(Store(self.path).read(), {'visits': 22, 'visitors': 21})
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
                self.assertEqual(json.load(r), {'visits': 0, 'visitors': 0})
                self.assertEqual(r.headers['Cache-Control'], 'no-store')
            for origin, data, expected in [('https://other.example', {}, 403),
                                           ('https://agent.harrylab.cn', {'visitor_id': 'bad'}, 400)]:
                req = urllib.request.Request(url+'/visit', data=json.dumps(data).encode(),
                    headers={'Origin': origin, 'Content-Type': 'application/json'})
                with self.assertRaises(urllib.error.HTTPError) as ctx:
                    urllib.request.urlopen(req)
                self.assertEqual(ctx.exception.code, expected)
            self.assertEqual(self.store.read(), {'visits': 0, 'visitors': 0})
            req = urllib.request.Request(url+'/visit', data=json.dumps({'visitor_id': 'b'*32, 'event_id': 'c'*32}).encode(),
                headers={'Origin': 'https://agent.harrylab.cn', 'Content-Type': 'application/json'})
            with urllib.request.urlopen(req) as r:
                self.assertEqual(json.load(r), {'visits': 1, 'visitors': 1})
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == '__main__':
    unittest.main()
