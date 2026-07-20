/**
 * questions.js
 * Ngân hàng câu hỏi Toán lớp 1 — cộng trừ trong phạm vi 20
 * Tự sinh câu hỏi + 4 đáp án (1 đúng, 3 sai)
 */

/**
 * Sinh ngẫu nhiên một câu hỏi toán lớp 1
 * Dạng: cộng, trừ trong phạm vi 20
 */
function generateQuestion() {
  const type = Math.random() < 0.55 ? 'add' : 'sub';
  let a, b, answer, question;

  if (type === 'add') {
    a = randInt(0, 18);
    b = randInt(0, 20 - a);
    answer = a + b;
    question = `${a} + ${b} = ?`;
  } else {
    a = randInt(1, 20);
    b = randInt(0, a);
    answer = a - b;
    question = `${a} - ${b} = ?`;
  }

  const options = generateOptions(answer, 0, 20);
  return { question, answer, options };
}

/**
 * Sinh 4 đáp án (1 đúng, 3 sai, không trùng nhau)
 */
function generateOptions(correct, min, max) {
  const set = new Set([correct]);
  let guard = 0;

  while (set.size < 4 && guard < 100) {
    guard++;
    const delta = randInt(1, 5);
    const dir   = Math.random() < 0.5 ? 1 : -1;
    let wrong = correct + dir * delta;
    // clamp vào [min, max]
    wrong = Math.max(min, Math.min(max, wrong));
    set.add(wrong);
  }

  // Nếu vẫn chưa đủ 4 (hiếm), thêm tuần tự
  let fill = min;
  while (set.size < 4) {
    if (!set.has(fill)) set.add(fill);
    fill++;
  }

  return shuffle(Array.from(set));
}

/**
 * Tạo một bộ đề gồm n câu hỏi không trùng nhau
 */
function generateQuiz(n) {
  const questions = [];
  const seen = new Set();
  let attempts = 0;

  while (questions.length < n && attempts < n * 10) {
    const q = generateQuestion();
    if (!seen.has(q.question)) {
      seen.add(q.question);
      questions.push(q);
    }
    attempts++;
  }

  // fallback: nếu không đủ, cho phép trùng
  while (questions.length < n) {
    questions.push(generateQuestion());
  }

  return questions;
}

/* ===== HELPERS ===== */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
