#!/usr/bin/env bash

xarpite="$(dirname -- "$0")/../xarpite-bin/xarpite/xarpite"

gh api graphql -f "query=$("$xarpite" --native -A 5 -e '
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
