#!/usr/bin/env bash

# 次のようにパイプで入出力をすることで簡単に扱えます。
# `cat ....jsonl | .../claude-log-parser.sh > ....txt`

(($# == 0)) || {
  echo "Usage: $0" >&2
  echo "Example: cat input.jsonl | $0 > output.txt" >&2
  exit 1
}

"$(dirname -- "$0")/../../xarpite/xa" '
  INC += "https://raw.githubusercontent.com/MirrgieRiana/claude-log-parser/refs/heads/main/.xarpite/maven"
  USE("io.github.mirrgieriana:claude-log-parser:1.0.0")
'
