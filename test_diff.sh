#!/bin/bash

echo "=== 1. Starting V1 Baseline Analysis ==="
RES1=$(curl -s -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d '{"url": "http://localhost:3000/sandbox"}')
TASK_ID1=$(echo $RES1 | grep -o '"taskId":"[^"]*' | cut -d'"' -f4)
echo "Task 1 ID: $TASK_ID1"

if [ -z "$TASK_ID1" ]; then
  echo "Failed to start task 1. Response: $RES1"
  exit 1
fi

while true; do
  STATUS=$(curl -s "http://localhost:3000/api/analyze?taskId=$TASK_ID1" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
  echo "Task 1 Status: $STATUS"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "error" ]; then
    break
  fi
  sleep 2
done

echo "Task 1 completed. Result:"
curl -s "http://localhost:3000/api/analyze?taskId=$TASK_ID1" | sed 's/\\n/\n/g' | grep -o '"differences":\[[^]]*\]' || true
echo ""

echo "=== 2. Replacing page.tsx with V2 ==="
cp src/app/sandbox/v2_page_backup.tsx src/app/sandbox/page.tsx
echo "File replaced. Waiting 3 seconds for Next.js to recompile..."
sleep 3

echo "=== 3. Starting V2 Diff Analysis ==="
RES2=$(curl -s -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d '{"url": "http://localhost:3000/sandbox"}')
TASK_ID2=$(echo $RES2 | grep -o '"taskId":"[^"]*' | cut -d'"' -f4)
echo "Task 2 ID: $TASK_ID2"

if [ -z "$TASK_ID2" ]; then
  echo "Failed to start task 2. Response: $RES2"
  exit 1
fi

while true; do
  STATUS=$(curl -s "http://localhost:3000/api/analyze?taskId=$TASK_ID2" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
  echo "Task 2 Status: $STATUS"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "error" ]; then
    break
  fi
  sleep 2
done

echo "Task 2 completed. Result:"
curl -s "http://localhost:3000/api/analyze?taskId=$TASK_ID2"
echo ""

