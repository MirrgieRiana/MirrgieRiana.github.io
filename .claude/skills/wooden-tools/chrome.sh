#!/usr/bin/env bash

(($# == 0)) || {
  echo "Usage: $0" >&2
  exit 1
}

# chrome の存在確認
chrome_path=$(cat "$(dirname -- "$0")/../../CHROME_PATH") || {
  echo "Error: Failed to read CHROME_PATH" >&2
  exit 1
}
if [[ ! -x "$chrome_path" ]]; then
  echo "Error: Chrome executable not found at $chrome_path" >&2
  exit 1
fi


exec "$chrome_path" \
  --headless \
  --incognito \
  --remote-debugging-port=0
