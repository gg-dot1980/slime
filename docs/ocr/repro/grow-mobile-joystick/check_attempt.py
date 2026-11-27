"""Opt-in, bounded Grow50 transport diagnostic. Retains the private diagnostic ledger."""
import argparse
from pathlib import Path
import time

from playwright.sync_api import sync_playwright

from mobile_ledger import database_path, rows, summarize, writer
from run import SEALED_GROW50 as SAMPLE, attempt, load_sources, prepared


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--game-root", type=Path, required=True)
    parser.add_argument("--chromium", type=Path, required=True)
    parser.add_argument("--state-dir", type=Path, required=True, help="A NEW private diagnostic directory")
    args = parser.parse_args()
    args.command, args.sha256 = "diagnostic", SAMPLE
    candidate, games = load_sources(args)
    args.state_dir.mkdir(parents=True, exist_ok=False, mode=0o700)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=str(args.chromium), headless=True)
        try:
            with writer(args.state_dir, SAMPLE, {"purpose": "bounded diagnostic"}) as db:
                with prepared(browser, candidate, games, SAMPLE, "v2.13") as (page, touch, ready):
                    pump = touch.pump
                    limit = time.monotonic() + 5

                    def interrupt_after_touch():
                        pump()
                        if touch.summary()["receiver"]["maxSimultaneous"] == 2:
                            raise KeyboardInterrupt("Deliberate diagnostic stop with both contacts active")
                        if time.monotonic() >= limit:
                            raise RuntimeError("Diagnostic never observed both trusted contacts")

                    touch.pump = interrupt_after_touch
                    try:
                        attempt(db, 1, page, touch, ready)
                    except KeyboardInterrupt:
                        pass
                    stages = [stage for _, stage, _ in rows(db)]
                    result = rows(db)[-1][2]
                    summary = summarize(db)["editions"]["v2.13"]
                    if not (stages == ["start-intent", "native-start", "result"]
                            and result["outcome"] == "abort" and result["releaseVerified"]
                            and result["controlVerified"] and result["touch"]["activeContacts"] == []
                            and result["touch"]["receiver"]["active"] == []
                            and result["touch"]["receiver"]["maxSimultaneous"] == 2
                            and summary["attempts"] == summary["observedNativeStarts"] == 1
                            and summary["completed"] == 0 and summary["outcomes"]["abort"] == 1):
                        raise AssertionError(f"Diagnostic mismatch: {summary}, {result}")
                    # A stray attempted replay must be blocked even if the worker had stalled.
                    gate = page.evaluate("""() => {
                      const w = document.querySelector('#game').contentWindow;
                      w.document.querySelector('#start').click();
                      return w.__mobileStartGate.state();
                    }""")
                    if gate != {"accepted": 1, "blocked": 1}:
                        raise AssertionError(f"Unexpected replay gate state: {gate}")
                    print(f"Private diagnostic ledger: {database_path(args.state_dir, SAMPLE)}")
                    print("PASS v2.13 diagnostic: one native start, two trusted contacts, abort retained, "
                          "release verified, duplicate native click blocked; zero exploration starts.")
        finally:
            browser.close()


if __name__ == "__main__":
    main()
