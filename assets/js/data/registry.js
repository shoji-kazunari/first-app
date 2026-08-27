// 機種データのレジストリ。
// 新しい機種を追加するときは、この仕組みに対して1つMachineデータを register するだけでよい。
// TOPページのメーカー一覧・検索・機種ページはすべてこのレジストリ経由でデータを参照する。
window.PachiSim = window.PachiSim || {};

PachiSim.machineRegistry = (function () {
  const manufacturers = []; // [{ id, name, machines: [machine, ...] }]
  const machinesBySlug = {};

  function register(machine) {
    if (machinesBySlug[machine.slug]) {
      throw new Error(`machine slug already registered: ${machine.slug}`);
    }
    // 状態IDのtypoや確率の桁間違いは、その状態へ到達するまで表面化せず気づきにくい。
    // 読み込んだ時点でまとめて検査し、おかしければここで落とす。
    if (PachiSim.machineValidator) {
      const errors = PachiSim.machineValidator.validate(machine);
      if (errors.length > 0) {
        throw new Error(`機種データが不正です（${machine.slug}）:\n  - ${errors.join("\n  - ")}`);
      }
    }
    machinesBySlug[machine.slug] = machine;

    let group = manufacturers.find((m) => m.id === machine.manufacturer.id);
    if (!group) {
      group = { id: machine.manufacturer.id, name: machine.manufacturer.name, machines: [] };
      manufacturers.push(group);
    }
    group.machines.push(machine);
    return machine;
  }

  function getAll() {
    return Object.values(machinesBySlug);
  }

  function getBySlug(slug) {
    return machinesBySlug[slug] || null;
  }

  function getManufacturers() {
    return manufacturers;
  }

  return { register, getAll, getBySlug, getManufacturers };
})();
