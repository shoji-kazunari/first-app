// 機種データの検証。
//
// 前半: 登録済みの「全機種」を横断して検査する。機種が増えてもテストを書き足す
//       必要はなく、data/machines/ にファイルを1つ増やして読み込めば自動で対象になる。
// 後半: 検証ロジック(machineValidator)そのものが、壊れたデータをちゃんと弾くか。
//       ここが緩いと、前半が全部通っても意味がなくなる。
(function () {
  const { test, assertEqual, assertTrue } = PachiSimTest;
  const machines = PachiSim.machineRegistry.getAll();

  // 検証で使う「正しい機種データ」の雛形。壊し方を1箇所ずつ変えて弾かれるか試す。
  function validMachine(overrides) {
    return Object.assign(
      {
        id: "test-machine",
        slug: "test-machine",
        name: "テスト機種",
        nameKana: "てすときしゅ",
        aliases: ["テスト"],
        manufacturer: { id: "test-maker", name: "テストメーカー" },
        spinsPer1000Yen: 16,
        baseStateId: "normal",
        rules: ["テスト用"],
        states: {
          normal: {
            id: "normal",
            label: "通常",
            mode: "countUp",
            maxAttempts: null,
            probability: 1 / 199.8,
            actionLabel: "START",
            theme: "normal",
            accruesInvestment: true,
            isBaseState: true,
            isRushEntry: false,
            onHit: { outcomes: [{ weight: 1, rounds: 4, nextState: "rush", tag: "toRush" }] },
            onExhausted: null,
          },
          rush: {
            id: "rush",
            label: "RUSH",
            mode: "countDown",
            maxAttempts: 10,
            probability: 1 / 7.4,
            actionLabel: "START",
            theme: "rush",
            accruesInvestment: false,
            isBaseState: false,
            isRushEntry: true,
            onHit: { outcomes: [{ weight: 1, rounds: 4, nextState: "rush", tag: "rushContinue" }] },
            onExhausted: { nextState: "normal", tag: "rushEnd", resultLabel: "RUSH終了" },
          },
        },
        distributionTables: {},
        payoutTable: { 4: 364 },
      },
      overrides || {}
    );
  }

  // 雛形のstatesを1箇所だけ書き換えたコピーを作る
  function withState(stateId, patch) {
    const m = validMachine();
    m.states[stateId] = Object.assign({}, m.states[stateId], patch);
    return m;
  }

  function errorsFor(machine) {
    return PachiSim.machineValidator.validate(machine);
  }

  // ---- 全機種を横断して検査 ----

  test("machines: 機種が1つ以上登録されている", () => {
    assertTrue(machines.length > 0, "機種が1つも登録されていない");
  });

  test("machines: 登録済みの全機種が検証を通る", () => {
    machines.forEach((m) => {
      const errors = errorsFor(m);
      assertEqual(errors.length, 0, `${m.slug}: ${errors.join(" / ")}`);
    });
  });

  test("machines: slugが重複していない", () => {
    const seen = {};
    machines.forEach((m) => {
      assertTrue(!seen[m.slug], `slugが重複している: ${m.slug}`);
      seen[m.slug] = true;
    });
  });

  test("machines: 全機種のどの状態からでも抽選が解決できる", () => {
    // 状態ごとにエンジンを回し、当たり／消化しきりのどちらでも
    // 例外を出さずにoutcomeと次の状態が決まることを確かめる。
    // stockMode状態は固定のmaxAttemptsを持たないので、テスト用に適当な正のストック数
    // （STOCK_FOR_TEST）をここで補って渡す。
    const STOCK_FOR_TEST = 4;
    machines.forEach((m) => {
      Object.keys(m.states).forEach((stateId) => {
        const state = m.states[stateId];
        const cap = state.stockMode ? STOCK_FOR_TEST : state.maxAttempts;
        const session = {
          stateId,
          remaining: state.maxAttempts,
          stock: state.stockMode ? STOCK_FOR_TEST : null,
          streak: null,
        };

        // 必ず1回転目で当たる乱数
        const hit = PachiSim.engine.resolveAction(session, m, () => 0);
        assertEqual(hit.outcome.type, "hit", `${m.slug}/${stateId}: 当たりにならない`);
        assertTrue(
          hit.outcome.balls > 0,
          `${m.slug}/${stateId}: 当たりの出玉が0（payoutTableかballsの指定漏れ）`
        );
        assertTrue(
          !!m.states[hit.outcome.nextStateId],
          `${m.slug}/${stateId}: 当たり後の遷移先が存在しない`
        );

        // countDownは、全部外したときの遷移先も確かめる
        if (state.mode === "countDown") {
          const missSession = {
            stateId,
            remaining: state.maxAttempts,
            stock: state.stockMode ? STOCK_FOR_TEST : null,
            streak: null,
          };
          // judgmentGate付きの状態は「ゲート抽選→(開いた時だけ)当落抽選」の2段構えなので、
          // 定数rngだと素通り判定に固定されてしまい永遠にストックが減らない。
          // ゲートは必ず開き、当落は必ずハズレる値を交互に返すスクリプトにする。
          const missRng = state.judgmentGate
            ? PachiSim.rng.createScriptedRng(
                Array.from({ length: cap * 2 }, (_, i) => (i % 2 === 0 ? 0.001 : 0.999999))
              )
            : () => 0.999999;
          const miss = PachiSim.engine.resolveAction(missSession, m, missRng);
          assertEqual(miss.outcome.type, "exhausted", `${m.slug}/${stateId}: 消化しきりにならない`);
          assertEqual(
            miss.outcome.attempts,
            cap,
            `${m.slug}/${stateId}: 消化回数が規定回数（またはストック数）と違う`
          );
          assertTrue(
            !!m.states[miss.outcome.nextStateId],
            `${m.slug}/${stateId}: 消化後の遷移先が存在しない`
          );
        }
      });
    });
  });

  // ---- 検証ロジックそのもののテスト ----

  test("machineValidator: 正しいデータは通る", () => {
    assertEqual(errorsFor(validMachine()).length, 0);
  });

  test("machineValidator: 存在しない遷移先を弾く", () => {
    const m = withState("normal", {
      onHit: { outcomes: [{ weight: 1, rounds: 4, nextState: "typo", tag: "t" }] },
    });
    assertTrue(errorsFor(m).some((e) => e.indexOf("typo") >= 0), "nextStateのtypoを見逃した");

    const m2 = withState("rush", { onExhausted: { nextState: "nowhere", tag: "t" } });
    assertTrue(
      errorsFor(m2).some((e) => e.indexOf("nowhere") >= 0),
      "onExhaustedのnextStateのtypoを見逃した"
    );
  });

  test("machineValidator: payoutTableにもballsにも無いラウンドを弾く", () => {
    // 出玉が決まらないと、engineは黙って0玉にしてしまう
    const m = withState("normal", {
      onHit: { outcomes: [{ weight: 1, rounds: 99, nextState: "rush", tag: "t" }] },
    });
    assertTrue(errorsFor(m).some((e) => e.indexOf("99R") >= 0), "出玉不明のラウンドを見逃した");

    // balls指定があれば通る
    const ok = withState("normal", {
      onHit: { outcomes: [{ weight: 1, rounds: 99, balls: 1234, nextState: "rush", tag: "t" }] },
    });
    assertEqual(errorsFor(ok).length, 0, "balls指定があるのに弾かれた");
  });

  test("machineValidator: weightの合計が1でないものを弾く", () => {
    const m = withState("normal", {
      onHit: {
        outcomes: [
          { weight: 0.5, rounds: 4, nextState: "rush", tag: "a" },
          { weight: 0.05, rounds: 4, nextState: "rush", tag: "b" }, // 0.5のつもりが0.05
        ],
      },
    });
    assertTrue(errorsFor(m).some((e) => e.indexOf("weightの合計") >= 0), "重みの桁間違いを見逃した");
  });

  test("machineValidator: 確率の異常値を弾く", () => {
    assertTrue(
      errorsFor(withState("normal", { probability: 0 })).some((e) => e.indexOf("probability") >= 0),
      "確率0を見逃した"
    );
    assertTrue(
      errorsFor(withState("normal", { probability: 1.5 })).some((e) => e.indexOf("probability") >= 0),
      "確率1超えを見逃した"
    );
    assertTrue(
      errorsFor(withState("normal", { probability: 199.8 })).some(
        (e) => e.indexOf("probability") >= 0
      ),
      "1/199.8と書くつもりで199.8と書いたのを見逃した"
    );
  });

  test("machineValidator: countDownのonExhausted忘れを弾く", () => {
    const m = withState("rush", { onExhausted: null });
    assertTrue(
      errorsFor(m).some((e) => e.indexOf("onExhausted") >= 0),
      "消化しきったときの行き先が無いのを見逃した"
    );
  });

  test("machineValidator: countDownのmaxAttempts異常を弾く", () => {
    assertTrue(
      errorsFor(withState("rush", { maxAttempts: null })).some((e) => e.indexOf("maxAttempts") >= 0),
      "countDownでmaxAttemptsがnullなのを見逃した"
    );
    assertTrue(
      errorsFor(withState("normal", { maxAttempts: 100 })).some((e) => e.indexOf("maxAttempts") >= 0),
      "countUpなのにmaxAttemptsがあるのを見逃した"
    );
  });

  test("machineValidator: 状態のキーとidの不一致を弾く", () => {
    const m = withState("rush", { id: "rushh" });
    assertTrue(errorsFor(m).some((e) => e.indexOf("キーと一致") >= 0), "キーとidの不一致を見逃した");
  });

  test("machineValidator: baseStateIdとisBaseStateの食い違いを弾く", () => {
    const m1 = validMachine({ baseStateId: "nowhere" });
    assertTrue(errorsFor(m1).some((e) => e.indexOf("nowhere") >= 0), "baseStateIdのtypoを見逃した");

    const m2 = withState("rush", { isBaseState: true });
    assertTrue(
      errorsFor(m2).some((e) => e.indexOf("isBaseState") >= 0),
      "isBaseStateが2つあるのを見逃した"
    );
  });

  test("machineValidator: 存在しないdistributionTable参照を弾く", () => {
    const m = withState("rush", {
      onHit: { distributionTable: "missing", nextState: "rush", tag: "t" },
    });
    assertTrue(errorsFor(m).some((e) => e.indexOf("missing") >= 0), "テーブル名のtypoを見逃した");
  });

  test("machineValidator: 必須項目の欠落を弾く", () => {
    assertTrue(errorsFor(validMachine({ name: "" })).some((e) => e.indexOf("name") >= 0));
    assertTrue(errorsFor(validMachine({ rules: [] })).some((e) => e.indexOf("rules") >= 0));
    assertTrue(
      errorsFor(validMachine({ spinsPer1000Yen: 0 })).some((e) => e.indexOf("spinsPer1000Yen") >= 0)
    );
    assertTrue(
      errorsFor(validMachine({ manufacturer: { id: "x" } })).some(
        (e) => e.indexOf("manufacturer") >= 0
      )
    );
  });

  test("machineRegistry: registerが不正なデータを弾く", () => {
    // 検証に引っかかると登録前に例外が飛ぶので、レジストリは汚れない
    const broken = validMachine({ slug: "broken-for-test" });
    broken.states.normal.onHit.outcomes[0].nextState = "nowhere";

    let message = null;
    try {
      PachiSim.machineRegistry.register(broken);
    } catch (e) {
      message = e.message;
    }
    assertTrue(message !== null, "registerが不正なデータをそのまま受け入れた");
    assertTrue(message.indexOf("nowhere") >= 0, `例外に原因が書かれていない: ${message}`);
    assertEqual(
      PachiSim.machineRegistry.getBySlug("broken-for-test"),
      null,
      "弾いたはずの機種が登録されている"
    );
  });
})();
