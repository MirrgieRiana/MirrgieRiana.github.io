#!/usr/bin/env bash

xarpite="$(dirname -- "$0")/../xarpite-bin/xarpite/xarpite"

set -euo pipefail

(($# == 1)) || {
  echo "Usage: $0 <request_json_file>" >&2
  exit 1
}
export request_json_file=$1

request_json=$(cat "$request_json_file")

printf '%s' "$request_json" | NODE_PATH="$(dirname -- "$0")/node_modules${NODE_PATH:+:$NODE_PATH}" node -e '
  const { parse } = require("graphql/language/parser.js");
  const fs = require("node:fs");
  const requestJson = fs.readFileSync(0, "utf8");
  const request = JSON.parse(requestJson);
  const query = request.query;
  const tree = parse(query);
  const treeJson = JSON.stringify(tree);
  console.log(treeJson);
' | "$xarpite" --native -A 5 -q -e '
  (IN.$*.definitions() | _.operation == "mutation" >> ANY) && :
    ERRL << "Mutation is forbidden."
    EXIT << 1
'

printf '%s' "$request_json" | gh api graphql --input -
