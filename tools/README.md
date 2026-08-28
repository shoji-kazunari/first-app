# 機種の増やし方

## 手順

1. `assets/js/data/machines/<slug>.js` を1つ書く（既存の機種ファイルをコピーするのが早い）
2. `node tools/build-machine-pages.js` を実行する

以上です。機種ページ（`machines/<slug>/index.html`）とTOPの読み込み行は自動で作られます。

## それぞれが何をしているか

### `build-machine-pages.js`

機種ページは機種名・メーカー名・slug以外まったく同じ内容なので、雛形
（`machine-page.template.html`）を1枚だけ持ち、そこから展開します。共通レイアウトを
直したいときは雛形を1回直して再実行すれば、全機種のページに反映されます。

機種の一覧は `assets/js/data/machines/*.js` を実際に読み込んで取得するので、
このスクリプトに機種名を書き足す必要はありません。

- `node tools/build-machine-pages.js` … 生成して書き込む
- `node tools/build-machine-pages.js --check` … 差分を報告するだけ（書き込まない）。
  生成物とファイルが食い違っていたら終了コード1で落ちるので、
  「生成し忘れたまま作業していないか」の確認に使えます

meta descriptionは、その機種の「通常以外の状態」の名前から自動で組み立てます。
文言を指定したい場合は、機種データに `pageDescription` を書けばそちらが使われます。

### `core/machineValidator.js`

機種データの検査です。状態IDのtypoや確率の桁間違いは、その状態へ到達するまで
表面化せず気づきにくいので、`machineRegistry.register()` が読み込み時にまとめて
検査し、おかしければその場で例外にします。

主な検査項目:

- `nextState` / `baseStateId` / `distributionTable` の参照先が実在するか
- `weight` の合計が1になっているか（0.5のつもりで0.05と書く類のtypo対策）
- `probability` が0より大きく1以下か（`1/199.8` と書くつもりで `199.8` と書く対策）
- 大当たりの出玉が決まるか（`payoutTable` に該当ラウンドがあるか、`balls` 指定があるか）
- `countDown` の状態に `onExhausted` があるか（無いと消化しきった瞬間に落ちる）
- `mode` と `maxAttempts` の組み合わせが正しいか
- 状態のキーと `id` が一致しているか、`isBaseState` がちょうど1つか

`tests/machines.tests.js` が、登録済みの全機種に対してこの検査を実行します。
機種を増やしてもテストを書き足す必要はありません（読み込めば自動で対象になります）。
同じテストで、各状態から実際にエンジンを回して「当たり」「消化しきり」の
どちらも例外なく解決できることも確認しています。

## アクセス解析

Google Analytics 4を使う。測定IDは `assets/js/core/config.js` の
`analyticsMeasurementId` の1箇所にだけ書く。空のあいだはタグ自体を読み込まないので、
外部への送信は一切起きない（機種ページの雛形にもTOPにも読み込み行は入れてあるので、
IDを入れれば全ページで同時に有効になる）。

計測を止めたくなったら、この値を空文字に戻せば止まる。

何を集めているかは `/privacy/`（`privacy/index.html`）に書いてある。
送る項目を増やすときは、必ずそちらも直すこと。
