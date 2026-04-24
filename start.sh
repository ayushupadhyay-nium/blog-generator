#!/bin/bash
# Blog Generator — start both servers

NODE_BIN="/Users/ayushupadhyay/.nvm/versions/node/v20.20.2/bin"
export PATH="$NODE_BIN:$PATH"

ROOT="$(cd "$(dirname "$0")" && pwd)"
SERVER="$ROOT/server"
CLIENT="$ROOT/client"

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
  if grep -q "your_anthropic_api_key_here" "$SERVER/.env" 2>/dev/null; then
    echo "⚠️  Set your ANTHROPIC_API_KEY in server/.env before generating blogs."
    echo "   Open: $SERVER/.env"
    echo ""
  fi
fi

# Kill any existing processes on our ports
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "Starting Blog Generator..."
echo ""

# Start backend
cd "$SERVER"
node src/index.js &
SERVER_PID=$!
echo "✅ Backend: http://localhost:3001 (PID $SERVER_PID)"

# Start frontend
cd "$CLIENT"
"$NODE_BIN/node" "$CLIENT/node_modules/.bin/vite" --port 5173 &
CLIENT_PID=$!
echo "✅ Frontend: http://localhost:5173 (PID $CLIENT_PID)"

echo ""
echo "Open http://localhost:5173 in your browser."
echo "Press Ctrl+C to stop."

# Wait and clean up
trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; echo 'Stopped.'" EXIT INT TERM
wait
