#!/usr/bin/env bash

set -eu

cd -- "$(dirname -- "$0")"

../xarpite-bin/xarpite/xarpite --native -A 5 -e '
  FILE_NAMES("..") | dirName => :
    (
      dir := ".." / dirName
      IS_DIR(dir) || continue!!
      file := dir / "SKILL.md"
      EXISTS(file) || continue!!
      body := READ(file)::replace(/\r\n?/g; "\n")
      yaml := body./\A\s*^---[ \t]*\n([\s\S]*?)\n---[ \t]*$/m?.1 ?: ""
      data := (YAMLD(yaml) !? {}) ?: {}
      "$dirName: $(data.name ?: "Unnamed Skill") - $(data.description ?: "No description.")"
    ) !: continue
'
