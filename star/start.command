#!/bin/bash
cd "$(dirname "$0")"
echo "Starting local server for Solar System..."
echo "Please wait, opening browser..."
python3 -m http.server 8000 &
sleep 2
open http://localhost:8000
wait
