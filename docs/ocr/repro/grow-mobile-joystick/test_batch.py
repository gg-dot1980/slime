"""Offline evidence, release and restart regressions. No natural starts."""
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from mobile_ledger import PLAN, append, browser_lock, read_summary, summarize, writer
from run import classify, controls_verified


def snapshot(**updates):
    return dict({"result": False, "ending": False, "overlay": False, "title": "",
                 "description": "", "size": 25, "remaining": "05:00"}, **updates)


class EvidenceTest(unittest.TestCase):
    def test_deadline_and_ending(self):
        self.assertIsNone(classify(snapshot(remaining="02:30", size=200)))
        self.assertEqual(classify(snapshot(remaining="02:29", size=200)), ("deadline", 151))
        self.assertIsNone(classify(snapshot(remaining="02:29", ending=True)))
        self.assertIsNone(classify(snapshot(remaining="00:00", overlay=True)))

    def test_native_visible_panel_and_game_time(self):
        cases = [
            ("成功過關！", "體型已達 200，成功存活！\n遊玩時間 02:30", "win", 150),
            ("You win!", "You reached size 200 and survived!\nPlay time 02:31", "late-win", 151),
            ("You win?", "You reached size 200 and survived!\nPlay time 00:02", "unknown", 2),
            ("You win!", "Play time 02:30", "unknown", 150),
            ("You win!", "You reached size 200 and survived!", "unknown", None),
            ("被大史萊姆吞掉了", "遊玩時間 00:00", "death", 0),
            ("You were eaten!", "Play time 00:04", "death", 4),
            ("Time's up!", "Play time 05:00", "game-timeout", 300),
        ]
        for title, description, outcome, seconds in cases:
            with self.subTest(title=title, description=description):
                s = snapshot(result=True, overlay=True, title=title, description=description, size=198)
                self.assertEqual(classify(s), (outcome, seconds))

    def test_only_actually_requested_controls_need_delivery(self):
        def proof(joy, boost, simultaneous, received_joy, received_boost, received_both):
            return {"requiredPointers": {"joy": joy, "boost": boost, "simultaneous": simultaneous},
                    "receiver": {"downs": {"joy": received_joy, "boost": received_boost},
                                 "maxSimultaneous": received_both}}
        self.assertTrue(controls_verified(proof(0, 0, 0, 0, 0, 0)))
        self.assertTrue(controls_verified(proof(5, 0, 0, 1, 0, 1)))
        self.assertTrue(controls_verified(proof(5, 2, 2, 1, 1, 2)))
        self.assertFalse(controls_verified(proof(5, 2, 2, 1, 0, 1)))
        self.assertFalse(controls_verified({}))


class LedgerTest(unittest.TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.directory = Path(self.tmp.name)
        self.pin = "a" * 64

    def test_restart_unknown_no_replacement_and_full_denominators(self):
        with writer(self.directory, self.pin, {"protocol": 1}) as db:
            append(db, 1, "start-intent", {"version": PLAN[0]})
        summary = read_summary(self.directory, self.pin)["editions"]["v2.13"]
        self.assertEqual((summary["attempts"], summary["openAttempts"], summary["unverifiedStarts"]), (1, 1, 1))
        self.assertEqual(summary["outcomes"]["unknown"], 1)
        self.assertIsNone(summary["winsPerAttemptPercent"])
        with writer(self.directory, self.pin, {"protocol": 1}) as db:
            with self.assertRaises(ValueError):
                append(db, 1, "start-intent", {"version": PLAN[0]})
            with self.assertRaises(ValueError):
                append(db, 2, "start-intent", {"version": PLAN[1]})
            append(db, 1, "result", {"outcome": "unknown", "releaseVerified": False})
            for slot, edition in enumerate(PLAN[1:], 2):
                append(db, slot, "start-intent", {"version": edition})
                append(db, slot, "native-start", {})
                append(db, slot, "result", {"outcome": "win", "releaseVerified": True})
            totals = summarize(db)
            self.assertTrue(totals["allSlotsSettled"])
            a, b = totals["editions"].values()
            self.assertEqual([a["attempts"], a["observedNativeStarts"], a["winsPerAttemptPercent"]], [4, 3, 75])
            self.assertIsNone(a["fourStartWinPercent"])
            self.assertEqual([b["attempts"], b["observedNativeStarts"], b["fourStartWinPercent"]], [4, 4, 100])
            with self.assertRaises(ValueError):
                append(db, 9, "start-intent", {"version": "v2.13"})
        with self.assertRaisesRegex(ValueError, "contract differs"):
            with writer(self.directory, self.pin, {"protocol": 2}):
                pass

    def test_claim_before_browser_and_impossible_scores(self):
        with browser_lock(self.directory):
            with self.assertRaises(BlockingIOError):
                with browser_lock(self.directory):
                    pass
        with writer(self.directory, self.pin, {}) as db:
            append(db, 1, "start-intent", {"version": "v2.13"})
            with self.assertRaises(ValueError):
                append(db, 1, "result", {"outcome": "win", "releaseVerified": True})
            append(db, 1, "native-start", {})
            with self.assertRaises(ValueError):
                append(db, 1, "result", {"outcome": "win", "releaseVerified": False})


if __name__ == "__main__":
    unittest.main()
