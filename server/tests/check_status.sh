#!/bin/bash
# Usage: bash check_status.sh
# Checks if the local Flask server and ngrok tunnel are running.

BASE_URL="http://localhost:8080"

echo "--- Server Health Check ---"
if curl -s --connect-timeout 3 -m 5 "${BASE_URL}/" > /dev/null 2>&1; then
  echo "🟢 Server is reachable at ${BASE_URL}"
else
  echo "🔴 Server is not reachable at ${BASE_URL}. Is it running?"
fi

echo ""
echo "--- ngrok Tunnel Check ---"
NGROK_RESPONSE=$(curl -s --connect-timeout 3 -m 5 http://localhost:4040/api/tunnels 2>/dev/null)
if [ -z "$NGROK_RESPONSE" ]; then
  echo "🔴 ngrok is NOT running (localhost:4040 unreachable)"
else
  NGROK_URL=$(echo "$NGROK_RESPONSE" | python3 -c "
import sys, json
try:
    tunnels = json.load(sys.stdin).get('tunnels', [])
    for t in tunnels:
        print(t['public_url'])
except:
    print('(could not parse ngrok response)')
" 2>/dev/null)
  echo "🟢 ngrok is running. Public URL(s): $NGROK_URL"
fi
