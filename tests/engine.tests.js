// core/stateEngine.js・streakTracker.js・kana.js・format.js のテスト。
// RNGを注入できる設計になっているため、固定値のシナリオを再現して検証する。
(function () {
  const { test, assertEqual, assertTrue } = PachiSimTest;
  const machine = PachiSim.machineRegistry.getBySlug("cr-fever-symphogear");
  const machine2 = PachiSim.machineRegistry.getBySlug("eva17-hajimari");

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
})();
