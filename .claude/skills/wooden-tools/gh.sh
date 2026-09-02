#!/usr/bin/env bash

xarpite -A 5 -q -e '
  error := () -> :
    ERR << "Blocked"
    EXIT << 1

  args := ARGS[]
  shiftOrNull := () -> args.$# > 0 ? args::shift() : NULL

  subcommand := shiftOrNull() ?: error()
  subcommand == "api" || error()

  path := shiftOrNull() ?: error()
  path =~ /\A[a-zA-Z0-9][a-zA-Z0-9\/._%-]*(\?[a-zA-Z0-9\/._%&=-]*)?\z/ || error()

  WHILE [ => args.$# > 0 ] ( =>
    arg := args::shift()
    : arg @ ["--paginate", "--slurp", "--include", "--silent"] ? NULL
    : arg @ ["--jq", "--cache"] ? :
      shiftOrNull() ?: error()
      NULL
    : error()
  )

' -- "$@" || exit

unset GH_HOST
unset GH_CONFIG_DIR

gh "$@"
