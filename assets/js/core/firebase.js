// Firebase(Firestore + Authentication)への接続を1箇所にまとめるモジュール。
// このファイルだけESモジュール（type="module"）として読み込む。他の全ファイルは
// 従来どおりクラシックスクリプト＋window.PachiSimグローバルのままにするため、
// ここで得た機能はすべてwindow.PachiSim.fbへ吊るして橋渡しする。
//
// firebaseConfigの値（apiKey等）は「公開されて問題ない識別子」という設計になっており、
// 実際のアクセス制御はFirestore側のセキュリティルールで行う（このファイルの外、
// Firebaseコンソールの「Firestore Database」→「ルール」タブで設定）。
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpDZTpS6mR7IwFXexNHEGZe1BU0xY8hj4",
  authDomain: "pachinko-sim-4dfec.firebaseapp.com",
  projectId: "pachinko-sim-4dfec",
  storageBucket: "pachinko-sim-4dfec.firebasestorage.app",
  messagingSenderId: "1014801075436",
  appId: "1:1014801075436:web:5de225e08d7e6e600929c9",
};

// 運営（削除操作ができる人）とみなすメールアドレス。実際の削除権限はこの値ではなく
// Firestoreのセキュリティルール側（request.auth.token.email）で強制される。
// ここでの判定はあくまで「削除ボタンを表示するかどうか」というUI都合のもの。
const ADMIN_EMAIL = "shoji.kazunari.0624@gmail.com";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const rankingsCol = collection(db, "rankingEntries");

let currentUser = null;
const adminChangeListeners = [];

function isAdmin() {
  return !!(currentUser && currentUser.email === ADMIN_EMAIL);
}

// ログイン状態が変わるたびに、登録済みのリスナー（画面の再描画用）へ通知する。
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  adminChangeListeners.forEach((fn) => fn(isAdmin()));
});

window.PachiSim = window.PachiSim || {};
window.PachiSim.fb = {
  // 呼び出し側はawaitしてから他の関数を使うこと（初回のログイン状態確定を待つため）。
  ready: new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      unsubscribe();
      resolve();
    });
  }),

  isAdmin,

  // fn(isAdminNow) はログイン/ログアウトのたびに呼ばれる
  onAdminChange(fn) {
    adminChangeListeners.push(fn);
  },

  async login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  },

  // 運営ログイン専用。メールアドレスは固定（ADMIN_EMAIL）なので、
  // パスワードだけ入力すればログインできる。
  async loginAsAdmin(password) {
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
  },

  async logout() {
    await signOut(auth);
  },

  // machineSlug（任意）: 指定すると、その機種の記録だけをFirestore側で絞り込んで取得する
  // （読み取り件数を抑えるため）。並び替え・件数制限は呼び出し側（rankingService）で行う。
  async fetchAllEntries(machineSlug) {
    const q = machineSlug ? query(rankingsCol, where("machineSlug", "==", machineSlug)) : rankingsCol;
    const snap = await getDocs(q);
    return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
  },

  async addEntry(entry) {
    const docRef = await addDoc(rankingsCol, entry);
    return Object.assign({ id: docRef.id }, entry);
  },

  async deleteEntry(id) {
    await deleteDoc(doc(db, "rankingEntries", id));
  },

  async deleteEntries(ids) {
    await Promise.all(ids.map((id) => deleteDoc(doc(db, "rankingEntries", id))));
  },
};
