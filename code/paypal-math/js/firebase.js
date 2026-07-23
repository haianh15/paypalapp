/**
 * firebase.js
 * Khoi tao Firebase Realtime Database va cac helper doc/ghi lich su
 * Device ID: moi thiet bi tu sinh 1 ID luu localStorage.
 * Chia se ID sang thiet bi khac la co the xem chung lich su.
 */

// ===== CONFIG =====
const firebaseConfig = {
  apiKey:            "AIzaSyDUbYWjIxuIr7Y2PE6IM-HvuyestVo-vm0",
  authDomain:        "fir-4bb7d.firebaseapp.com",
  databaseURL:       "https://fir-4bb7d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "fir-4bb7d",
  storageBucket:     "fir-4bb7d.firebasestorage.app",
  messagingSenderId: "126274441827",
  appId:             "1:126274441827:web:65d5818c5836228a60de56"
};

// ===== INIT =====
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== DEVICE ID =====
const DEVICE_KEY = 'paypal_math_device_id';

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    // Sinh ID ngan gon 8 ky tu
    id = Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function setDeviceId(newId) {
  const clean = newId.trim().toUpperCase();
  if (!clean) return false;
  localStorage.setItem(DEVICE_KEY, clean);
  return true;
}

// ===== DATABASE HELPERS =====

/**
 * Lay duong dan Realtime DB cho device hien tai
 * Structure: /history/{deviceId}/{pushKey} = record
 */
function historyRef(deviceId) {
  return db.ref('history/' + (deviceId || getDeviceId()));
}

/**
 * Luu 1 ket qua len Firebase
 * @param {object} result - ket qua bai lam
 * @returns {Promise}
 */
function saveHistoryToFirebase(result) {
  return historyRef().push({
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
 * @param {string} [deviceId] - neu truyen vao se lay theo device do
 * @returns {Promise<Array>}
 */
function getHistoryFromFirebase(deviceId) {
  return historyRef(deviceId)
    .orderByChild('date')
    .once('value')
    .then(snapshot => {
      const items = [];
      snapshot.forEach(child => {
        items.push({ _fbKey: child.key, ...child.val() });
      });
      // Dao nguoc: moi nhat truoc
      items.reverse();
      return items.map((item, i) => ({ ...item, _index: i }));
    });
}

/**
 * Xoa toan bo lich su tren Firebase
 * @returns {Promise}
 */
function clearHistoryOnFirebase() {
  return historyRef().remove();
}
