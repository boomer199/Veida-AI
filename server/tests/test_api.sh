#!/bin/bash
# Usage: ./test_api.sh <clerk_id>
# Tests local server endpoints for a given clerk_id.
# Reads CLERK_SECRET_KEY from veidaai/.env.local

BASE_URL="http://localhost:8080"

# Load .env.local from the veidaai directory (relative to this script)
ENV_FILE="$(dirname "${BASH_SOURCE[0]}")/../../veidaai/.env.local"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "WARNING: .env.local not found at $ENV_FILE"
fi

if [ -z "$1" ]; then
  echo "Usage: $0 <clerk_id>"
  exit 1
fi

CLERK_ID="$1"

# Usage: run_request <label> <url> [header]
run_request() {
  local LABEL="$1"
  local URL="$2"
  local HEADER="$3"

  echo ""
  echo "--- ${LABEL} ---"

  if [ -n "$HEADER" ]; then
    RESPONSE=$(curl -s --connect-timeout 5 -m 10 -w "\n%{http_code}" -H "$HEADER" "$URL")
  else
    RESPONSE=$(curl -s --connect-timeout 5 -m 10 -w "\n%{http_code}" "$URL")
  fi

  HTTP_STATUS=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_STATUS" = "200" ]; then
    echo "🟢 HTTP Status: $HTTP_STATUS OK"
  else
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo "🔴 HTTP Status: $HTTP_STATUS"
  fi
}

echo "========================================"
echo "Testing with clerk_id: $CLERK_ID"
echo "========================================"

echo ""
echo "--- Server Health Check ---"
if curl -s --connect-timeout 3 -m 5 "${BASE_URL}/" > /dev/null 2>&1; then
  echo "🟢 Server is reachable at ${BASE_URL}"
else
  echo "🔴 Server is not reachable at ${BASE_URL}. Is it running?"
  exit 1
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

run_request "GET /api/get_courses" "${BASE_URL}/api/get_courses?clerk_id=${CLERK_ID}"

run_request "GET /api/check_premium_status" "${BASE_URL}/api/check_premium_status?clerk_id=${CLERK_ID}"

echo ""
echo "--- POST /api/create_course (missing-user graceful degradation test) ---"
CREATE_RESPONSE=$(curl -s --connect-timeout 5 -m 10 -w "\n%{http_code}" \
  -X POST "${BASE_URL}/api/create_course" \
  -H "Content-Type: application/json" \
  -d "{\"clerk_id\":\"${CLERK_ID}\",\"course_name\":\"Test Course\",\"description\":\"Test desc\",\"exam_date\":\"2026-12-31\"}")
CREATE_STATUS=$(echo "$CREATE_RESPONSE" | tail -1)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | head -n -1)
if [ "$CREATE_STATUS" = "201" ]; then
  echo "🟢 HTTP Status: $CREATE_STATUS — course created (treated as free tier)"
elif [ "$CREATE_STATUS" = "403" ]; then
  echo "🟡 HTTP Status: $CREATE_STATUS — free-tier course cap enforced (expected if >=2 courses exist)"
  echo "$CREATE_BODY" | python3 -m json.tool 2>/dev/null || echo "$CREATE_BODY"
else
  echo "$CREATE_BODY" | python3 -m json.tool 2>/dev/null || echo "$CREATE_BODY"
  echo "🔴 HTTP Status: $CREATE_STATUS — unexpected (500 = bug still present)"
fi

echo ""
echo "--- GET /api/clerk/users/<clerk_id> ---"
if [ -z "$CLERK_SECRET_KEY" ]; then
  echo "🔴 SKIPPED: CLERK_SECRET_KEY not found in .env.local"
else
  run_request "Clerk API /v1/users" \
    "https://api.clerk.com/v1/users/${CLERK_ID}" \
    "Authorization: Bearer ${CLERK_SECRET_KEY}"
fi

echo ""
echo "========================================"
echo "Done."
echo "========================================"
