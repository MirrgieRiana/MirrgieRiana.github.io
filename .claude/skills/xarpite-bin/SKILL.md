---
name: xarpite-bin
description: Xarpite の式やスクリプトを Linux x86-64 で実行するときに、同梱のランタイムを使うためのスキルなのだ～🌱
---

# xarpite-bin

Linux x86-64 の Bash で、このスキルに同梱した `xarpite/xarpite` を実行するのだ～🌱
リポジトリのルートから、次のコマンドで API バージョン 5 を指定して `API_VERSION` を評価できるのだ～🌱

```sh
.claude/skills/xarpite-bin/xarpite/xarpite -A 5 -e API_VERSION
```

出力は `5` なのだ～🌱
別の作業ディレクトリからは、この `SKILL.md` と同じディレクトリにある `xarpite/xarpite` の絶対パスを使うのだ～🌱
既存のスクリプトを実行するときは、そのスクリプトに対応する API バージョンを `-A` で指定するのだ～🌱
環境変数 `XARPITE_ENGINE` で別のエンジンが指定されているときは、最初の引数に `--native` を渡すのだ～🌱

## 同梱版

[Xarpite v4.108.0 の公式配布物](https://github.com/MirrgieRiana/xarpite/releases/tag/v4.108.0) から、Linux x86-64 向けネイティブエンジンと起動に必要なファイルを同梱しているのだ～🌱
ライセンスは [xarpite/LICENSE](xarpite/LICENSE) を参照するのだ～🌱
