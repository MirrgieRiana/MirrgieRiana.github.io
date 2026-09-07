#!/usr/bin/env bash

"$(dirname -- "$0")/../../xarpite/xa" -q '
  table := []
  stringToIndex := {}
  add := s, c -> :
    i := stringToIndex(s)
    i == NULL && :
      i = table.$#
      table += s
      stringToIndex(s) = i
    "{$i|$c}"

  s := INB >> UTF8D

  s = s
    ::replace("%"; "%Z")
    ::replace("1"; "%A")
    ::replace("2"; "%B")
    ::replace("3"; "%C")
    ::replace("4"; "%D")
    ::replace("5"; "%E")
    ::replace("6"; "%F")
    ::replace("7"; "%G")
    ::replace("8"; "%H")
    ::replace("9"; "%I")
    ::replace("0"; "%J")
    ::replace("{"; "%K")
    ::replace("|"; "%L")
    ::replace("}"; "%M")

  s = add(s; 1)

  # 反復部分の抽出
  (
    i := 0
    WHILE [ => i < table.$# ] ( =>
      (LOOP | :
        old := table(i)
        # １文字の反復
        table(i) = table(i)::replace(
          /([^ \t\r\n{|}0-9]|\{\d+\|\d+\})(?:[ \t\r\n]*\1+)+/g
          m -> add(m.1; m.0 >> SPLIT[m.1] >> COUNT | _ - 1)
        )
        # 複数文字の反復
        table(i) = table(i)::replace(
          /((?![ \t\r\n])(?:[^{|}0-9]|\{\d+\|\d+\}){2,200}?)(?:[ \t\r\n]*\1+)+/g
          m -> add(m.1; m.0 >> SPLIT[m.1] >> COUNT | _ - 1)
        )
        table(i) == old && break!!
      ) !: break
      i++
    )
  )

  # 展開
  expand := s -> :
    (LOOP | :
      old := s
      s = s::replace(
        /\{(\d+)\|(\d+)\}/g
        m -> :
          s := expand(table(m.1))
          c := m.2.+
          s.$# * c <= 10 ? s * c : "{$s}*{$c}"
      )
      s == old && break!!
    ) !: break
    s
  s = expand(table(0))

  s = s
    ::replace("%A"; "1")
    ::replace("%B"; "2")
    ::replace("%C"; "3")
    ::replace("%D"; "4")
    ::replace("%E"; "5")
    ::replace("%F"; "6")
    ::replace("%G"; "7")
    ::replace("%H"; "8")
    ::replace("%I"; "9")
    ::replace("%J"; "0")
    ::replace("%K"; "{")
    ::replace("%L"; "|")
    ::replace("%M"; "}")
    ::replace("%Z"; "%")

  #ERR << "-----" // TODO
  #ERR << s // TODO
  #ERR << "-----" // TODO
  #table() | i, _ => ERR << "$i  $_" // TODO
  #ERR << "-----" // TODO

  OUTB << UTF8 << s
'
