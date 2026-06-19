#!/bin/bash
# wordcastle heartbeat — the quill and its vows
# Rhythm: 24h if loops open (warden turns daily), 7d if all closed

cd "$(dirname "$0")"

OPEN_LOOPS=$(ls loops/open/*.md 2>/dev/null | wc -l | tr -d ' ')
KEEP_ENTRIES=$(grep "^## " keep/keep.md 2>/dev/null | wc -l | tr -d ' ')

if [ "$OPEN_LOOPS" -gt 0 ]; then
  echo "$OPEN_LOOPS open loop(s), $KEEP_ENTRIES in the keep"
  echo "NEXT:1440"
else
  echo "no open loops, $KEEP_ENTRIES understandings in the keep — resting"
  echo "NEXT:10080"
fi

exit 0