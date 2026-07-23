/**
 * history.js
 * Quan ly lich su lam bai
 * - Luu/doc Firebase Realtime Database (chinh)
 * - Fallback localStorage neu Firebase chua san sang
 */

const STORAGE_KEY = 'paypal_math_history';

// ===== LOCALSTORAGE HELPERS (fallback + cache) =====

function getHistoryLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return data.map((item, i) => ({ ...item, _index: i }));
  } catch {
    return [];
  }
}

function saveHistoryLocal(result) {
  try {
    const raw  = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    data.unshift({
      total:    result.total,
      correct:  result.correct,
      wrong:    result.wrong,
      skipped:  result.skipped,
      score:    result.score,
      duration: result.duration,
      answers:  result.answers,
      date:     result.date || new Date().toISOString(),
    });
    if (data.length > 200) data.splice(200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('localStorage save failed:', e);
  }
}

function clearHistoryLocal() {
  localStorage.removeItem(STORAGE_KEY);
}

// ===== PUBLIC API =====

/**
 * Lay toan bo lich su.
 * - Neu Firebase san sang: lay tu Firebase
 * - Neu khong: lay tu localStorage
 * @param {string}   [deviceId]  - de xem lich su thiet bi khac
 * @param {Function} callback    - callback(array) khi co du lieu
 */
function getHistory(deviceId, callback) {
  // Ho tro goi cu: getHistory() khong co tham so -> tra ve local
  if (typeof deviceId === 'undefined' && typeof callback === 'undefined') {
    return getHistoryLocal();
  }
  // Neu chi truyen callback (khong co deviceId)
  if (typeof deviceId === 'function') {
    callback = deviceId;
    deviceId = null;
  }

  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    getHistoryFromFirebase(deviceId)
      .then(data => callback(data))
      .catch(err => {
        console.warn('Firebase read failed, fallback localStorage:', err);
        callback(getHistoryLocal());
      });
  } else {
    callback(getHistoryLocal());
  }
}

/**
 * Luu 1 ket qua moi.
 * Luu song song ca Firebase lan localStorage.
 * @param {object} result
 * @returns {Promise}
 */
function saveHistory(result) {
  // Luon luu local truoc (instant, offline-safe)
  saveHistoryLocal(result);

  // Luu len Firebase neu co
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    return saveHistoryToFirebase(result).catch(err => {
      console.warn('Firebase write failed (da luu local):', err);
    });
  }
  return Promise.resolve();
}

/**
 * Xoa toan bo lich su (ca Firebase lan local).
 * @returns {Promise}
 */
function clearAllHistory() {
  clearHistoryLocal();
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    return clearHistoryOnFirebase().catch(err => {
      console.warn('Firebase clear failed:', err);
    });
  }
  return Promise.resolve();
}

// ===== UTILS =====

function secondsToTime(s) {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
