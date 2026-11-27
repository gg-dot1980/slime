"""One private, immutable exploration plan per candidate in the same state directory."""

from collections import Counter
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import json
import os
from pathlib import Path
import re
import sqlite3


VERSIONS = ("v2.13", "v2.22")
PLAN = tuple(version for _ in range(4) for version in VERSIONS)
OUTCOMES = {"win", "late-win", "death", "game-timeout", "deadline", "abort", "unknown"}


def digest_argument(value):
    if not re.fullmatch("[a-f0-9]{64}", value):
        raise ValueError("Expected a lowercase SHA-256 digest")
    return value


def encode(value):
    return json.dumps(value, separators=(",", ":"), sort_keys=True, allow_nan=False)


def database_path(directory, pin):
    return Path(directory) / (digest_argument(pin) + ".sqlite3")


@contextmanager
def browser_lock(directory):
    """Reject a second mobile worker before it launches another Chromium."""
    directory = Path(directory)
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    lock = os.open(directory / "mobile-browser.lock", os.O_CREAT | os.O_RDWR, 0o600)
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield
    finally:
        os.close(lock)


@contextmanager
def writer(directory, pin, contract):
    directory = Path(directory)
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    path = database_path(directory, pin)
    lock = os.open(str(path) + ".lock", os.O_CREAT | os.O_RDWR, 0o600)
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        os.close(os.open(path, os.O_CREAT | os.O_RDWR, 0o600))
        db = sqlite3.connect(path)
        try:
            db.execute("PRAGMA synchronous=FULL")
            db.execute("PRAGMA journal_mode=DELETE")
            db.executescript("""
                CREATE TABLE IF NOT EXISTS frozen (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS events (
                    seq INTEGER PRIMARY KEY, slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 8),
                    stage TEXT NOT NULL, utc TEXT NOT NULL, data TEXT NOT NULL
                );
                CREATE UNIQUE INDEX IF NOT EXISTS once_per_slot ON events(slot,stage)
                    WHERE stage IN ('start-intent','native-start','result');
            """)
            serialized = encode(dict(contract, candidateSha256=pin, plan=PLAN))
            with db:
                db.execute("INSERT OR IGNORE INTO frozen VALUES(1,?)", (serialized,))
            if db.execute("SELECT value FROM frozen").fetchone()[0] != serialized:
                raise ValueError("Frozen candidate cohort contract differs from this runner")
            yield db
        finally:
            db.close()
    finally:
        os.close(lock)


def rows(db):
    return [(slot, stage, json.loads(data))
            for slot, stage, data in db.execute("SELECT slot,stage,data FROM events ORDER BY seq")]


def slot_states(records):
    states = {}
    for slot, stage, data in records:
        if stage == "start-intent":
            if slot in states or slot != len(states) + 1:
                raise ValueError("Out-of-order or duplicate slot")
            if any(state["result"] is None for state in states.values()):
                raise ValueError("Another slot remains open")
            states[slot] = {"native": False, "result": None}
        else:
            state = states.get(slot)
            if state is None or state["result"] is not None:
                raise ValueError("Unexpected event outside an open slot")
            if stage == "native-start" and not state["native"]:
                state["native"] = True
            elif stage == "result":
                if data.get("outcome") not in OUTCOMES:
                    raise ValueError("Unknown result kind")
                if data["outcome"] != "unknown" and not (state["native"] and data.get("releaseVerified") is True):
                    raise ValueError("A scored result needs native-start and release evidence")
                state["result"] = data
            elif stage != "observation":
                raise ValueError("Unexpected event or duplicate native-start")
    return states


def append(db, slot, stage, data):
    if not 1 <= slot <= len(PLAN):
        raise ValueError("Slot outside the fixed exploration")
    if stage == "start-intent":
        if data.get("version") != PLAN[slot - 1]:
            raise ValueError("Edition differs from frozen order")
    with db:
        slot_states([*rows(db), (slot, stage, data)])
        db.execute("INSERT INTO events(slot,stage,utc,data) VALUES (?,?,?,?)",
                   (slot, stage, datetime.now(timezone.utc).isoformat(), encode(data)))


def summarize(db):
    contract = json.loads(db.execute("SELECT value FROM frozen").fetchone()[0])
    states = slot_states(rows(db))
    totals = {}
    for edition in VERSIONS:
        selected = [state for slot, state in states.items() if PLAN[slot - 1] == edition]
        counts = Counter((state["result"] or {"outcome": "unknown"})["outcome"] for state in selected)
        native = sum(state["native"] for state in selected)
        totals[edition] = {
            "planned": PLAN.count(edition), "attempts": len(selected),
            "completed": sum(counts[k] for k in ("win", "late-win", "death", "game-timeout", "deadline")),
            "observedNativeStarts": native,
            "unverifiedStarts": sum(not state["native"] for state in selected),
            "openAttempts": sum(state["result"] is None for state in selected),
            "outcomes": {k: counts[k] for k in sorted(OUTCOMES)}, "wins": counts["win"],
            "winsPerAttempt": counts["win"] / len(selected) if native else None,
            "winsPerAttemptPercent": round(100 * counts["win"] / len(selected), 2) if native else None,
        }
        totals[edition]["allFourVerified"] = totals[edition]["completed"] == totals[edition]["planned"]
        totals[edition]["fourStartWinPercent"] = 25 * counts["win"] if totals[edition]["allFourVerified"] else None
    complete = len(states) == len(PLAN) and all(state["result"] for state in states.values())
    return {"candidateSha256": contract["candidateSha256"], "phase": "mobile-exploration",
            "editions": totals, "allSlotsSettled": complete}


def read_summary(directory, pin):
    path = database_path(directory, pin)
    with sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True) as db:
        return summarize(db)
