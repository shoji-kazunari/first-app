// 機種データの検証。
//
// 機種は今後どんどん増えていく想定で、その追加はほぼコピー＆編集になる。
// 状態IDのtypoや確率の桁間違いは、実行時にその状態へ到達して初めて壊れるため
// 気づくのが遅れやすい。ここで登録時にまとめて検査し、おかしければ即座に落とす。
//
// validate()は副作用のない純関数で、問題点の説明を文字列の配列で返す
// （空配列＝問題なし）。registry.register()がこれを呼び、tests/machines.tests.jsが
// 登録済みの全機種に対して実行する。
window.PachiSim = window.PachiSim || {};

PachiSim.machineValidator = (function () {
  // onHit.outcomes や distributionTables の重みは、rng.weightedPick が合計で
  // 正規化するため合計1でなくても動く。ただし既存機種はすべて「確率そのもの」を
  // 重みに書いており、合計が1から外れているのは書き間違いの可能性が高いので弾く。
  const WEIGHT_SUM_TOLERANCE = 0.001;
  const MODES = ["countUp", "countDown"];

  function isNonEmptyString(v) {
    return typeof v === "string" && v.trim() !== "";
  }

  function isPositiveNumber(v) {
    return typeof v === "number" && Number.isFinite(v) && v > 0;
  }

  function isPositiveInteger(v) {
    return isPositiveNumber(v) && Number.isInteger(v);
  }

  // 出玉が決まるか（payoutTableに該当ラウンドがあるか、balls指定があるか）。
  // どちらも無いとengineが黙って0玉にしてしまい、テーブルの書き忘れに気づけない。
  function payoutIsResolvable(machine, rounds, ballsOverride) {
    if (ballsOverride != null) return isPositiveNumber(ballsOverride);
    return isPositiveNumber(machine.payoutTable && machine.payoutTable[rounds]);
  }

  function checkWeightSum(entries, where, errors) {
    const sum = entries.reduce((acc, e) => acc + (typeof e.weight === "number" ? e.weight : 0), 0);
    if (Math.abs(sum - 1) > WEIGHT_SUM_TOLERANCE) {
      errors.push(`${where}: weightの合計が${sum}（1になるはず）`);
    }
  }

  function validateOutcome(machine, outcome, where, errors) {
    if (!isPositiveNumber(outcome.weight)) {
      errors.push(`${where}: weightが正の数でない（${outcome.weight}）`);
    }
    if (!isPositiveInteger(outcome.rounds)) {
      errors.push(`${where}: roundsが正の整数でない（${outcome.rounds}）`);
    } else if (!payoutIsResolvable(machine, outcome.rounds, outcome.balls)) {
      errors.push(
        `${where}: ${outcome.rounds}Rの出玉が決まらない（payoutTableに${outcome.rounds}が無く、balls指定も無い）`
      );
    }
    if (!machine.states[outcome.nextState]) {
      errors.push(`${where}: nextState "${outcome.nextState}" が存在しない`);
    } else if (machine.states[outcome.nextState].stockMode) {
      // 遷移先がストック制の状態なら、次のストックの決め方（持ち越し+付与 or 固定値）が必須。
      // 無いとエンジン側でnextStock=0にフォールバックし、即座に規定消化扱いになってしまう。
      if (outcome.stockAdd == null && outcome.stockSet == null && !outcome.stockUnlimited) {
        errors.push(
          `${where}: 遷移先"${outcome.nextState}"はstockModeだが、stockAdd/stockSet/stockUnlimitedがどれも無い`
        );
      }
      // 無制限を配るなら、遷移先に「無制限中に使う表」が要る。
      // 無い場合、無制限は数として常に最大のminStockに当てはまり、そこが再び無制限を
      // 配る表なら永久に終わらない（平均連チャンが1000回超という形で表面化する）。
      if (outcome.stockUnlimited) {
        const target = machine.states[outcome.nextState];
        const buckets = (target.onHit && target.onHit.stockOutcomes) || null;
        if (!buckets) {
          errors.push(
            `${where}: stockUnlimitedの遷移先"${outcome.nextState}"にstockOutcomesが無い（無制限中の振り分けを決められない）`
          );
        } else if (!buckets.some((b) => b.whenUnlimited)) {
          errors.push(
            `${where}: stockUnlimitedの遷移先"${outcome.nextState}"にwhenUnlimitedの表が無い。` +
              "無制限中の当たりがまた無制限を配り、RUSHが終わらなくなる"
          );
        }
      }
    }
    if (outcome.bonusLoop != null) {
      if (!isPositiveNumber(outcome.bonusLoop.probability) || outcome.bonusLoop.probability > 1) {
        errors.push(
          `${where}.bonusLoop: probabilityが0より大きく1以下でない（${outcome.bonusLoop.probability}）`
        );
      }
      if (!isPositiveNumber(outcome.bonusLoop.balls)) {
        errors.push(`${where}.bonusLoop: ballsが正の数でない（${outcome.bonusLoop.balls}）`);
      }
    }
  }

  function validateState(machine, stateId, state, errors) {
    const where = `states.${stateId}`;
    if (state.id !== stateId) {
      errors.push(`${where}: idが"${state.id}"でキーと一致しない`);
    }
    if (!isNonEmptyString(state.label)) errors.push(`${where}: labelが空`);
    if (!isNonEmptyString(state.actionLabel)) errors.push(`${where}: actionLabelが空`);
    if (!isNonEmptyString(state.theme)) errors.push(`${where}: themeが空`);

    if (MODES.indexOf(state.mode) < 0) {
      errors.push(`${where}: modeが"${state.mode}"（${MODES.join("|")} のいずれかであるべき）`);
    }
    if (!isPositiveNumber(state.probability) || state.probability > 1) {
      errors.push(`${where}: probabilityが0より大きく1以下でない（${state.probability}）`);
    }

    if (state.mode === "countUp") {
      // countUpは当たるまで回し続ける状態なので、規定回数を持たない
      if (state.maxAttempts != null) {
        errors.push(`${where}: countUpなのにmaxAttemptsがnullでない（${state.maxAttempts}）`);
      }
      if (state.stockMode) {
        errors.push(`${where}: countUpとstockModeは同時に指定できない`);
      }
      if (state.judgmentGate) {
        errors.push(`${where}: judgmentGateはstockMode専用（countUpには指定できない）`);
      }
    } else if (state.mode === "countDown") {
      if (state.stockMode) {
        // stockModeは固定回数を持たず、毎回session.stock（前の状態からの持ち越し）で決まる
        if (state.maxAttempts != null) {
          errors.push(`${where}: stockModeなのにmaxAttemptsがnullでない（${state.maxAttempts}）`);
        }
        if (
          state.judgmentGate != null &&
          (!isPositiveNumber(state.judgmentGate.probability) || state.judgmentGate.probability > 1)
        ) {
          errors.push(
            `${where}.judgmentGate: probabilityが0より大きく1以下でない（${state.judgmentGate.probability}）`
          );
        }
      } else {
        if (state.judgmentGate) {
          errors.push(`${where}: judgmentGateはstockMode専用`);
        }
        if (!isPositiveInteger(state.maxAttempts)) {
          errors.push(`${where}: countDownのmaxAttemptsが正の整数でない（${state.maxAttempts}）`);
        }
      }
      // 規定回数（またはストック）を使い切ったときの行き先が無いと、消化しきった瞬間に落ちる
      if (!state.onExhausted) {
        errors.push(`${where}: countDownなのにonExhaustedが無い`);
      } else if (!machine.states[state.onExhausted.nextState]) {
        errors.push(
          `${where}.onExhausted: nextState "${state.onExhausted.nextState}" が存在しない`
        );
      }
    }

    // 転落抽選（任意）。RUSHが「規定回数」ではなく「転落を引くまで」で終わる機種で使う。
    // ここが壊れていると、その状態が永久に終わらないか、遷移先が無くて落ちる。
    if (state.onFall != null) {
      const fall = state.onFall;
      if (typeof fall !== "object") {
        errors.push(`${where}.onFall: オブジェクトでない`);
      } else {
        if (typeof fall.probability !== "number" || !(fall.probability > 0) || fall.probability > 1) {
          errors.push(
            `${where}.onFall: probabilityが0より大きく1以下でない（${fall.probability}）`
          );
        }
        if (!machine.states[fall.nextState]) {
          errors.push(`${where}.onFall: nextState "${fall.nextState}" が存在しない`);
        }
        if (fall.residualAttempts != null && !isPositiveInteger(fall.residualAttempts)) {
          errors.push(
            `${where}.onFall: residualAttemptsが正の整数でない（${fall.residualAttempts}）`
          );
        }
      }
    }

    const onHit = state.onHit;
    if (!onHit) {
      errors.push(`${where}: onHitが無い`);
      return;
    }
    if (onHit.outcomes) {
      if (!Array.isArray(onHit.outcomes) || onHit.outcomes.length === 0) {
        errors.push(`${where}.onHit.outcomes: 空の配列`);
        return;
      }
      onHit.outcomes.forEach((o, i) => {
        validateOutcome(machine, o, `${where}.onHit.outcomes[${i}]`, errors);
      });
      checkWeightSum(onHit.outcomes, `${where}.onHit.outcomes`, errors);
    } else if (onHit.stockOutcomes) {
      if (!state.stockMode) {
        errors.push(`${where}: stockOutcomesを使うにはstockMode:trueが必要`);
      }
      if (!Array.isArray(onHit.stockOutcomes) || onHit.stockOutcomes.length === 0) {
        errors.push(`${where}.onHit.stockOutcomes: 空の配列`);
        return;
      }
      onHit.stockOutcomes.forEach((bucket, bi) => {
        const bucketWhere = `${where}.onHit.stockOutcomes[${bi}]`;
        if (bucket.minStock == null && bucket.maxStock == null && !bucket.whenUnlimited) {
          errors.push(`${bucketWhere}: minStock/maxStockが両方とも無い（全ストック域を拾えない）`);
        }
        if (bucket.whenUnlimited && (bucket.minStock != null || bucket.maxStock != null)) {
          errors.push(
            `${bucketWhere}: whenUnlimitedの表にminStock/maxStockは指定できない（無制限は数の範囲で判定しない）`
          );
        }
        if (!Array.isArray(bucket.outcomes) || bucket.outcomes.length === 0) {
          errors.push(`${bucketWhere}.outcomes: 空の配列`);
          return;
        }
        bucket.outcomes.forEach((o, i) => {
          validateOutcome(machine, o, `${bucketWhere}.outcomes[${i}]`, errors);
        });
        checkWeightSum(bucket.outcomes, `${bucketWhere}.outcomes`, errors);
      });
    } else if (onHit.distributionTable) {
      const table = machine.distributionTables && machine.distributionTables[onHit.distributionTable];
      if (!Array.isArray(table) || table.length === 0) {
        errors.push(
          `${where}.onHit: distributionTable "${onHit.distributionTable}" が distributionTables に無い`
        );
        return;
      }
      if (!machine.states[onHit.nextState]) {
        errors.push(`${where}.onHit: nextState "${onHit.nextState}" が存在しない`);
      }
      table.forEach((row, i) => {
        const rowWhere = `distributionTables.${onHit.distributionTable}[${i}]`;
        if (!isPositiveNumber(row.weight)) {
          errors.push(`${rowWhere}: weightが正の数でない（${row.weight}）`);
        }
        if (!isPositiveInteger(row.rounds)) {
          errors.push(`${rowWhere}: roundsが正の整数でない（${row.rounds}）`);
        } else if (!payoutIsResolvable(machine, row.rounds, row.balls)) {
          errors.push(`${rowWhere}: ${row.rounds}Rの出玉が決まらない`);
        }
      });
      checkWeightSum(table, `distributionTables.${onHit.distributionTable}`, errors);
    } else {
      errors.push(`${where}.onHit: outcomes・stockOutcomes・distributionTableのいずれも無い`);
    }
  }

  // 戻り値: 問題点の説明の配列（空配列＝問題なし）
  function validate(machine) {
    const errors = [];
    if (!machine || typeof machine !== "object") return ["機種データがオブジェクトでない"];

    ["id", "slug", "name", "nameKana"].forEach((key) => {
      if (!isNonEmptyString(machine[key])) errors.push(`${key}が空`);
    });
    if (!Array.isArray(machine.aliases) || !machine.aliases.every(isNonEmptyString)) {
      errors.push("aliasesが文字列の配列でない");
    }
    if (!machine.manufacturer || !isNonEmptyString(machine.manufacturer.id) ||
        !isNonEmptyString(machine.manufacturer.name)) {
      errors.push("manufacturerにidとnameが揃っていない");
    }
    if (!isPositiveNumber(machine.spinsPer1000Yen)) {
      errors.push(`spinsPer1000Yenが正の数でない（${machine.spinsPer1000Yen}）`);
    }
    if (!Array.isArray(machine.rules) || machine.rules.length === 0 ||
        !machine.rules.every(isNonEmptyString)) {
      errors.push("rulesが1つ以上の文字列の配列でない");
    }
    if (!machine.payoutTable || Object.keys(machine.payoutTable).length === 0) {
      errors.push("payoutTableが空");
    }

    const states = machine.states;
    if (!states || Object.keys(states).length === 0) {
      errors.push("statesが空");
      return errors;
    }
    if (!states[machine.baseStateId]) {
      errors.push(`baseStateId "${machine.baseStateId}" がstatesに存在しない`);
    }

    const baseStates = Object.keys(states).filter((id) => states[id].isBaseState);
    if (baseStates.length !== 1) {
      errors.push(`isBaseStateがtrueの状態は1つであるべき（今は${baseStates.length}個）`);
    } else if (baseStates[0] !== machine.baseStateId) {
      errors.push(
        `isBaseStateがtrueなのは"${baseStates[0]}"だが、baseStateIdは"${machine.baseStateId}"`
      );
    }

    Object.keys(states).forEach((stateId) => {
      validateState(machine, stateId, states[stateId], errors);
    });

    return errors;
  }

  return { validate };
})();
