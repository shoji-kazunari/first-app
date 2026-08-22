// 検索用の文字列正規化ユーティリティ。
// 全角/半角・大文字/小文字・カタカナ/ひらがな・空白の差異を吸収して比較できるようにする。
window.PachiSim = window.PachiSim || {};

PachiSim.kana = (function () {
  function toHalfWidthAlnum(str) {
    return str
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
        String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
      )
      .replace(/[　]/g, " ");
  }

  function katakanaToHiragana(str) {
    return str.replace(/[ァ-ヶ]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    );
  }

  // 検索比較用に正規化した文字列を返す。
  // 全角半角統一 → 小文字化 → カタカナ→ひらがな → 空白除去
  function normalize(str) {
    if (!str) return "";
    return katakanaToHiragana(toHalfWidthAlnum(String(str)).toLowerCase()).replace(
      /\s+/g,
      ""
    );
  }

  // 正規化した上での部分一致判定
  function includesNormalized(target, query) {
    if (!query) return true;
    return normalize(target).includes(normalize(query));
  }

  return { normalize, includesNormalized, toHalfWidthAlnum, katakanaToHiragana };
})();
