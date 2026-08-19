const STORAGE_KEY = "counterValue";

const countEl = document.getElementById("count");
const plusBtn = document.getElementById("plus");
const minusBtn = document.getElementById("minus");
const resetBtn = document.getElementById("reset");

let count = Number(localStorage.getItem(STORAGE_KEY)) || 0;

function render() {
  countEl.textContent = count;
}

function save() {
  localStorage.setItem(STORAGE_KEY, String(count));
}

plusBtn.addEventListener("click", () => {
  count++;
  save();
  render();
});

minusBtn.addEventListener("click", () => {
  count--;
  save();
  render();
});

resetBtn.addEventListener("click", () => {
  count = 0;
  save();
  render();
});

render();
