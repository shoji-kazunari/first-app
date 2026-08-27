// 効果音の制御まわりのテスト。
//
// 「いい音かどうか」はテストで判定できないので、ここで確かめるのは
// 「鳴らすと決めた条件でだけ鳴るか」だけ。音そのものは実機で聞いて調整する。
(function () {
  const { test, assertEqual, assertTrue } = PachiSimTest;
  const player = PachiSim.soundPlayer;

  test("効果音: 初期状態はOFFで、鳴らそうとしても鳴らない", () => {
    player.setEnabled(false);
    assertEqual(player.isEnabled(), false, "isEnabled");
    assertEqual(player.play("charge"), false, "OFFなのに鳴った");
  });

  test("効果音: 知らない名前を渡しても落ちずに、鳴らさず返す", () => {
    player.setEnabled(true);
    assertEqual(player.play("そんな音はない"), false);
    player.setEnabled(false);
  });

  test("効果音: ONにすると鳴る", () => {
    player.setEnabled(true);
    assertEqual(player.isEnabled(), true, "isEnabled");
    assertEqual(player.play("charge"), true, "ONなのに鳴らなかった");
    player.setEnabled(false);
  });

  test("効果音: 同じ音を続けて呼ぶと、2回目は間引かれる", () => {
    // 「当たりまで」のような速さで呼ばれても音が潰れないようにするための間引き。
    // 呼ぶ側(machine.js)の速度ごとの絞り込みをすり抜けても雑音にならないことを保証する。
    player.setEnabled(true);
    player.play("miss"); // 1回目（この時点の時刻を記録する）
    assertEqual(player.play("miss"), false, "2回目が間引かれていない");
    player.setEnabled(false);
  });

  test("効果音: 間引きは音ごとに独立している", () => {
    // chargeを鳴らした直後でも、別の音であるslideは鳴らせる必要がある
    // （保留が貯まる音とスライドの音は続けて鳴る）。
    player.setEnabled(true);
    player.play("charge"); // 直前のテストで既に鳴らしているので間引かれる可能性がある
    assertEqual(player.play("slide"), true, "別の音まで巻き添えで間引かれている");
    player.setEnabled(false);
  });

  test("効果音: OFFに戻すと鳴らなくなる", () => {
    player.setEnabled(true);
    player.setEnabled(false);
    assertEqual(player.play("hit"), false);
  });

  test("効果音: 演出の節目に対応する音がすべて揃っている", () => {
    // machine.js / reelDisplay.js が鳴らそうとする名前。
    // ここが欠けると、その節目だけ無音のまま気づけない。
    const expected = [
      "charge", // 保留が1個貯まる
      "slide", // 保留が当該位置へ滑る
      "reelStart", // リールが回り出す
      "reelStop", // リールが1つ止まる
      "reach", // テンパイ
      "miss", // ハズレ
      "hit", // 大当たり
      "exhausted", // ST・時短が当たらずに終わった
      "result", // 一撃が終わってRESULTが出る
    ];
    expected.forEach((name) => {
      assertTrue(player.soundNames.indexOf(name) >= 0, `${name} の音が定義されていない`);
    });
    assertEqual(player.soundNames.length, expected.length, "使われていない音が残っている");
  });

  test("効果音: ON/OFFがlocalStorageに残る", () => {
    player.setEnabled(true);
    assertEqual(window.localStorage.getItem("pachisim.sound.enabled"), "1");
    player.setEnabled(false);
    assertEqual(window.localStorage.getItem("pachisim.sound.enabled"), "0");
  });
})();
