#!/usr/bin/env bash

xarpite -A 5 -q -e '
  error := () -> :
    ERR << "Blocked"
    EXIT << 1

  args := ARGS[]
  args.$# == 1 || error()
  args(0) =~ /\Ahttps:\/\/[^\s]+\z/ || error()

' -- "$@" || exit

curl --disable \
  --request GET \
  --proto '=https' \
  --proto-redir '=https' \
  --location \
  --max-redirs 5 \
  --globoff \
  --silent --show-error --fail \
  --url "$1"
