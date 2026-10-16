#!/usr/bin/env bash

(($# == 1)) || {
  echo "Usage: $0 <user_data_dir>" >&2
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

# user_data_dir には ~/.claude_tmp 以下のディレクトリのみ指定可能
allowed_dir=$(realpath -e -- "$HOME/.claude_tmp") || exit 1
user_data_dir=$(realpath -e -- "$1") || exit 1
if [[ ! -d "$user_data_dir" || "$user_data_dir" != "$allowed_dir/"* ]]; then
  echo "Error: user_data_dir must be a directory under ~/.claude_tmp" >&2
  exit 1
fi


exec "$chrome_path" \
  --headless \
  --incognito \
  --remote-debugging-port=0 \
  --user-data-dir="$user_data_dir"
