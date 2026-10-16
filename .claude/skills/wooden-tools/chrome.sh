#!/usr/bin/env bash

(($# == 0)) || {
  echo "Usage: $0" >&2
  exit 1
}

# bwrap存在チェック
if ! command -v bwrap >/dev/null 2>&1; then
  echo "Error: bwrap is not installed. Please install bubblewrap." >&2
  exit 1
fi

# chrome の存在確認
chrome_path=$(cat "$(dirname -- "$0")/../../CHROME_PATH") || {
  echo "Error: Failed to read CHROME_PATH" >&2
  exit 1
}
if [[ ! -x "$chrome_path" ]]; then
  echo "Error: Chrome executable not found at $chrome_path" >&2
  exit 1
fi


exec bwrap \
  --ro-bind / / \
  --dev /dev \
  --proc /proc \
  --tmpfs /tmp \
  --die-with-parent \
  --unshare-pid \
  "$chrome_path" \
  --headless \
  --incognito \
  --remote-debugging-port=0 \
  --password-store=basic
