// core/stateEngine.js・streakTracker.js・kana.js・format.js のテスト。
// RNGを注入できる設計になっているため、固定値のシナリオを再現して検証する。
(function () {
  const { test, assertEqual, assertTrue } = PachiSimTest;
  const machine = PachiSim.machineRegistry.getBySlug("cr-fever-symphogear");
  const machine2 = PachiSim.machineRegistry.getBySlug("eva17-hajimari");
  const machine3 = PachiSim.machineRegistry.getBySlug("e-kyokousuiri");

  test("machine data: シンフォギアが登録されている", () => {
    assertTrue(!!machine, "machine not registered");
  });

  test("reelOmens: 大当たり・最大R時は7を含む候補から選ばれる", () => {
    const r = PachiSim.reelOmens.decide(true, false, 15, 15, PachiSim.rng.createScriptedRng([0.65]));
    assertEqual(r.reach, true);
    assertEqual(r.match, true);
    assertEqual(r.leftDigit, 7);
    assertEqual(r.rightDigit, 7);
    assertEqual(r.finalMiddleDigit, 7);
    assertEqual(r.middleSequence.join(","), "4,5,6,7");
  });

  test("reelOmens: 大当たりでも最大R未満なら7は出ない", () => {
    for (let i = 0; i < 50; i++) {
      const r = PachiSim.reelOmens.decide(true, false, 4, 15, PachiSim.rng.createSeededRng(i));
      assertTrue(r.leftDigit !== 7, `7 should never appear for non-max-round hit (got ${r.leftDigit})`);
    }
  });

  test("reelOmens: 色保留のハズレは必ず特殊リーチ（一致しない）になる", () => {
    const r = PachiSim.reelOmens.decide(false, true, null, 15, PachiSim.rng.createScriptedRng([0.05]));
    assertEqual(r.reach, true);
    assertEqual(r.match, false);
    assertEqual(r.leftDigit, 1);
    assertEqual(r.rightDigit, 1);
    assertEqual(r.finalMiddleDigit, 2);
    assertEqual(r.middleSequence.join(","), "7,8,9,2");
  });

  test("reelOmens: 特殊リーチの着地数字は絶対に7にならない", () => {
    for (let i = 0; i < 50; i++) {
      const r = PachiSim.reelOmens.decide(false, true, null, 15, PachiSim.rng.createSeededRng(i));
      assertTrue(r.finalMiddleDigit !== 7, `miss reach should never land on 7 (got ${r.finalMiddleDigit})`);
      assertTrue(r.leftDigit !== 7, "miss reach digit should never be 7");
    }
  });

  test("reelOmens: 色なしハズレは通常3%未満でしか特殊リーチにならない", () => {
    const forced = PachiSim.reelOmens.decide(false, false, null, 15, PachiSim.rng.createScriptedRng([0.01, 0.1]));
    assertEqual(forced.reach, true);

    const notForced = PachiSim.reelOmens.decide(
      false,
      false,
      null,
      15,
      PachiSim.rng.createScriptedRng([0.5, 0.1, 0.9, 0.4])
    );
    assertEqual(notForced.reach, false);
    assertEqual(notForced.leftDigit, 1);
    assertEqual(notForced.rightDigit, 9);
    assertEqual(notForced.middleDigit, 4);
  });

  test("reelOmens: 基本のハズレは左右が必ず異なり、7は出ない", () => {
    for (let i = 0; i < 100; i++) {
      const r = PachiSim.reelOmens.decide(false, false, null, 15, PachiSim.rng.createSeededRng(i * 7 + 1000));
      if (!r.reach) {
        assertTrue(r.leftDigit !== r.rightDigit, "basic miss must not have left === right");
        assertTrue(r.leftDigit !== 7 && r.rightDigit !== 7 && r.middleDigit !== 7, "7 must not appear in basic miss");
      }
    }
  });

  test("holdOmens: 当たり保留は色推移パターンを万分率で選ぶ", () => {
    // 1つ目のパターン(赤そのまま, 累積0〜1000/10000)
    const p1 = PachiSim.holdOmens.pickPattern(true, () => 0.05);
    assertEqual(p1[4], "red");
    assertEqual(p1.big, "red");
    // 6つ目のパターン(緑そのまま, 累積5000〜6000/10000)
    const p6 = PachiSim.holdOmens.pickPattern(true, () => 0.55);
    assertEqual(p6[4], "green");
    assertEqual(p6.big, "green");
    // 5つ目のパターン(青→緑→赤, 累積4000〜5000/10000)
    const p5 = PachiSim.holdOmens.pickPattern(true, () => 0.45);
    assertEqual(p5[4], "blue");
    assertEqual(p5[2], "green");
    assertEqual(p5.big, "red");
    // 最後のパターン(無色そのまま, 累積9500〜10000/10000)
    const pLast = PachiSim.holdOmens.pickPattern(true, () => 0.999);
    assertEqual(pLast[4], null);
    assertEqual(pLast.big, null);
  });

  test("holdOmens: ハズレ保留は色推移パターンを万分率で選ぶ（赤は出ない）", () => {
    // 1つ目のパターン(緑そのまま, 累積0〜400/10000)
    const p1 = PachiSim.holdOmens.pickPattern(false, () => 0.01);
    assertEqual(p1[4], "green");
    assertEqual(p1.big, "green");
    // 5つ目のパターン(無→無→青→緑→緑, 累積900〜1000/10000)
    const p5 = PachiSim.holdOmens.pickPattern(false, () => 0.095);
    assertEqual(p5[4], null);
    assertEqual(p5[2], "blue");
    assertEqual(p5.big, "green");
    // 最後のパターン(無色そのまま, 累積1000〜10000/10000, 全体の90%)
    const pLast = PachiSim.holdOmens.pickPattern(false, () => 0.99);
    assertEqual(pLast[4], null);
    assertEqual(pLast.big, null);
    // ハズレ側にはどのパターンにも赤は出現しない（赤=当たり確定を守るため）
    for (let i = 0; i < 50; i++) {
      const p = PachiSim.holdOmens.pickPattern(false, PachiSim.rng.createSeededRng(i));
      ["4", "3", "2", "1", "big"].forEach((k) => {
        assertTrue(p[k] !== "red", `miss pattern must never contain red (key=${k})`);
      });
    }
  });

  test("holdOmens: 途中から色が付くパターンも『色保留』として判定される", () => {
    // 最初から最後まで無色のパターンだけがfalse
    assertEqual(PachiSim.holdOmens.isColoredPattern(null), false);
    assertEqual(
      PachiSim.holdOmens.isColoredPattern({ 4: null, 3: null, 2: null, 1: null, big: null }),
      false
    );
    // 保留2の位置から赤くなるパターン（出現時点では無色）も色保留として扱う。
    // ここをfalseにしてしまうと、後から色が付いて画面に色保留が2つ並ぶ。
    assertEqual(
      PachiSim.holdOmens.isColoredPattern({ 4: null, 3: null, 2: "red", 1: "red", big: "red" }),
      true
    );
    assertEqual(
      PachiSim.holdOmens.isColoredPattern({ 4: "blue", 3: "blue", 2: "green", 1: "red", big: "red" }),
      true
    );
    // 大台でだけ色が付く場合も拾えること
    assertEqual(
      PachiSim.holdOmens.isColoredPattern({ 4: null, 3: null, 2: null, 1: null, big: "green" }),
      true
    );
  });

  test("holdOmens: pickPatternの戻り値はisColoredPatternで判定できる形になっている", () => {
    // 無色固定のパターン（ハズレ側の重み9000）と、色付きパターンの両方を実際に引く
    const miss = PachiSim.holdOmens.pickPattern(false, () => 0.99);
    assertEqual(PachiSim.holdOmens.isColoredPattern(miss), false);
    const colored = PachiSim.holdOmens.pickPattern(false, () => 0.01);
    assertEqual(PachiSim.holdOmens.isColoredPattern(colored), true);
  });

  test("engine: 通常時ハズレ→ハズレ→当たり(99%側 4R→最終決戦)", () => {
    const session = PachiSim.engine.createSession(machine);
    const rng = PachiSim.rng.createScriptedRng([0.5, 0.5, 0.001, 0.1]);
    const result = PachiSim.engine.resolveAction(session, machine, rng);
    assertEqual(result.outcome.type, "hit");
    assertEqual(result.outcome.attempts, 3);
    assertEqual(result.outcome.rounds, 4);
    assertEqual(result.outcome.balls, 364);
    assertEqual(result.outcome.nextStateId, "finalBattle");
  });

  test("engine: 通常時1発目で当たり(1%側 15R→シンフォギアチャンス直行)", () => {
    const session = PachiSim.engine.createSession(machine);
    const rng = PachiSim.rng.createScriptedRng([0.001, 0.995]);
    const result = PachiSim.engine.resolveAction(session, machine, rng);
    assertEqual(result.outcome.rounds, 15);
    assertEqual(result.outcome.balls, 1365);
    assertEqual(result.outcome.nextStateId, "symphogearChance");
    assertEqual(result.outcome.resultNote, "RUSH直行");
  });

  test("engine: 最終決戦 3回目で当選(8R)→シンフォギアチャンスへ", () => {
    const session = { stateId: "finalBattle", remaining: 5, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.5, 0.5, 0.01, 0.55]);
    const result = PachiSim.engine.resolveAction(session, machine, rng);
    assertEqual(result.outcome.attempts, 3);
    assertEqual(result.outcome.rounds, 8);
    assertEqual(result.outcome.balls, 728);
    assertEqual(result.outcome.nextStateId, "symphogearChance");
  });

  test("engine: 最終決戦5回すべてハズレ→最終決戦敗北→通常", () => {
    const session = { stateId: "finalBattle", remaining: 5, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.9, 0.9, 0.9, 0.9, 0.9]);
    const result = PachiSim.engine.resolveAction(session, machine, rng);
    assertEqual(result.outcome.type, "exhausted");
    assertEqual(result.outcome.attempts, 5);
    assertEqual(result.outcome.nextStateId, "normal");
    assertEqual(result.outcome.resultLabel, "最終決戦敗北");
  });

  test("engine: シンフォギアチャンス 2回目で当選(4R)→残り11回にリセットして継続", () => {
    const session = { stateId: "symphogearChance", remaining: 11, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.9, 0.01, 0.2]);
    const result = PachiSim.engine.resolveAction(session, machine, rng);
    assertEqual(result.outcome.attempts, 2);
    assertEqual(result.outcome.rounds, 4);
    assertEqual(result.newSession.stateId, "symphogearChance");
    assertEqual(result.newSession.remaining, 11);
  });

  test("engine: シンフォギアチャンス11回すべてハズレ→終了→通常", () => {
    const session = { stateId: "symphogearChance", remaining: 11, streak: null };
    const rng = PachiSim.rng.createScriptedRng(new Array(11).fill(0.9));
    const result = PachiSim.engine.resolveAction(session, machine, rng);
    assertEqual(result.outcome.type, "exhausted");
    assertEqual(result.outcome.attempts, 11);
    assertEqual(result.outcome.resultLabel, "シンフォギアチャンス終了");
  });

  test("streakTracker: 4R→8R→15R→4R→終了 で一撃2821玉・4連（仕様書の例と一致）", () => {
    const normal = machine.states.normal;
    const finalBattle = machine.states.finalBattle;
    const symphogearChance = machine.states.symphogearChance;

    let streak = null;
    let r = PachiSim.streakTracker.applyResult(streak, normal, finalBattle, {
      type: "hit",
      rounds: 4,
      balls: 364,
    });
    streak = r.streak;
    r = PachiSim.streakTracker.applyResult(streak, finalBattle, symphogearChance, {
      type: "hit",
      rounds: 8,
      balls: 728,
    });
    streak = r.streak;
    r = PachiSim.streakTracker.applyResult(streak, symphogearChance, symphogearChance, {
      type: "hit",
      rounds: 15,
      balls: 1365,
    });
    streak = r.streak;
    r = PachiSim.streakTracker.applyResult(streak, symphogearChance, symphogearChance, {
      type: "hit",
      rounds: 4,
      balls: 364,
    });
    streak = r.streak;
    r = PachiSim.streakTracker.applyResult(streak, symphogearChance, normal, { type: "exhausted" });

    assertTrue(r.finished, "streak should finish when returning to base state");
    assertEqual(r.finishedStreak.totalBalls, 2821);
    assertEqual(PachiSim.streakTracker.renchanCount(r.finishedStreak), 4);
  });

  test("streakTracker: 初当たりのみで終了は単発(1連)", () => {
    const normal = machine.states.normal;
    const finalBattle = machine.states.finalBattle;

    let streak = null;
    let r = PachiSim.streakTracker.applyResult(streak, normal, finalBattle, {
      type: "hit",
      rounds: 4,
      balls: 364,
    });
    streak = r.streak;
    r = PachiSim.streakTracker.applyResult(streak, finalBattle, normal, { type: "exhausted" });

    assertTrue(r.finished);
    assertEqual(PachiSim.streakTracker.renchanCount(r.finishedStreak), 1);
  });

  test("streakTracker: applyResultは渡されたstreakを書き換えない（不変性の回帰テスト）", () => {
    const normal = machine.states.normal;
    const finalBattle = machine.states.finalBattle;
    const symphogearChance = machine.states.symphogearChance;

    let streak = null;
    let r = PachiSim.streakTracker.applyResult(streak, normal, finalBattle, {
      type: "hit",
      rounds: 4,
      balls: 364,
    });
    const streakAfterFirstHit = r.streak;
    const wasRushEntered = !!(streakAfterFirstHit && streakAfterFirstHit.rushEntered);

    // symphogearChance(isRushEntry:true)へ遷移する2件目を処理しても、
    // 直前に取得した参照(streakAfterFirstHit)の中身が後から変わってはいけない
    r = PachiSim.streakTracker.applyResult(streakAfterFirstHit, finalBattle, symphogearChance, {
      type: "hit",
      rounds: 8,
      balls: 728,
    });

    assertEqual(streakAfterFirstHit.rushEntered, false, "古い参照が書き換わっている(ミューテーションのバグ)");
    assertEqual(wasRushEntered, false);
    assertTrue(r.streak.rushEntered, "新しいstreakにはrushEnteredが反映されているべき");
  });

  test("kana: ひらがな入力「しんふぉ」で機種名がヒットする", () => {
    assertTrue(PachiSim.kana.includesNormalized(machine.name, "しんふぉ"));
  });

  test("kana: エイリアス「初代シンフォギア」がヒットする", () => {
    assertTrue(machine.aliases.some((a) => PachiSim.kana.includesNormalized(a, "初代")));
  });

  test("kana: 無関係な語ではヒットしない", () => {
    assertTrue(!PachiSim.kana.includesNormalized(machine.name, "まったくちがうご"));
  });

  test("format: 287回転→投資目安は1,000円単位切り上げで18,000円", () => {
    const raw = (287 / machine.spinsPer1000Yen) * 1000;
    assertEqual(PachiSim.format.roundUpTo(raw, 1000), 18000);
  });

  test("rng: weightedPickは重みの合計内で決定的に選ぶ", () => {
    const outcomes = [{ weight: 0.99, id: "a" }, { weight: 0.01, id: "b" }];
    const pickA = PachiSim.rng.weightedPick(PachiSim.rng.createScriptedRng([0.1]), outcomes);
    const pickB = PachiSim.rng.weightedPick(PachiSim.rng.createScriptedRng([0.995]), outcomes);
    assertEqual(pickA.id, "a");
    assertEqual(pickB.id, "b");
  });

  // 2号機目（エヴァ17）: 新機種を「データ追加のみ」で作れるかの実証。
  // 併せて、同じラウンド数でも出玉が異なるケース(10R=2400 or 4800)を
  // 表現するためのonHit.outcomes[].balls上書き機能もここで検証する。
  test("machine data: エヴァ17が登録されている", () => {
    assertTrue(!!machine2, "machine2 not registered");
  });

  test("engine(エヴァ17): 通常時ハズレ→当たり(2R→時短、昇格演出失敗パターン)", () => {
    const session = PachiSim.engine.createSession(machine2);
    const rng = PachiSim.rng.createScriptedRng([0.9, 0.001, 0.9]);
    const result = PachiSim.engine.resolveAction(session, machine2, rng);
    assertEqual(result.outcome.type, "hit");
    assertEqual(result.outcome.attempts, 2);
    assertEqual(result.outcome.rounds, 2);
    assertEqual(result.outcome.balls, 300);
    assertEqual(result.outcome.nextStateId, "chanceTime");
    assertEqual(result.outcome.tag, "toChanceTime");
  });

  test("engine(エヴァ17): 通常1発目で全回転(10R・1500個)→ST直行", () => {
    const session = PachiSim.engine.createSession(machine2);
    const rng = PachiSim.rng.createScriptedRng([0.001, 0.999]);
    const result = PachiSim.engine.resolveAction(session, machine2, rng);
    assertEqual(result.outcome.rounds, 10);
    assertEqual(result.outcome.balls, 1500);
    assertEqual(result.outcome.nextStateId, "st");
    assertEqual(result.outcome.tag, "toStDirectMega");
  });

  test("engine(エヴァ17): ST中LT成立(8R・4800個)→ST継続。同じ8Rでも出玉が上書きされる", () => {
    const session = { stateId: "st", remaining: 157, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.001, 0.999]);
    const result = PachiSim.engine.resolveAction(session, machine2, rng);
    assertEqual(result.outcome.rounds, 8);
    assertEqual(result.outcome.balls, 4800, "payoutTable[8]=2400ではなく、outcome側のballs上書きが使われるべき");
    assertEqual(result.outcome.nextStateId, "st");
    assertEqual(result.outcome.tag, "ltEntry");
    assertEqual(result.newSession.stateId, "st");
  });

  test("engine(エヴァ17): ST157回すべてハズレ→通常へ", () => {
    const session = { stateId: "st", remaining: 157, streak: null };
    const rng = PachiSim.rng.createScriptedRng(new Array(157).fill(0.9));
    const result = PachiSim.engine.resolveAction(session, machine2, rng);
    assertEqual(result.outcome.type, "exhausted");
    assertEqual(result.outcome.attempts, 157);
    assertEqual(result.outcome.nextStateId, "normal");
    assertEqual(result.outcome.resultLabel, "ST終了");
  });

  test("engine(エヴァ17): 時短100回すべてハズレ→通常へ", () => {
    const session = { stateId: "chanceTime", remaining: 100, streak: null };
    const rng = PachiSim.rng.createScriptedRng(new Array(100).fill(0.9));
    const result = PachiSim.engine.resolveAction(session, machine2, rng);
    assertEqual(result.outcome.type, "exhausted");
    assertEqual(result.outcome.attempts, 100);
    assertEqual(result.outcome.nextStateId, "normal");
    assertEqual(result.outcome.resultLabel, "時短終了");
  });

  // 3号機目（e虚構推理）: stateEngine.jsに新設したstockMode（固定回数を持たず、
  // 当たるたびに増減する「お願い玉」のような可変ストックを消化するcountDown状態）と
  // onHit.stockOutcomes（残りストック数によって当たり時の振り分け表そのものが
  // 変わる仕組み）の検証。
  test("machine data: e虚構推理が登録されている", () => {
    assertTrue(!!machine3, "machine3 not registered");
  });

  test("engine(虚構推理): 通常1発目で当たり(50.5%側)→鋼人攻略戦へ", () => {
    const session = PachiSim.engine.createSession(machine3);
    const rng = PachiSim.rng.createScriptedRng([0.001, 0.001]);
    const result = PachiSim.engine.resolveAction(session, machine3, rng);
    assertEqual(result.outcome.type, "hit");
    assertEqual(result.outcome.rounds, 2);
    assertEqual(result.outcome.balls, 300);
    assertEqual(result.outcome.nextStateId, "koujin");
  });

  test("engine(虚構推理): 鋼人攻略戦で当たり(50%側)→琴子のご褒美RUSHへ。stockSetで初期ストック4個", () => {
    const session = { stateId: "koujin", stock: null, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.001, 0.999]);
    const result = PachiSim.engine.resolveAction(session, machine3, rng);
    assertEqual(result.outcome.rounds, 10);
    assertEqual(result.outcome.balls, 1500);
    assertEqual(result.outcome.nextStateId, "kotokoRush");
    assertEqual(result.newSession.stock, 4, "stockSet:4なので持ち越し計算をせず4になるべき");
  });

  // 虚構推理のkotokoRush/uraGohobiRushはjudgmentGateつき。1回転ごとに
  // [ゲート抽選, (ゲートが開いた場合のみ)当落抽選, (当たった場合のみ)weightedPick]の順で
  // rngを消費する。以下のテストはすべて「ゲートは毎回必ず開く」(rng=0.001)前提で書き、
  // ゲート自体の抽選ロジックの検証は別テストで行う。

  test("engine(虚構推理): 琴子のご褒美RUSH・残り2個以下は100%継続。持ち越し+4個で加算される", () => {
    // stock=2で1発目に当選 → 消化前の残りストックは2（≤2バケット）。
    // 当たり自体で1個消費するので、当選前時点の残り(2-0=2)がバケット判定に使われる。
    const session = { stateId: "kotokoRush", stock: 2, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.001 /* gate */, 0.001 /* hit */, 0.5 /* pick */]);
    const result = PachiSim.engine.resolveAction(session, machine3, rng);
    assertEqual(result.outcome.rounds, 10);
    assertEqual(result.outcome.balls, 1500);
    assertEqual(result.outcome.nextStateId, "kotokoRush");
    assertEqual(
      result.newSession.stock,
      6,
      "持ち越し(2、当たり自体は消費しない)+付与4個=6になるべき（stockAdd:4）"
    );
  });

  test("engine(虚構推理): 琴子のご褒美RUSH・残り3個以上は82%で継続（3000個・ストック4個固定）", () => {
    const session = { stateId: "kotokoRush", stock: 5, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.001 /* gate */, 0.001 /* hit */, 0.001 /* 82%側 */]);
    const result = PachiSim.engine.resolveAction(session, machine3, rng);
    assertEqual(result.outcome.balls, 3000);
    assertEqual(result.outcome.nextStateId, "kotokoRush");
    assertEqual(result.newSession.stock, 4, "stockSet:4なので持ち越しは関係なく4固定になるべき");
  });

  test("engine(虚構推理): 琴子のご褒美RUSH・残り3個以上の18%はVストック化し裏ご褒美RUSHへ。持ち越しは無視されstockSetの4個になる", () => {
    const session = { stateId: "kotokoRush", stock: 7, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.001 /* gate */, 0.001 /* hit */, 0.999 /* 18%側 */]);
    const result = PachiSim.engine.resolveAction(session, machine3, rng);
    assertEqual(result.outcome.nextStateId, "uraGohobiRush");
    assertEqual(result.outcome.resultNote, "Vストック");
    assertEqual(
      result.newSession.stock,
      4,
      "stockSet:4なので、持ち越し分(7)は使わずちょうど4になるべき"
    );
  });

  test("engine(虚構推理): 琴子のご褒美RUSHは、ゲートが開くたびにハズレるとお願い玉が1個ずつ減り、0個で終了し通常へ", () => {
    const session = { stateId: "kotokoRush", stock: 4, streak: null };
    // [ゲート開, ハズレ] を4セット（4個消費）
    const rng = PachiSim.rng.createScriptedRng(new Array(8).fill(0).map((_, i) => (i % 2 === 0 ? 0.001 : 0.9)));
    const result = PachiSim.engine.resolveAction(session, machine3, rng);
    assertEqual(result.outcome.type, "exhausted");
    assertEqual(result.outcome.attempts, 4, "ゲートが毎回開く前提なら4回転で0個になるはず");
    assertEqual(result.outcome.nextStateId, "normal");
    assertEqual(result.outcome.resultLabel, "琴子のご褒美RUSH終了");
  });

  test("engine(虚構推理): 琴子のご褒美RUSHは、ゲートが開かない回転はお願い玉を消費しない（素通り）", () => {
    // ゲートが3回連続で開かず（消費なし・remainingStockは4のまま）→
    // 4回目でようやく開いてハズレ（3に減る）→5回目でゲートが開いて当たり、で終わらせる
    // （rngは使い切ると最後の値を繰り返すだけになり無限ループの元になるため、
    // 必ず当たりか消化しきりで終わる長さぴったりのスクリプトにすること）。
    const session = { stateId: "kotokoRush", stock: 4, streak: null };
    const rng = PachiSim.rng.createScriptedRng([
      0.9, // 1回目: ゲート閉（素通り）
      0.9, // 2回目: ゲート閉（素通り）
      0.9, // 3回目: ゲート閉（素通り）
      0.001, // 4回目: ゲート開
      0.9, // 4回目: ハズレ → 残り3
      0.001, // 5回目: ゲート開
      0.001, // 5回目: 当たり
      0.001, // stockOutcomesのweightedPick（残り3なので≥3バケット、82%側を選ぶ）
    ]);
    const result = PachiSim.engine.resolveAction(session, machine3, rng);
    assertEqual(result.rolls.length, 5, "素通り3回+ハズレ1回+当たり1回=5回転");
    assertEqual(result.rolls[0].remainingStock, 4, "1回目は素通りなので4のまま");
    assertEqual(result.rolls[1].remainingStock, 4, "2回目も素通りなので4のまま");
    assertEqual(result.rolls[2].remainingStock, 4, "3回目も素通りなので4のまま");
    assertEqual(result.rolls[3].remainingStock, 3, "4回目でゲートが開きハズレたので3に減る");
    assertEqual(result.outcome.type, "hit");
    assertEqual(result.newSession.stock, 4, "stockSet:4なので持ち越しは関係なく4固定になるべき");
  });

  test("engine(虚構推理): 裏モードで当たり(87%側)→裏ご褒美RUSHへ。stockSetで初期ストック4個", () => {
    const session = { stateId: "uraMode", stock: null, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.001, 0.001]);
    const result = PachiSim.engine.resolveAction(session, machine3, rng);
    assertEqual(result.outcome.balls, 3000);
    assertEqual(result.outcome.nextStateId, "uraGohobiRush");
    assertEqual(result.newSession.stock, 4);
  });

  test("engine(虚構推理): 裏ご褒美RUSHは継続時もストック4個固定（持ち越し無し）", () => {
    const session = { stateId: "uraGohobiRush", stock: 6, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.001 /* gate */, 0.001 /* hit */, 0.001 /* 87%側 */]);
    const result = PachiSim.engine.resolveAction(session, machine3, rng);
    assertEqual(result.outcome.balls, 3000);
    assertEqual(result.outcome.nextStateId, "uraGohobiRush");
    assertEqual(result.newSession.stock, 4, "stockSet:4なので持ち越しは関係なく4固定になるべき");
  });

  test("engine(虚構推理): 裏ご褒美RUSHの13%側は、成功する限り+1500個を繰り返し上乗せする", () => {
    const session = { stateId: "uraGohobiRush", stock: 4, streak: null };
    const rng = PachiSim.rng.createScriptedRng([
      0.001, // gate開
      0.001, // 当たり
      0.999, // weightedPick→13%側（4500個）
      0.001, // bonusLoop 1回目: 成功 → +1500
      0.001, // bonusLoop 2回目: 成功 → +1500
      0.999, // bonusLoop 3回目: 失敗 → ここで打ち止め
    ]);
    const result = PachiSim.engine.resolveAction(session, machine3, rng);
    assertEqual(result.outcome.balls, 4500 + 1500 + 1500, "4500に2回分の上乗せで7500になるべき");
    assertEqual(result.newSession.stock, 4);
  });

  test("engine(虚構推理): 裏ご褒美RUSHは、ゲートが開くたびにハズレるとお願い玉が1個ずつ減り、0個で終了し通常へ", () => {
    const session = { stateId: "uraGohobiRush", stock: 3, streak: null };
    const rng = PachiSim.rng.createScriptedRng(new Array(6).fill(0).map((_, i) => (i % 2 === 0 ? 0.001 : 0.9)));
    const result = PachiSim.engine.resolveAction(session, machine3, rng);
    assertEqual(result.outcome.type, "exhausted");
    assertEqual(result.outcome.attempts, 3);
    assertEqual(result.outcome.nextStateId, "normal");
    assertEqual(result.outcome.resultLabel, "裏ご褒美RUSH終了");
  });
})();

// 転落抽選型（onFall）のテスト。
// 「規定回数で終わる」のではなく「転落を引いた時点で終わる」RUSHを表現できるか。
// ユニコーンのように、RUSHが次の大当たりか転落小当りを引くまでループする機種で使う。
(function () {
  const { test, assertEqual, assertTrue } = PachiSimTest;

  // 大当たり1/2・転落1/4の、検証しやすい作りの機種を組み立てる。
  // rngは1回転につき「大当たり判定→（外れたら）転落判定」の順に消費される。
  const fallMachine = {
    id: "t", slug: "t", name: "転落テスト機", nameKana: "てすと", aliases: [],
    manufacturer: { id: "m", name: "テスト" },
    spinsPer1000Yen: 18, baseStateId: "normal", rules: ["テスト"],
    payoutTable: { 10: 1500 },
    states: {
      normal: {
        id: "normal", label: "通常", mode: "countUp", maxAttempts: null,
        probability: 1 / 2, actionLabel: "START", theme: "normal",
        accruesInvestment: true, isBaseState: true, isRushEntry: false,
        onHit: { outcomes: [{ weight: 1, rounds: 10, nextState: "rush", tag: "toRush" }] },
        onExhausted: null,
      },
      rush: {
        id: "rush", label: "RUSH", mode: "countUp", maxAttempts: null,
        probability: 1 / 2, actionLabel: "START", theme: "rush",
        accruesInvestment: false, isBaseState: false, isRushEntry: true,
        onHit: { outcomes: [{ weight: 1, rounds: 10, nextState: "rush", tag: "loop" }] },
        onExhausted: null,
        onFall: { probability: 1 / 4, nextState: "normal", tag: "fell", resultLabel: "転落" },
      },
    },
  };

  test("engine(転落): 転落を引くとRUSHが終わり通常へ戻る", () => {
    // 1回転目: 大当たり外れ(0.9) → 転落抽選 当たり(0.1) で終了
    const session = { stateId: "rush", remaining: null, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.9, 0.1]);
    const r = PachiSim.engine.resolveAction(session, fallMachine, rng);
    assertEqual(r.outcome.type, "exhausted", "転落は「当たらずに終わった」扱いにする");
    assertEqual(r.outcome.viaFall, true);
    assertEqual(r.outcome.attempts, 1);
    assertEqual(r.outcome.nextStateId, "normal");
    assertEqual(r.outcome.resultLabel, "転落");
  });

  test("engine(転落): 転落を引かなければRUSHは続く（回数制限が無い）", () => {
    // 3回転ぶん「大当たり外れ・転落も外れ」を並べ、4回転目に大当たり
    const session = { stateId: "rush", remaining: null, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.1, 0.0]);
    const r = PachiSim.engine.resolveAction(session, fallMachine, rng);
    assertEqual(r.outcome.type, "hit");
    assertEqual(r.outcome.attempts, 4, "転落しなければ規定回数で打ち切られない");
    assertEqual(r.outcome.nextStateId, "rush");
    assertEqual(r.outcome.balls, 1500);
  });

  test("engine(転落): 大当たりと転落は同じ回転で同時に成立しない", () => {
    // 大当たり当選(0.1)なら、その回転で転落抽選は行われない。
    // 行われていれば次の0.1を消費して転落扱いになってしまう。
    const session = { stateId: "rush", remaining: null, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.1, 0.1, 0.0]);
    const r = PachiSim.engine.resolveAction(session, fallMachine, rng);
    assertEqual(r.outcome.type, "hit");
    assertEqual(r.outcome.attempts, 1);
    assertTrue(!r.outcome.viaFall, "大当たりなのに転落扱いになっている");
  });

  test("engine(転落): 転落した回転もrollsに残る（演出が最後まで再生できる）", () => {
    const session = { stateId: "rush", remaining: null, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.9, 0.9, 0.9, 0.1]);
    const r = PachiSim.engine.resolveAction(session, fallMachine, rng);
    assertEqual(r.rolls.length, 2);
    assertEqual(r.rolls[0].fell, false);
    assertEqual(r.rolls[1].fell, true);
    assertEqual(r.rolls[1].hit, false);
  });

  test("検証: onFallのnextStateが存在しないと弾かれる", () => {
    const broken = JSON.parse(JSON.stringify(fallMachine));
    broken.states.rush.onFall = { probability: 1 / 4, nextState: "nowhere" };
    const errors = PachiSim.machineValidator.validate(broken);
    assertTrue(
      errors.some((e) => e.indexOf("onFall") >= 0 && e.indexOf("nowhere") >= 0),
      `onFallのnextState未存在が検出されていない: ${errors.join(" / ")}`
    );
  });

  test("検証: onFallのprobabilityが範囲外だと弾かれる", () => {
    const broken = JSON.parse(JSON.stringify(fallMachine));
    broken.states.rush.onFall = { probability: 153.7, nextState: "normal" }; // 1/153.7のつもり
    const errors = PachiSim.machineValidator.validate(broken);
    assertTrue(
      errors.some((e) => e.indexOf("onFall") >= 0 && e.indexOf("probability") >= 0),
      `onFallのprobability範囲外が検出されていない: ${errors.join(" / ")}`
    );
  });

  // 残保留（onFall.residualAttempts）のテスト。転落を引いた瞬間に確定させず、
  // 「既に始動口に入っていた分」として追加でN回だけ当落を見る（転落の再抽選はしない）。
  const fallMachineWithResidual = JSON.parse(JSON.stringify(fallMachine));
  fallMachineWithResidual.states.rush.onFall.residualAttempts = 2;

  test("engine(残保留): 転落を引いても、残保留のどこかで当たれば引き戻されて継続する", () => {
    // 1回転目: 大当たり外れ(0.9)→転落成立(0.1)。残保留1回目でいきなり当たる(0.1)
    const session = { stateId: "rush", remaining: null, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.9, 0.1, 0.1]);
    const r = PachiSim.engine.resolveAction(session, fallMachineWithResidual, rng);
    assertEqual(r.outcome.type, "hit", "残保留で当たったのに転落確定になっている");
    assertEqual(r.outcome.nextStateId, "rush");
    assertEqual(r.outcome.attempts, 2);
    assertEqual(r.rolls.length, 2);
    assertEqual(r.rolls[1].residual, true);
  });

  test("engine(残保留): 残保留も全部外れて、初めて転落が確定する", () => {
    const session = { stateId: "rush", remaining: null, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.9, 0.1, 0.9, 0.9]);
    const r = PachiSim.engine.resolveAction(session, fallMachineWithResidual, rng);
    assertEqual(r.outcome.type, "exhausted");
    assertEqual(r.outcome.viaFall, true);
    assertEqual(r.outcome.nextStateId, "normal");
    assertEqual(r.outcome.attempts, 3, "転落候補1回+残保留2回=3回転");
    assertEqual(r.rolls.length, 3);
    assertEqual(r.rolls[2].fell, true, "残保留の最後で転落確定になるべき");
  });

  test("engine(残保留): residualAttempts省略時は今までどおり即座に転落確定する", () => {
    // fallMachine（residualAttempts無し）で従来どおりの動作を回帰確認
    const session = { stateId: "rush", remaining: null, streak: null };
    const rng = PachiSim.rng.createScriptedRng([0.9, 0.1]);
    const r = PachiSim.engine.resolveAction(session, fallMachine, rng);
    assertEqual(r.outcome.type, "exhausted");
    assertEqual(r.rolls.length, 1);
  });

  test("検証: onFallのresidualAttemptsが正の整数でないと弾かれる", () => {
    const broken = JSON.parse(JSON.stringify(fallMachine));
    broken.states.rush.onFall.residualAttempts = 0;
    const errors = PachiSim.machineValidator.validate(broken);
    assertTrue(
      errors.some((e) => e.indexOf("onFall") >= 0 && e.indexOf("residualAttempts") >= 0),
      `residualAttemptsの不正値が検出されていない: ${errors.join(" / ")}`
    );
  });
})();

// 転落式の演出ルール（リーチを作らない）。
// 転落式のRUSHは超短縮変動で、リーチになった時点で当たりか転落かが決まる。
// 「リーチ中のドキドキ」が存在しないので、リーチ演出そのものを出さない。
(function () {
  const { test, assertEqual, assertTrue } = PachiSimTest;
  const noReach = { noReach: true };

  test("転落式の演出: 大当たりはリーチを挟まずに3つ揃う", () => {
    const r = PachiSim.reelOmens.decide(true, false, 10, 10, PachiSim.rng.createSeededRng(1), noReach);
    assertEqual(r.reach, false, "リーチを作ってはいけない");
    assertEqual(r.match, true, "大当たりなのに揃っていない");
    assertTrue(
      r.leftDigit === r.rightDigit && r.rightDigit === r.middleDigit,
      `3つとも同じ数字でない: ${r.leftDigit}/${r.middleDigit}/${r.rightDigit}`
    );
  });

  test("転落式の演出: ハズレはリーチにならず、左右も揃わない", () => {
    for (let i = 0; i < 50; i++) {
      const r = PachiSim.reelOmens.decide(false, false, null, 10, PachiSim.rng.createSeededRng(i), noReach);
      assertEqual(r.reach, false, `${i}回目にリーチが出た`);
      assertEqual(r.match, false);
      assertTrue(r.leftDigit !== r.rightDigit, `${i}回目に左右が揃った（リーチに見えてしまう）`);
    }
  });

  test("転落式の演出: 色保留でもリーチにならない", () => {
    // 通常は色保留のハズレを必ず特殊リーチにするが、転落式ではそれも作らない
    for (let i = 0; i < 30; i++) {
      const r = PachiSim.reelOmens.decide(false, true, null, 10, PachiSim.rng.createSeededRng(i), noReach);
      assertEqual(r.reach, false, `${i}回目に色保留でリーチが出た`);
    }
  });

  test("演出ルール: 転落式でない状態は今までどおりリーチになる", () => {
    // noReachを渡さない既存の呼び出しが変わっていないことの確認
    const hit = PachiSim.reelOmens.decide(true, false, 10, 10, PachiSim.rng.createSeededRng(1));
    assertEqual(hit.reach, true);
    assertEqual(hit.match, true);
    const colored = PachiSim.reelOmens.decide(false, true, null, 10, PachiSim.rng.createSeededRng(1));
    assertEqual(colored.reach, true, "色保留のハズレは特殊リーチのままであるべき");
    assertEqual(colored.match, false);
  });

  test("転落式の判定: ユニコーンのRUSHだけがonFallを持つ", () => {
    // machine.jsは「その状態がonFallを持つか」で演出を切り替えている。
    // 通常時は普通の1/319.7のゲームなので、リーチも色保留もそのまま出す。
    const uc = PachiSim.machineRegistry.getBySlug("pf-gundam-uc");
    assertTrue(!!uc, "ユニコーンが登録されていない");
    assertTrue(!uc.states.normal.onFall, "通常時にonFallが付いている");
    assertTrue(!!uc.states.rush.onFall, "RUSHにonFallが無い");
  });
})();
