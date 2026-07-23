/**
 * firebase.js
 * Khoi tao Firebase Realtime Database
 * Lich su luu tai: /history/{pushKey}
 * Tat ca thiet bi deu doc/ghi chung 1 node -> tu dong dong bo
 */

const firebaseConfig = {
  apiKey:            "AIzaSyDUbYWjIxuIr7Y2PE6IM-HvuyestVo-vm0",
  authDomain:        "fir-4bb7d.firebaseapp.com",
  databaseURL:       "https://fir-4bb7d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "fir-4bb7d",
  storageBucket:     "fir-4bb7d.firebasestorage.app",
  messagingSenderId: "126274441827",
  appId:             "1:126274441827:web:65d5818c5836228a60de56"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const HISTORY_REF = db.ref('history');

/**
 * Luu 1 ket qua len Firebase
 * @param {object} result
 * @returns {Promise}
 */
function saveHistoryToFirebase(result) {
  return HISTORY_REF.push({
    total:    result.total,
    correct:  result.correct,
    wrong:    result.wrong,
    skipped:  result.skipped,
    score:    result.score,
    duration: result.duration,
    answers:  result.answers || [],
    date:     result.date || new Date().toISOString()
  });
}

/**
 * Lay toan bo lich su tu Firebase (moi nhat truoc)
 * @returns {Promise<Array>}
 */
function getHistoryFromFirebase() {
  return HISTORY_REF
    .orderByChild('date')
    .once('value')
    .then(snapshot => {
      const items = [];
      snapshot.forEach(child => {
        items.push({ _fbKey: child.key, ...child.val() });
      });
      items.reverse(); // moi nhat truoc
      return items.map((item, i) => ({ ...item, _index: i }));
    });
}

/**
 * Xoa toan bo lich su tren Firebase
 * @returns {Promise}
 */
function clearHistoryOnFirebase() {
  return HISTORY_REF.remove();
}
