/**
 * app.js
 * Logic chính cho trang practice.html
 */

/* ===== STATE ===== */
let questions = [];
let answers   = [];   // null = chưa làm, số = index đáp án chọn
let current   = 0;
let totalCount = 20;
let timerInterval = null;
let elapsedSeconds = 0;
let quizDone = false;

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Đọc số câu từ URL ?count=20|50|100
  const params = new URLSearchParams(window.location.search);
  const count = parseInt(params.get('count')) || 20;
  totalCount = [20, 50, 100].includes(count) ? count : 20;

  // Sinh đề
  questions = generateQuiz(totalCount);
  answers   = new Array(totalCount).fill(null);

  renderQuestion(0);
  buildDotNav();
  startTimer();
});

/* ===== TIMER ===== */
function startTimer() {
  elapsedSeconds = 0;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function updateTimerDisplay() {
  const el = document.getElementById('timerText');
  if (el) el.textContent = '⏱ ' + secondsToTime(elapsedSeconds);
}

/* ===== RENDER QUESTION ===== */
function renderQuestion(index) {
  current = index;
  const q = questions[index];

  document.getElementById('questionNumber').textContent = `Câu ${index + 1} / ${totalCount}`;
  document.getElementById('questionText').textContent   = q.question;
  document.getElementById('progressText').textContent  = `Câu ${index + 1} / ${totalCount}`;

  // Progress fill
  const pct = ((index + 1) / totalCount) * 100;
  document.getElementById('progressFill').style.width = pct + '%';

  // Options
  const grid = document.getElementById('optionsGrid');
  grid.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.dataset.optIndex = i;

    // Trạng thái đã chọn
    if (answers[index] !== null) {
      btn.disabled = true;
      if (answers[index] === i) {
        btn.classList.add(opt === q.answer ? 'correct' : 'wrong');
      } else if (opt === q.answer) {
        btn.classList.add('correct');
      }
    }

    btn.addEventListener('click', () => selectOption(index, i, btn));
    grid.appendChild(btn);
  });

  // Nav buttons
  document.getElementById('prevBtn').disabled = index === 0;
  const nextBtn = document.getElementById('nextBtn');
  if (index === totalCount - 1) {
    nextBtn.textContent = '✅ Nộp bài';
    nextBtn.onclick = () => confirmSubmit();
  } else {
    nextBtn.textContent = 'Câu tiếp →';
    nextBtn.onclick = () => nextQuestion();
  }

  updateDotNav();
}

/* ===== SELECT OPTION ===== */
function selectOption(qIndex, optIndex, clickedBtn) {
  if (answers[qIndex] !== null) return; // đã trả lời

  answers[qIndex] = optIndex;
  const q = questions[qIndex];
  const chosen = q.options[optIndex];

  // Hiển thị đúng/sai ngay
  const allBtns = document.querySelectorAll('.option-btn');
  allBtns.forEach((btn, i) => {
    btn.disabled = true;
    const val = q.options[i];
    if (i === optIndex) {
      btn.classList.add(chosen === q.answer ? 'correct' : 'wrong');
    } else if (val === q.answer) {
      btn.classList.add('correct');
    }
  });

  updateDotNav();

  // Auto-advance sau 800ms nếu không phải câu cuối
  if (qIndex < totalCount - 1) {
    setTimeout(() => {
      if (!quizDone) nextQuestion();
    }, 800);
  }
}

/* ===== NAVIGATION ===== */
function nextQuestion() {
  if (current < totalCount - 1) {
    renderQuestion(current + 1);
  }
}

function prevQuestion() {
  if (current > 0) {
    renderQuestion(current - 1);
  }
}

function confirmSubmit() {
  const unanswered = answers.filter(a => a === null).length;
  if (unanswered > 0) {
    const ok = window.confirm(`Bạn còn ${unanswered} câu chưa làm. Bạn có muốn nộp bài không?`);
    if (!ok) return;
  }
  submitQuiz();
}

/* ===== DOT NAV ===== */
function buildDotNav() {
  const nav = document.getElementById('dotNav');
  nav.innerHTML = '';
  questions.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.dataset.i = i;
    dot.title = `Câu ${i + 1}`;
    dot.addEventListener('click', () => renderQuestion(i));
    nav.appendChild(dot);
  });
}

function updateDotNav() {
  const dots = document.querySelectorAll('.dot');
  dots.forEach((dot, i) => {
    dot.className = 'dot';
    if (i === current) {
      dot.classList.add('current');
    } else if (answers[i] !== null) {
      const q = questions[i];
      const chosen = q.options[answers[i]];
      dot.classList.add(chosen === q.answer ? 'correct-dot' : 'wrong-dot');
    }
  });
}

/* ===== SUBMIT ===== */
function submitQuiz() {
  quizDone = true;
  stopTimer();

  let correct = 0, wrong = 0, skipped = 0;
  const answerDetails = [];

  questions.forEach((q, i) => {
    const chosenIdx = answers[i];
    if (chosenIdx === null) {
      skipped++;
      answerDetails.push({
        question: q.question,
        chosen:   null,
        answer:   q.answer,
        correct:  false,
      });
    } else {
      const chosen = q.options[chosenIdx];
      const isCorrect = chosen === q.answer;
      if (isCorrect) correct++; else wrong++;
      answerDetails.push({
        question: q.question,
        chosen:   chosen,
        answer:   q.answer,
        correct:  isCorrect,
      });
    }
  });

  const score = Math.round((correct / totalCount) * 100);
  const duration = secondsToTime(elapsedSeconds);

  // Lưu lịch sử
  saveHistory({
    total:    totalCount,
    correct,
    wrong,
    skipped,
    score,
    duration,
    answers:  answerDetails,
    date:     new Date().toISOString(),
  });

  showResult({ correct, wrong, skipped, score, duration });
}

/* ===== SHOW RESULT ===== */
function showResult({ correct, wrong, skipped, score, duration }) {
  document.getElementById('quizArea').classList.add('hidden');
  document.getElementById('progressWrap').classList.add('hidden');
  const resultArea = document.getElementById('resultArea');
  resultArea.classList.remove('hidden');

  document.getElementById('correctCount').textContent = correct;
  document.getElementById('wrongCount').textContent   = wrong;
  document.getElementById('skipCount').textContent    = skipped;
  document.getElementById('resultScoreBig').textContent = score + '%';
  document.getElementById('totalTime').textContent    = duration;

  let emoji, title, msg;
  if (score === 100) {
    emoji = '🏆'; title = 'Xuất sắc!';   msg = 'Tuyệt vời! Bạn trả lời đúng tất cả các câu! 🎉';
  } else if (score >= 80) {
    emoji = '⭐'; title = 'Giỏi lắm!';   msg = 'Bạn làm rất tốt! Tiếp tục phát huy nhé! 👏';
  } else if (score >= 50) {
    emoji = '👍'; title = 'Khá tốt!';    msg = 'Cố gắng thêm một chút nữa nhé! 💪';
  } else {
    emoji = '💪'; title = 'Cần cố gắng!'; msg = 'Không sao, luyện tập thêm là tiến bộ thôi! 📚';
  }

  document.getElementById('resultEmoji').textContent   = emoji;
  document.getElementById('resultTitle').textContent   = title;
  document.getElementById('resultMessage').textContent = msg;

  // Score color
  const scoreBig = document.getElementById('resultScoreBig');
  scoreBig.style.color = score >= 80 ? 'var(--green-d)' : score >= 50 ? 'var(--yellow-d)' : 'var(--accent)';
}

/* ===== REVIEW ===== */
function reviewAnswers() {
  document.getElementById('resultArea').classList.add('hidden');
  const reviewArea = document.getElementById('reviewArea');
  reviewArea.classList.remove('hidden');

  const list = document.getElementById('reviewList');
  list.innerHTML = questions.map((q, i) => {
    const chosenIdx = answers[i];
    const chosen    = chosenIdx !== null ? q.options[chosenIdx] : null;
    const isCorrect = chosen === q.answer;
    const cls       = chosen === null ? '' : (isCorrect ? 'review-correct' : 'review-wrong');
    return `
      <div class="review-item ${cls}">
        <div class="review-num">Câu ${i + 1}</div>
        <div class="review-content">
          <div class="review-question">${q.question}</div>
          <div class="review-answer">
            <span class="your-ans">Bạn chọn: <b>${chosen !== null ? chosen : 'Bỏ qua'}</b></span>
            ${!isCorrect ? `<span class="correct-ans">✅ Đáp án: <b>${q.answer}</b></span>` : ''}
          </div>
        </div>
        <div class="review-status">${chosen === null ? '⏭' : isCorrect ? '✅' : '❌'}</div>
      </div>
    `;
  }).join('');
}

function backToResult() {
  document.getElementById('reviewArea').classList.add('hidden');
  document.getElementById('resultArea').classList.remove('hidden');
}

/* ===== RETRY ===== */
function retryQuiz() {
  window.location.href = `practice.html?count=${totalCount}`;
}
