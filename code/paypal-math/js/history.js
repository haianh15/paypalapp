/**
 * history.js
 * Quản lý lịch sử làm bài — lưu vào localStorage
 */

const STORAGE_KEY = 'paypal_math_history';

/**
 * Lấy toàn bộ lịch sử (mới nhất trước)
 */
function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    // Gắn _index để tra cứu khi hiển thị chi tiết
    return data.map((item, i) => ({ ...item, _index: i }));
  } catch {
    return [];
  }
}

/**
 * Lưu một kết quả mới vào lịch sử
 * @param {object} result
 *   - total    {number}  tổng số câu
 *   - correct  {number}  số câu đúng
 *   - wrong    {number}  số câu sai
 *   - skipped  {number}  số câu bỏ qua
 *   - score    {number}  phần trăm (0-100)
 *   - duration {string}  chuỗi thời gian "mm:ss"
 *   - answers  {array}   chi tiết từng câu
 *   - date     {string}  ISO string
 */
function saveHistory(result) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    // Thêm vào đầu (mới nhất trước)
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
    // Giữ tối đa 200 bài
    if (data.length > 200) data.splice(200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Không thể lưu lịch sử:', e);
  }
}

/**
 * Xóa toàn bộ lịch sử
 */
function clearAllHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Format giây sang "mm:ss"
 */
function secondsToTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}
