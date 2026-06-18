#!/bin/bash
# wordcastle heartbeat — the quill and its vows
# Checks: open loops, warden status, keep size
# Rhythm: every 24h if loops are open (warden needs time), every 7d if all closed

cd "$(dirname "$0")"

OPEN_LOOPS=$(ls loops/open/*.md 2>/dev/null | wc -l | tr -d ' ')
KEEP_ENTRIES=$(grep "^## " keep/keep.md 2>/dev/null | wc -l | tr -d ' ')
LAST_WARDEN=$(tail -1 loops/warden-launchd.log 2>/dev/null)

if [ "$OPEN_LOOPS" -gt 0 ]; then
  echo "wordcastle: $OPEN_LOOPS open loop(s), $KEEP_ENTRIES in the keep"
  # Warden turns daily — check every 24h to see if it turned
  echo "NEXT:1440"
else
  # No open loops — the castle rests. Check weekly.
  echo "wordcastle: no open loops, $KEEP_ENTRIES understandings in the keep — resting"
  echo "NEXT:10080"  # 7 days
fi

exit 0