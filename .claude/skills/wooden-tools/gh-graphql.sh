#!/usr/bin/env bash

if command -v xarpite >/dev/null 2>&1; then
  xarpite=xarpite
else
  xarpite="$(dirname -- "$0")"/../../xarpite/xarpite
fi

set -euo pipefail

(($# == 1)) || {
  echo "Usage: $0 <request_json_file>" >&2
  exit 1
}
export request_json_file=$1

request_json=$(cat "$request_json_file")

printf '%s' "$request_json" | node -e '
  const { parse } = require("graphql");
  const fs = require("node:fs");
  const requestJson = fs.readFileSync(0, "utf8");
  const request = JSON.parse(requestJson);
  const query = request.query;
  const tree = parse(query);
  const treeJson = JSON.stringify(tree);
  console.log(treeJson);
' | "$xarpite" -A 5 -q -e '
  (IN.$*.definitions() | _.operation == "mutation" >> ANY) && :
    ERRL << "Mutation is forbidden."
    EXIT << 1
'

printf '%s' "$request_json" | gh api graphql --input -
