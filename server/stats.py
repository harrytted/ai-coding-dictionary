#!/usr/bin/env python3
"""Small same-origin, persistent visit counter. Compatible with Python 3.6+."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
import hashlib
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
import re
import socketserver
import sqlite3


def shanghai_day(now=None):
    now = now or datetime.now(timezone.utc)
    return now.astimezone(timezone(timedelta(hours=8))).strftime('%Y-%m-%d')


class Store:
    def __init__(self, path, today=shanghai_day, legacy_day=None):
        self.path = str(path)
        self.today = today
        if legacy_day:
            datetime.strptime(legacy_day, '%Y-%m-%d')
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute('PRAGMA journal_mode=WAL')
            had_daily = db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='daily_totals'").fetchone()
            db.executescript('''
                BEGIN IMMEDIATE;
                CREATE TABLE IF NOT EXISTS visitors (id TEXT PRIMARY KEY);
                CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY);
                CREATE TABLE IF NOT EXISTS totals (id INTEGER PRIMARY KEY, visits INTEGER NOT NULL);
                INSERT OR IGNORE INTO totals VALUES (1, 0);
                CREATE TABLE IF NOT EXISTS daily_totals (day TEXT PRIMARY KEY, visits INTEGER NOT NULL);
                CREATE TABLE IF NOT EXISTS daily_visitors (day TEXT NOT NULL, id TEXT NOT NULL, PRIMARY KEY(day,id));
            ''')
            if legacy_day and not had_daily:
                db.execute('INSERT INTO daily_totals SELECT ?,visits FROM totals WHERE id=1', (legacy_day,))
                db.execute('INSERT INTO daily_visitors SELECT ?,id FROM visitors', (legacy_day,))

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        try:
            with db:
                yield db
        finally:
            db.close()

    def stats(self, db, day=None):
        day = day or self.today()
        daily = db.execute('SELECT visits FROM daily_totals WHERE day=?', (day,)).fetchone()
        return {'visits': db.execute('SELECT visits FROM totals WHERE id=1').fetchone()[0],
                'visitors': db.execute('SELECT COUNT(*) FROM visitors').fetchone()[0],
                'today_visits': daily[0] if daily else 0,
                'today_visitors': db.execute('SELECT COUNT(*) FROM daily_visitors WHERE day=?', (day,)).fetchone()[0],
                'date': day, 'timezone': 'Asia/Shanghai'}

    def read(self):
        with self.connect() as db:
            db.execute('BEGIN')
            return self.stats(db)

    def visit(self, visitor, event):
        visitor = hashlib.sha256(visitor.encode('ascii')).hexdigest()
        event = hashlib.sha256(event.encode('ascii')).hexdigest()
        day = self.today()
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            added = db.execute('INSERT OR IGNORE INTO events VALUES (?)', (event,)).rowcount
            if added:
                db.execute('INSERT OR IGNORE INTO visitors VALUES (?)', (visitor,))
                db.execute('UPDATE totals SET visits=visits+1 WHERE id=1')
                db.execute('INSERT OR IGNORE INTO daily_totals VALUES (?,0)', (day,))
                db.execute('UPDATE daily_totals SET visits=visits+1 WHERE day=?', (day,))
                db.execute('INSERT OR IGNORE INTO daily_visitors VALUES (?,?)', (day, visitor))
            return self.stats(db, day)


class Server(socketserver.ThreadingMixIn, HTTPServer):
    daemon_threads = True


def create_server(host, port, store, origin):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass  # The counter does not store request IP addresses or user agents.

        def reply(self, status, data):
            body = json.dumps(data).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path != '/stats':
                return self.reply(404, {'error': 'Not found'})
            try:
                self.reply(200, store.read())
            except sqlite3.Error:
                self.reply(503, {'error': 'Temporarily unavailable'})

        def do_POST(self):
            if self.path != '/visit':
                return self.reply(404, {'error': 'Not found'})
            if self.headers.get('Origin') != origin:
                return self.reply(403, {'error': 'Invalid origin'})
            if self.headers.get_content_type() != 'application/json':
                return self.reply(415, {'error': 'Expected JSON'})
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if length < 1 or length > 1024:
                    return self.reply(413, {'error': 'Invalid size'})
                data = json.loads(self.rfile.read(length).decode('utf-8'))
                if not isinstance(data, dict):
                    raise ValueError()
                visitor, event = data.get('visitor_id'), data.get('event_id')
                if not all(isinstance(value, str) and re.fullmatch('[a-f0-9]{32}', value)
                           for value in (visitor, event)):
                    raise ValueError()
            except (ValueError, UnicodeError):
                return self.reply(400, {'error': 'Invalid request'})
            try:
                self.reply(200, store.visit(visitor, event))
            except sqlite3.Error:
                self.reply(503, {'error': 'Temporarily unavailable'})

    return Server((host, port), Handler)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8871)
    parser.add_argument('--db', default='/var/lib/ai-coding-dictionary-stats/stats.sqlite3')
    parser.add_argument('--origin', default='https://agent.harrylab.cn')
    parser.add_argument('--migrate-legacy-day', help='One-time migration, only when all legacy visits are known to belong to this day')
    args = parser.parse_args()
    if args.migrate_legacy_day:
        print(json.dumps(Store(args.db, legacy_day=args.migrate_legacy_day).read()))
        raise SystemExit(0)
    create_server('127.0.0.1', args.port, Store(args.db), args.origin).serve_forever()
