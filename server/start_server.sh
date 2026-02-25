#!/bin/bash
# Prerequisites: ngrok CLI and uv must be installed and available in PATH.
# Run on a Unix-like shell (Linux bash, macOS zsh, Git Bash on Windows).
nohup ngrok http 8080 > /dev/null 2>&1 &
uv run server.py