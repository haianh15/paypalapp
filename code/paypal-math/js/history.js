/**
 * history.js
 * - Luu/doc Firebase Realtime Database (chinh)
 * - Fallback localStorage neu Firebase chua san sang
 */

const STORAGE_KEY = 'paypal_math_history';

// ===== LOCALSTORAGE (fallback) =====

function getHistoryLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((item, i) => ({ ...item, _index: i }));
  } catch { return []; }
}

function saveHistoryLocal(result) {
  try {
    const raw  = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    data.unshift({
      total: result.total, correct: result.correct, wrong: result.wrong,
      skipped: result.skipped, score: result.score, duration: result.duration,
      answers: result.answers, date: result.date || new Date().toISOString()
    });
    if (data.length > 200) data.splice(200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { console.error('localStorage save failed:', e); }
}

function clearHistoryLocal() {
  localStorage.removeItem(STORAGE_KEY);
}

// ===== PUBLIC API =====

/**
 * Lay lich su — tu dong dung Firebase, fallback local
 * @param {Function} callback(array)
 */
function getHistory(callback) {
  // Neu goi khong co callback (kieu cu) -> tra ve local sync
  if (typeof callback !== 'function') {
    return getHistoryLocal();
  }

  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    getHistoryFromFirebase()
      .then(data => callback(data))
      .catch(err => {
        console.warn('Firebase read failed, dung local:', err);
        callback(getHistoryLocal());
      });
  } else {
    callback(getHistoryLocal());
  }
}

/**
 * Luu ket qua — Firebase + local song song
 * @param {object} result
 * @returns {Promise}
 */
function saveHistory(result) {
  saveHistoryLocal(result); // luu local ngay lap tuc

  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    return saveHistoryToFirebase(result).catch(err => {
      console.warn('Firebase write failed (da luu local):', err);
    });
  }
  return Promise.resolve();
}

/**
 * Xoa toan bo lich su (Firebase + local)
 * @returns {Promise}
 */
function clearAllHistory() {
  clearHistoryLocal();
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    return clearHistoryOnFirebase().catch(err => console.warn('Firebase clear failed:', err));
  }
  return Promise.resolve();
}

// ===== UTILS =====
function secondsToTime(s) {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
