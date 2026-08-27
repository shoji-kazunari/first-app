#!/usr/bin/env node
// 機種ページ（machines/<slug>/index.html）を、テンプレート1枚から生成する。
//
// 機種ページは機種名・メーカー名・slug以外まったく同じ内容で、機種を増やすたびに
// 130行のHTMLをコピーしていた。10機種になると共通レイアウトの修正1回につき
// 10ファイル直すことになるので、雛形を1枚だけ持ってここから展開する。
//
// あわせてTOP（index.html）の機種データ読み込み行も書き換える。
// これで機種の追加は「assets/js/data/machines/<slug>.js を書いて、このスクリプトを
// 実行する」の2手で済む。
//
// 使い方:
//   node tools/build-machine-pages.js          生成して書き込む
//   node tools/build-machine-pages.js --check  生成物とファイルの差分を報告するだけ（書き込まない）
//
// 機種の一覧は assets/js/data/machines/*.js を実際に読み込んで取得するので、
// このスクリプト側に機種名を書き足す必要はない。
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const MACHINE_DATA_DIR = path.join(ROOT, "assets", "js", "data", "machines");
const TEMPLATE_PATH = path.join(__dirname, "machine-page.template.html");
const TOP_PAGE_PATH = path.join(ROOT, "index.html");
const TOP_MARKER_START = "<!-- machines:start -->";
const TOP_MARKER_END = "<!-- machines:end -->";

// 機種データファイルはブラウザ用に書かれている（windowとPachiSim.machineRegistryが
// 前提）。同じ形の入れ物を用意して、そのまま読み込ませる。
function loadSite() {
  const context = {};
  context.window = context; // ブラウザと同じく window.X が素の X として見えるようにする
  context.console = console;
  vm.createContext(context);

  const run = (filePath) => vm.runInContext(fs.readFileSync(filePath, "utf8"), context, {
    filename: filePath,
  });

  run(path.join(ROOT, "assets", "js", "core", "config.js"));

  const machines = [];
  context.PachiSim.machineRegistry = {
    register(machine) {
      machines.push(machine);
      return machine;
    },
  };

  fs.readdirSync(MACHINE_DATA_DIR)
    .filter((f) => f.endsWith(".js"))
    .sort()
    .forEach((f) => run(path.join(MACHINE_DATA_DIR, f)));

  return { machines, siteTitle: context.PachiSim.config.siteTitle };
}

// meta descriptionは、その機種の「通常以外の状態」の名前から組み立てる。
// 機種データ側にpageDescriptionがあればそちらを優先する。
function describeMachine(machine) {
  if (machine.pageDescription) return machine.pageDescription;
  const stageLabels = Object.keys(machine.states)
    .filter((id) => !machine.states[id].isBaseState)
    .map((id) => machine.states[id].label);
  return `${machine.name}のスペックをもとに、初当たり・${stageLabels.join(
    "・"
  )}をボタン操作で疑似体験できます。`;
}

function renderPage(template, machine, siteTitle) {
  return template
    .split("{{SLUG}}").join(machine.slug)
    .split("{{NAME}}").join(machine.name)
    .split("{{MAKER}}").join(machine.manufacturer.name)
    .split("{{SITE_TITLE}}").join(siteTitle)
    .split("{{DESCRIPTION}}").join(describeMachine(machine));
}

function renderTopPage(currentHtml, machines) {
  const startIdx = currentHtml.indexOf(TOP_MARKER_START);
  const endIdx = currentHtml.indexOf(TOP_MARKER_END);
  if (startIdx < 0 || endIdx < 0) {
    throw new Error(
      `index.html に ${TOP_MARKER_START} / ${TOP_MARKER_END} が見つかりません。` +
        "機種データの読み込み行をこのコメントで囲んでください。"
    );
  }
  const indent = "  ";
  const lines = machines.map(
    (m) => `${indent}<script src="assets/js/data/machines/${m.slug}.js"></script>`
  );
  return (
    currentHtml.slice(0, startIdx + TOP_MARKER_START.length) +
    "\n" +
    lines.join("\n") +
    "\n" +
    indent +
    currentHtml.slice(endIdx)
  );
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const { machines, siteTitle } = loadSite();
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");

  const outputs = machines.map((machine) => ({
    label: machine.name,
    filePath: path.join(ROOT, "machines", machine.slug, "index.html"),
    content: renderPage(template, machine, siteTitle),
  }));

  const topHtml = fs.readFileSync(TOP_PAGE_PATH, "utf8");
  outputs.push({
    label: "TOP（機種データの読み込み行）",
    filePath: TOP_PAGE_PATH,
    content: renderTopPage(topHtml, machines),
  });

  let changed = 0;
  outputs.forEach((out) => {
    const exists = fs.existsSync(out.filePath);
    const current = exists ? fs.readFileSync(out.filePath, "utf8") : null;
    if (current === out.content) {
      console.log(`  そのまま: ${path.relative(ROOT, out.filePath)}`);
      return;
    }
    changed += 1;
    const verb = exists ? "更新" : "新規";
    if (checkOnly) {
      console.log(`  差分あり(${verb}): ${path.relative(ROOT, out.filePath)}  [${out.label}]`);
      return;
    }
    fs.mkdirSync(path.dirname(out.filePath), { recursive: true });
    fs.writeFileSync(out.filePath, out.content);
    console.log(`  ${verb}: ${path.relative(ROOT, out.filePath)}  [${out.label}]`);
  });

  console.log(`\n機種 ${machines.length} 件 / 変更 ${changed} 件`);
  if (checkOnly && changed > 0) {
    console.log("生成物がファイルと食い違っています。node tools/build-machine-pages.js を実行してください。");
    process.exit(1);
  }
}

main();
