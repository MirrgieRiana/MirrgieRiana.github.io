#!/usr/bin/env bash

if command -v xarpite >/dev/null 2>&1; then
  xarpite=xarpite
else
  xarpite="$(dirname -- "$0")"/../../xarpite/xarpite
fi

gh api graphql -f "query=$("$xarpite" -A 5 -e '
  ARGS.$# == 1 + 3 || :
    ERRL << "Usage: $(ARGS.0) <owner> <repo> <number>"
    EXIT << 1
  owner := ARGS.1
  repo := ARGS.2
  number := ARGS.3.+
  %>
    query {
      repository(owner:<%= owner >> JSON %>,name:<%= repo >> JSON %>) {
        pullRequest(number:<%= number %>) {
          reviewThreads(first:100) {
            nodes {
              isResolved
              comments(first:100) {
                nodes {
                  body
                  state
                  url
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    }
  <%
' -- "$0" "$@")"
