#!/usr/bin/env python3
"""Validate ordered migrations against a new, empty local SQLite DB."""
import pathlib, sqlite3, sys
if len(sys.argv) != 2:
    raise SystemExit('usage: python3 scripts/init-local-db.py NEW_DATABASE_PATH')
dest = pathlib.Path(sys.argv[1])
if dest.exists():
    raise SystemExit('Refusing existing database: ' + str(dest))
root = pathlib.Path(__file__).resolve().parents[1]
paths = sorted((root / 'drizzle').glob('[0-9]*.sql'))
if not paths:
    raise SystemExit('No migrations found')
db = sqlite3.connect(dest)
try:
    db.executescript('BEGIN;\n' + '\n'.join(p.read_text() for p in paths) + '\nCOMMIT;')
    names = [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
    expected = ['daily_scores', 'daily_version_scores', 'devices', 'runs']
    if names != expected:
        raise RuntimeError('Unexpected tables: ' + repr(names))
    assert 'version' in [r[1] for r in db.execute('PRAGMA table_info(runs)')]
    print('PASS: %d migrations, tables: %s, no production data imported' % (len(paths), ', '.join(names)))
finally:
    db.close()
