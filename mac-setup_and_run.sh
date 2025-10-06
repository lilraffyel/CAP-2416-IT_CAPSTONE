#!/bin/bash
# setup_and_run.sh

# --- Backend setup ---
cd CAP-2416-IT-Draft-master/backend || exit

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install backend dependencies
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
else
  pip install flask flask-cors pgmpy
fi

# Initialize DB (optional, skip if already done)
if [ -f init_db.py ]; then
  python init_db.py
fi

# Start backend (in background)
python app.py &

# --- Frontend setup ---
cd ../frontend || exit

# Install frontend dependencies
if [ -f package.json ]; then
  npm install
fi

# Start frontend (in background)
npm start &

echo ""
echo "Both backend and frontend are starting!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"