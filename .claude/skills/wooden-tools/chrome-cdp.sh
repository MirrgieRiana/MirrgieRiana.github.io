#!/usr/bin/env bash

(($# == 1)) || {
  echo "Usage: $0 <chrome-browser-websocket-url>" >&2
  exit 1
}

if [[ ! "$1" =~ ^ws://127\.0\.0\.1:[0-9]+/devtools/browser/[a-zA-Z0-9-]+$ ]]; then
  echo "Error: Expected a local Chrome browser WebSocket URL" >&2
  exit 1
fi

command -v websocat >/dev/null 2>&1 || {
  echo "Error: websocat is not installed" >&2
  exit 1
}

exec websocat --text --no-close --buffer-size=16777216 "$1"
