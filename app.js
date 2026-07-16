/* =============================================
   용동 (용돈 관리 앱) - Core Logic
   ============================================= */

// ───────────────────────────────────────────────
// 1. CONSTANTS & CONFIG
// ───────────────────────────────────────────────
const CATEGORIES = {
  '매점/식비':  { emoji: '🍔', cls: 'cat-food',    color: '#fb923c' },
  '코노/PC방':  { emoji: '🎮', cls: 'cat-play',    color: '#a78bfa' },
  '교통비':     { emoji: '🚌', cls: 'cat-transit',  color: '#60a5fa' },
  '쇼핑/뷰티':  { emoji: '💄', cls: 'cat-shop',    color: '#f472b6' },
  '기타':       { emoji: '💫', cls: 'cat-etc',     color: '#34d399' },
};

const LEVELS = [
  { min: 0,   max: 99,   char: '🥚', label: '절약 새싹',    cls: 'char-egg' },
  { min: 100, max: 299,  char: '🐣', label: '절약 중',      cls: 'char-baby' },
  { min: 300, max: 599,  char: '🐷', label: '절약 고수',    cls: 'char-teen' },
  { min: 600, max: 999,  char: '🐖', label: '절약 왕',      cls: 'char-teen' },
  { min: 1000,max: 99999,char: '👑', label: '저축 마스터',  cls: 'char-master' },
];

const COOLDOWN_DAYS = 3;
const MILEAGE_RATE  = 100; // 절약 금액 / 100 = 포인트

// ───────────────────────────────────────────────
// 2. STATE
// ───────────────────────────────────────────────
let state = {
  budget: 0,
  transactions: [],
  mileage: { points: 0, history: [] },
  wishlist: [],
};

let currentTab      = 'home';
let selectedCat     = '매점/식비';
let currentFilter   = 'all';
let confirmCallback = null;
let donutChart      = null;
let compareChart    = null;
let wishTimerInterval = null;

// ───────────────────────────────────────────────
// 3. PERSISTENCE
// ───────────────────────────────────────────────
function loadState() {
  try {
    const saved = localStorage.getItem('yongdong_state');
    if (saved) state = { ...state, ...JSON.parse(saved) };
  } catch (e) { console.warn('State load failed', e); }
}

function saveState() {
  localStorage.setItem('yongdong_state', JSON.stringify(state));
}

// ───────────────────────────────────────────────
// 4. DATE HELPERS
// ───────────────────────────────────────────────
function today() {
  return new Date().toISOString().split('T')[0];
}

function getYM(d = new Date()) {
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

function fmtMoney(n) {
  return Number(n).toLocaleString('ko-KR') + '원';
}

function fmtMoneyShort(n) {
  if (n >= 10000) return (n / 10000).toFixed(1).replace('.0', '') + '만원';
  return n.toLocaleString('ko-KR') + '원';
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function diffMs(from, to = new Date()) {
  return new Date(to) - new Date(from);
}

// ───────────────────────────────────────────────
// 5. COMPUTED HELPERS
// ───────────────────────────────────────────────
function txByMonth(y, m) {
  return state.transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getFullYear() === y && (d.getMonth() + 1) === m;
  });
}

function sumAmount(txArr) {
  return txArr.reduce((s, t) => s + Number(t.amount), 0);
}

function getThisMonthSpent() {
  const { y, m } = getYM();
  return sumAmount(txByMonth(y, m));
}

function getLastMonthTotal() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const { y, m } = getYM(d);
  return sumAmount(txByMonth(y, m));
}

function getLevelInfo(points) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) return { ...LEVELS[i], idx: i };
  }
  return { ...LEVELS[0], idx: 0 };
}

// ───────────────────────────────────────────────
// 6. UI RENDERS
// ───────────────────────────────────────────────

// Header date
function renderHeaderDate() {
  const now = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  document.getElementById('headerDate').textContent =
    `${now.getMonth()+1}월 ${now.getDate()}일 (${days[now.getDay()]})`;
}

// ─── Dashboard ───
function renderDashboard() {
  const spent  = getThisMonthSpent();
  const budget = state.budget || 0;
  const remain = Math.max(0, budget - spent);
  const pct    = budget > 0 ? Math.min(100, Math.round(spent / budget * 100)) : 0;

  // Text values
  document.getElementById('remainAmount').textContent = fmtMoney(remain);
  document.getElementById('budgetDisplay').textContent = budget > 0 ? fmtMoney(budget) : '미설정';
  document.getElementById('usagePercent').textContent  = pct + '%';
  document.getElementById('usedAmountSmall').textContent = fmtMoney(spent);
  document.getElementById('budgetSmall').textContent     = fmtMoney(budget);

  // Progress bar
  const bar = document.getElementById('progressBar');
  bar.style.width = pct + '%';
  if (pct >= 100) {
    bar.className = 'progress-fill h-full rounded-full bg-gradient-to-r from-red-400 to-red-600';
  } else if (pct >= 80) {
    bar.className = 'progress-fill h-full rounded-full bg-gradient-to-r from-orange-400 to-red-400';
  } else {
    bar.className = 'progress-fill h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-400';
  }

  // Donut chart
  renderDonut(spent, budget);

  // Comparison
  renderCompare();

  // Alert banner
  checkAlerts(spent, budget);

  // Recent tx preview
  renderRecentTx();

  // Mileage preview
  renderMileagePreview();
}

function renderDonut(spent, budget) {
  const ctx = document.getElementById('donutChart').getContext('2d');
  const remain = Math.max(0, budget - spent);
  const data = budget > 0
    ? [spent, remain]
    : [1, 0];

  if (donutChart) donutChart.destroy();
  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: budget > 0 ? [spent, remain] : [0, 1],
        backgroundColor: budget > 0
          ? ['#f472b6', '#e9d5ff']
          : ['#e9d5ff', '#f3e8ff'],
        borderWidth: 0,
        hoverOffset: 4,
      }]
    },
    options: {
      cutout: '70%',
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { animateRotate: true, duration: 800 },
    }
  });
}

function renderCompare() {
  const now  = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const { y: ty, m: tm } = getYM(now);
  const { y: ly, m: lm } = getYM(last);

  const thisTotal = sumAmount(txByMonth(ty, tm));
  const lastTotal = sumAmount(txByMonth(ly, lm));
  const diff      = thisTotal - lastTotal;

  document.getElementById('lastMonthTotal').textContent = fmtMoney(lastTotal);
  document.getElementById('thisMonthTotal').textContent = fmtMoney(thisTotal);

  const diffEl = document.getElementById('diffAmount');
  if (diff > 0) {
    diffEl.textContent = '+' + fmtMoneyShort(diff);
    diffEl.className   = 'text-base font-black text-red-400';
  } else if (diff < 0) {
    diffEl.textContent = '-' + fmtMoneyShort(Math.abs(diff));
    diffEl.className   = 'text-base font-black text-green-500';
  } else {
    diffEl.textContent = '같아요';
    diffEl.className   = 'text-base font-black text-gray-500';
  }

  // Bar chart
  const ctx = document.getElementById('compareChart').getContext('2d');
  if (compareChart) compareChart.destroy();

  const maxVal = Math.max(thisTotal, lastTotal, 1);
  const lastLabel = `${lm}월`;
  const thisLabel = `${tm}월`;

  compareChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [lastLabel, thisLabel],
      datasets: [{
        data: [lastTotal, thisTotal],
        backgroundColor: ['rgba(167,139,250,0.7)', 'rgba(244,114,182,0.7)'],
        borderRadius: 12,
        borderSkipped: false,
        barThickness: 48,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ' ' + fmtMoney(ctx.raw)
          }
        }
      },
      scales: {
        y: {
          display: false,
          max: maxVal * 1.2,
        },
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { font: { family: 'Nunito', weight: 'bold', size: 13 }, color: '#9ca3af' }
        }
      },
      animation: { duration: 800 }
    }
  });
}

// ─── Recent Transactions (Home preview) ───
function renderRecentTx() {
  const el = document.getElementById('recentTxList');
  const recent = [...state.transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  if (!recent.length) {
    el.innerHTML = '<p class="text-center text-gray-300 text-sm py-4">소비 내역이 없어요 🌸</p>';
    return;
  }

  el.innerHTML = recent.map(t => {
    const cat = CATEGORIES[t.category] || CATEGORIES['기타'];
    return `
    <div class="flex items-center gap-3 py-1.5">
      <span class="text-xl w-8 text-center">${cat.emoji}</span>
      <div class="flex-1 min-w-0">
        <p class="font-bold text-gray-700 text-sm truncate">${t.place || t.category}</p>
        <p class="text-xs text-gray-400">${fmtDate(t.date)}</p>
      </div>
      <span class="font-black text-gray-800 text-sm">-${fmtMoney(t.amount)}</span>
    </div>`;
  }).join('');
}

// ─── Mileage Preview ───
function renderMileagePreview() {
  const pts  = state.mileage.points;
  const info = getLevelInfo(pts);
  document.getElementById('charPreview').textContent   = info.char;
  document.getElementById('mileagePreview').textContent = pts.toLocaleString() + ' P';
  document.getElementById('charLevel').textContent     = `Lv.${info.idx + 1} ${info.label}`;
}

// ─── Transaction Log ───
function renderTxLog() {
  const el = document.getElementById('txList');
  let txs = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (currentFilter !== 'all') {
    txs = txs.filter(t => t.category === currentFilter);
  }

  if (!txs.length) {
    el.innerHTML = `
      <div class="text-center py-16">
        <div class="text-6xl mb-3">📋</div>
        <p class="text-gray-400 font-semibold">내역이 없어요!</p>
        <p class="text-gray-300 text-sm mt-1">위 + 추가 버튼을 눌러<br>소비를 기록해봐요 🌸</p>
      </div>`;
    return;
  }

  // Group by date
  const groups = {};
  txs.forEach(t => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });

  const sorted = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

  el.innerHTML = sorted.map(date => {
    const dayTxs   = groups[date];
    const dayTotal = sumAmount(dayTxs);
    const items    = dayTxs.map(t => {
      const cat = CATEGORIES[t.category] || CATEGORIES['기타'];
      return `
      <div class="tx-item flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${cat.cls}" style="background:${cat.color}22">
          ${cat.emoji}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-gray-800 text-sm truncate">${t.place || t.category}</p>
          <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.cls} mt-0.5">${t.category}</span>
        </div>
        <div class="text-right shrink-0">
          <p class="font-black text-gray-800">-${fmtMoney(t.amount)}</p>
          <button onclick="confirmDeleteTx('${t.id}')" class="text-[10px] text-red-300 hover:text-red-500 font-semibold mt-0.5 transition-colors">삭제 🗑️</button>
        </div>
      </div>`;
    }).join('');

    return `
    <div class="glass-card rounded-2xl p-4 shadow-sm">
      <div class="flex justify-between items-center mb-2">
        <p class="text-xs font-bold text-gray-500">${fmtDate(date)}</p>
        <p class="text-xs font-black text-pink-500">-${fmtMoney(dayTotal)}</p>
      </div>
      ${items}
    </div>`;
  }).join('');
}

// ─── Reward / Mileage ───
function renderReward() {
  const pts  = state.mileage.points;
  const info = getLevelInfo(pts);

  document.getElementById('mainChar').textContent  = info.char;
  document.getElementById('mileagePoints').textContent = pts.toLocaleString();

  document.getElementById('levelBadge').textContent  = `Lv.${info.idx + 1} ${info.label}`;

  // Level progress bar
  const nextLevel = LEVELS[Math.min(info.idx + 1, LEVELS.length - 1)];
  const fromPts   = info.min;
  const toPts     = info.idx < LEVELS.length - 1 ? nextLevel.min : info.max;
  const pct       = Math.min(100, Math.round((pts - fromPts) / (toPts - fromPts) * 100)) || 0;

  document.getElementById('levelBar').style.width = pct + '%';
  document.getElementById('levelFrom').textContent = `Lv.${info.idx + 1}`;
  document.getElementById('levelTo').textContent   = `Lv.${Math.min(info.idx + 2, LEVELS.length)}`;

  if (info.idx < LEVELS.length - 1) {
    const need = toPts - pts;
    document.getElementById('nextLevelHint').textContent = `다음 레벨까지 ${need}P`;
  } else {
    document.getElementById('nextLevelHint').textContent = '최고 레벨 달성! 👑';
  }

  // Level guide
  const guideEl = document.getElementById('levelGuide');
  guideEl.innerHTML = LEVELS.map((lv, i) => {
    const active = pts >= lv.min;
    return `
    <div class="flex items-center gap-3 py-2 ${active ? '' : 'opacity-40'}">
      <span class="text-2xl">${lv.char}</span>
      <div class="flex-1">
        <p class="text-sm font-bold text-gray-700">Lv.${i+1} ${lv.label}</p>
        <p class="text-xs text-gray-400">${lv.min.toLocaleString()}P 이상</p>
      </div>
      ${active ? '<span class="text-green-500 font-black text-sm">✓</span>' : '<span class="text-gray-300 text-sm">🔒</span>'}
    </div>`;
  }).join('');

  // Mileage history
  const histEl = document.getElementById('mileageHistory');
  const hist   = [...(state.mileage.history || [])].reverse().slice(0, 10);
  if (!hist.length) {
    histEl.innerHTML = '<p class="text-center text-gray-300 text-sm py-3">아직 적립 내역이 없어요 🌸</p>';
  } else {
    histEl.innerHTML = hist.map(h => `
      <div class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
        <span class="text-xl">🐷</span>
        <div class="flex-1">
          <p class="text-sm font-semibold text-gray-700">${h.msg}</p>
          <p class="text-xs text-gray-400">${h.date}</p>
        </div>
        <span class="font-black text-purple-500">+${h.points}P</span>
      </div>`).join('');
  }
}

// ─── Wishlist ───
function renderWishlist() {
  const el = document.getElementById('wishList');

  if (!state.wishlist.length) {
    el.innerHTML = `
      <div class="text-center py-16">
        <div class="text-6xl mb-3">🛍️</div>
        <p class="text-gray-400 font-semibold">위시리스트가 비어있어요!</p>
        <p class="text-gray-300 text-sm mt-1">사고싶은 물건을 추가해봐요 ✨</p>
      </div>`;
    return;
  }

  const sorted = [...state.wishlist].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

  el.innerHTML = sorted.map(w => {
    const addedAt   = new Date(w.addedAt);
    const readyAt   = new Date(addedAt.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    const now       = new Date();
    const isReady   = now >= readyAt;
    const isDone    = w.status === 'bought' || w.status === 'skipped';
    const daysLeft  = Math.max(0, Math.ceil((readyAt - now) / (1000 * 60 * 60 * 24)));
    const hoursLeft = Math.max(0, Math.ceil((readyAt - now) / (1000 * 60 * 60)));
    const minsLeft  = Math.max(0, Math.ceil((readyAt - now) / (1000 * 60)));

    let timerText = '';
    if (!isReady && !isDone) {
      if (daysLeft > 0) timerText = `⏳ ${daysLeft}일 후 결정 가능`;
      else if (hoursLeft > 0) timerText = `⏳ ${hoursLeft}시간 후 결정 가능`;
      else timerText = `⏳ ${minsLeft}분 후 결정 가능`;
    }

    let statusBadge = '';
    if (w.status === 'bought')  statusBadge = '<span class="text-xs bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">✅ 구매 확정</span>';
    if (w.status === 'skipped') statusBadge = '<span class="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full">🎉 참았다!</span>';

    let actions = '';
    if (!isDone) {
      if (isReady) {
        actions = `
          <div class="flex gap-2 mt-3">
            <button onclick="wishDecide('${w.id}', 'bought')"
              class="flex-1 bg-green-100 text-green-700 font-black text-xs py-2.5 rounded-xl active:scale-95 transition-all border border-green-200">
              ✅ 구매 확정 (소비 등록)
            </button>
            <button onclick="wishDecide('${w.id}', 'skipped')"
              class="flex-1 bg-purple-100 text-purple-700 font-black text-xs py-2.5 rounded-xl active:scale-95 transition-all border border-purple-200">
              🎉 참았다! (+마일리지)
            </button>
          </div>`;
      } else {
        actions = `
          <div class="mt-3">
            <div class="w-full bg-purple-100 rounded-full h-2">
              <div class="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all"
                style="width:${Math.round((now - addedAt) / (readyAt - addedAt) * 100)}%"></div>
            </div>
            <p class="text-xs text-purple-500 font-semibold mt-1.5 text-center countdown-ring" data-id="${w.id}">${timerText}</p>
          </div>`;
      }
    }

    return `
    <div class="glass-card rounded-2xl p-4 shadow-sm ${isDone ? 'wishlist-done' : ''}" id="wish-${w.id}">
      <div class="flex items-start gap-3">
        <span class="text-3xl mt-0.5">🛍️</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-black text-gray-800">${w.name}</p>
            ${statusBadge}
          </div>
          <p class="text-lg font-black text-purple-600 mt-0.5">${fmtMoney(w.price)}</p>
          <p class="text-xs text-gray-400">등록: ${fmtDate(w.addedAt.split('T')[0])}</p>
        </div>
        <button onclick="confirmDeleteWish('${w.id}')" class="text-gray-300 hover:text-red-400 transition-colors p-1">🗑️</button>
      </div>
      ${actions}
    </div>`;
  }).join('');
}

// ───────────────────────────────────────────────
// 7. TAB SWITCHING
// ───────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;

  // Hide all pages
  ['home', 'log', 'reward', 'wish'].forEach(t => {
    document.getElementById(`page-${t}`).classList.add('hidden');
    document.getElementById(`tab-${t}`).classList.remove('active');
  });

  // Show selected
  document.getElementById(`page-${tab}`).classList.remove('hidden');
  document.getElementById(`tab-${tab}`).classList.add('active');

  // Render
  if (tab === 'home')   renderDashboard();
  if (tab === 'log')    renderTxLog();
  if (tab === 'reward') renderReward();
  if (tab === 'wish')   renderWishlist();

  // Restart wishlist timer
  startWishTimer();
}

// ───────────────────────────────────────────────
// 8. BUDGET
// ───────────────────────────────────────────────
function openBudgetModal() {
  document.getElementById('budgetInput').value = state.budget || '';
  document.getElementById('budgetModal').classList.remove('hidden');
}

function closeBudgetModal() {
  document.getElementById('budgetModal').classList.add('hidden');
}

function saveBudget() {
  const val = parseInt(document.getElementById('budgetInput').value, 10);
  if (!val || val <= 0) {
    shakeInput('budgetInput');
    return;
  }
  state.budget = val;
  saveState();
  closeBudgetModal();
  renderDashboard();
  showToast('예산을 설정했어요! 💰', `이번 달 예산: ${fmtMoney(val)}`, '✨');
}

// ───────────────────────────────────────────────
// 9. TRANSACTIONS
// ───────────────────────────────────────────────
function openTxModal(prefillData = null) {
  // Reset
  document.getElementById('txAmount').value = '';
  document.getElementById('txPlace').value  = '';
  document.getElementById('txDate').value   = today();

  // Reset cat selection
  selectedCat = '매점/식비';
  document.querySelectorAll('.cat-select-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.style.borderColor  = 'transparent';
    btn.style.backgroundColor = '#f9fafb';
    if (btn.dataset.cat === selectedCat) {
      btn.classList.add('active');
      btn.style.borderColor = '#fb923c';
      btn.style.backgroundColor = '#ffedd5';
    }
  });

  if (prefillData) {
    document.getElementById('txAmount').value = prefillData.amount;
    document.getElementById('txPlace').value  = prefillData.place;
    selectCatByName(prefillData.category || '기타');
  }

  document.getElementById('txModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('txAmount').focus(), 300);
}

function closeTxModal() {
  document.getElementById('txModal').classList.add('hidden');
}

function addQuick(amount) {
  const cur = parseInt(document.getElementById('txAmount').value, 10) || 0;
  document.getElementById('txAmount').value = cur + amount;
}

function selectCat(btn) {
  selectedCat = btn.dataset.cat;
  document.querySelectorAll('.cat-select-btn').forEach(b => {
    b.classList.remove('active');
    b.style.borderColor     = 'transparent';
    b.style.backgroundColor = '#f9fafb';
  });
  btn.classList.add('active');
  btn.style.borderColor = getCatBorderColor(selectedCat);
  btn.style.backgroundColor = getCatBg(selectedCat);
}

function selectCatByName(catName) {
  const btn = document.querySelector(`.cat-select-btn[data-cat="${catName}"]`);
  if (btn) selectCat(btn);
}

function getCatBorderColor(cat) {
  return { '매점/식비': '#fb923c', '코노/PC방': '#a78bfa', '교통비': '#60a5fa', '쇼핑/뷰티': '#f472b6', '기타': '#34d399' }[cat] || '#f472b6';
}
function getCatBg(cat) {
  return { '매점/식비': '#ffedd5', '코노/PC방': '#ede9fe', '교통비': '#dbeafe', '쇼핑/뷰티': '#fce7f3', '기타': '#d1fae5' }[cat] || '#fce7f3';
}

function saveTx() {
  const amount = parseInt(document.getElementById('txAmount').value, 10);
  const place  = document.getElementById('txPlace').value.trim();
  const date   = document.getElementById('txDate').value;

  if (!amount || amount <= 0) { shakeInput('txAmount'); return; }
  if (!date)                  { shakeInput('txDate');   return; }

  const tx = {
    id:       crypto.randomUUID(),
    amount,
    place:    place || selectedCat,
    category: selectedCat,
    date,
  };

  state.transactions.push(tx);
  saveState();
  closeTxModal();

  // Check mileage vs last month same day
  checkMileage(tx);

  // Refresh
  renderDashboard();
  if (currentTab === 'log') renderTxLog();

  // Check alerts
  const spent = getThisMonthSpent();
  checkAlerts(spent, state.budget);
}

function confirmDeleteTx(id) {
  openConfirm('소비 내역 삭제 🗑️', '이 소비 내역을 삭제할까요?', () => {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveState();
    renderTxLog();
    renderDashboard();
  });
}

function filterCat(cat) {
  currentFilter = cat;
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    if (btn.dataset.cat === cat) {
      btn.classList.add('bg-pink-400', 'text-white');
    } else {
      btn.classList.remove('bg-pink-400', 'text-white');
    }
  });
  renderTxLog();
}

// ───────────────────────────────────────────────
// 10. MILEAGE
// ───────────────────────────────────────────────
function checkMileage(newTx) {
  // Get same day last month
  const txDate   = new Date(newTx.date + 'T00:00:00');
  const lastYear = txDate.getMonth() === 0 ? txDate.getFullYear() - 1 : txDate.getFullYear();
  const lastMon  = txDate.getMonth() === 0 ? 12 : txDate.getMonth();
  const lastDay  = txDate.getDate();
  const lastDate = `${lastYear}-${String(lastMon).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;

  const lastDayTxs   = state.transactions.filter(t => t.date === lastDate && t.id !== newTx.id);
  const lastDaySpent = sumAmount(lastDayTxs);

  // Today's total for same date (excluding new)
  const todayTxs    = state.transactions.filter(t => t.date === newTx.date && t.id !== newTx.id);
  const todayBefore = sumAmount(todayTxs);
  const todayAfter  = todayBefore + newTx.amount;

  if (lastDaySpent > 0 && todayAfter < lastDaySpent) {
    const saved  = lastDaySpent - todayAfter;
    const points = Math.max(1, Math.floor(saved / MILEAGE_RATE));
    state.mileage.points += points;
    state.mileage.history = state.mileage.history || [];
    state.mileage.history.push({
      points,
      msg:  `지난달보다 ${fmtMoneyShort(saved)} 아꼈어요!`,
      date: fmtDate(newTx.date),
    });
    saveState();

    // Toast notification
    showMileageToast(saved, points);
  }
}

function showMileageToast(saved, points) {
  document.getElementById('toastText').textContent = `지난달보다 ${fmtMoneyShort(saved)} 아꼈어요! 🐷`;
  document.getElementById('toastSub').textContent  = '착한 소비 마일리지 획득!';
  document.getElementById('toastPoints').textContent = `+${points}P`;

  const toast = document.getElementById('mileageToast');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 4000);

  // Confetti!
  launchConfetti();
}

function showToast(text, sub, icon = '✨') {
  document.getElementById('toastText').textContent  = text;
  document.getElementById('toastSub').textContent   = sub;
  document.getElementById('toastPoints').textContent = icon;
  const toast = document.getElementById('mileageToast');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ───────────────────────────────────────────────
// 11. ALERTS
// ───────────────────────────────────────────────
function checkAlerts(spent, budget) {
  const banner = document.getElementById('alertBanner');
  const content = document.getElementById('alertContent');

  if (!budget || budget === 0) {
    banner.classList.add('hidden');
    return;
  }

  const lastMonthTotal = getLastMonthTotal();
  const pct = spent / budget * 100;

  if (spent > budget) {
    banner.classList.remove('hidden');
    content.className = 'alert-banner text-white text-center text-sm font-bold py-3 px-4 cursor-pointer';
    content.textContent = '🚨 비상 상황! 이달 예산을 돌파했습니다! 지갑을 닫으세요!';
  } else if (lastMonthTotal > 0 && spent > lastMonthTotal) {
    banner.classList.remove('hidden');
    content.className = 'warn-banner text-white text-center text-sm font-bold py-3 px-4 cursor-pointer';
    content.textContent = '⚠️ 지난달 소비 금액을 돌파했습니다! 조심하세요!';
  } else if (pct >= 80) {
    banner.classList.remove('hidden');
    content.className = 'warn-banner text-white text-center text-sm font-bold py-3 px-4 cursor-pointer';
    content.textContent = `💸 예산의 ${Math.round(pct)}% 사용! 슬슬 지갑을 닫을 시간이에요!`;
  } else {
    banner.classList.add('hidden');
  }
}

function dismissAlert() {
  document.getElementById('alertBanner').classList.add('hidden');
}

// ───────────────────────────────────────────────
// 12. WISHLIST
// ───────────────────────────────────────────────
function openWishModal() {
  document.getElementById('wishName').value  = '';
  document.getElementById('wishPrice').value = '';
  document.getElementById('wishModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('wishName').focus(), 300);
}

function closeWishModal() {
  document.getElementById('wishModal').classList.add('hidden');
}

function saveWish() {
  const name  = document.getElementById('wishName').value.trim();
  const price = parseInt(document.getElementById('wishPrice').value, 10);

  if (!name)           { shakeInput('wishName');  return; }
  if (!price || price <= 0) { shakeInput('wishPrice'); return; }

  state.wishlist.push({
    id:      crypto.randomUUID(),
    name,
    price,
    addedAt: new Date().toISOString(),
    status:  'pending',
  });

  saveState();
  closeWishModal();
  renderWishlist();
  showToast(`${name} 등록 완료! ⏳`, '3일 후에 결정할 수 있어요', '🛒');
}

function wishDecide(id, decision) {
  const item = state.wishlist.find(w => w.id === id);
  if (!item) return;

  if (decision === 'bought') {
    // Add to transactions
    openConfirm('구매 확정 ✅', `${item.name} (${fmtMoney(item.price)})을 소비 내역에 추가할까요?`, () => {
      item.status = 'bought';
      state.transactions.push({
        id:       crypto.randomUUID(),
        amount:   item.price,
        place:    item.name,
        category: '쇼핑/뷰티',
        date:     today(),
      });
      saveState();
      renderWishlist();
      renderDashboard();
      showToast('구매 확정! 🛍️', '소비 내역에 추가됐어요', '✅');
    });
  } else {
    // Skipped = earn mileage!
    item.status = 'skipped';
    const points = Math.max(5, Math.floor(item.price / 200));
    state.mileage.points += points;
    state.mileage.history = state.mileage.history || [];
    state.mileage.history.push({
      points,
      msg:  `위시리스트 참기 성공! (${item.name})`,
      date: fmtDate(today()),
    });
    saveState();
    renderWishlist();
    renderMileagePreview();
    showMileageToast(item.price, points);
    showToast('대단해요! 참는 것도 실력! 🎉', `+${points}P 마일리지 획득!`, '🎉');
  }
}

function confirmDeleteWish(id) {
  openConfirm('위시리스트 삭제 🗑️', '이 항목을 삭제할까요?', () => {
    state.wishlist = state.wishlist.filter(w => w.id !== id);
    saveState();
    renderWishlist();
  });
}

// Live countdown timer for wishlist
function startWishTimer() {
  if (wishTimerInterval) clearInterval(wishTimerInterval);
  if (currentTab !== 'wish') return;

  wishTimerInterval = setInterval(() => {
    const now = new Date();
    document.querySelectorAll('.countdown-ring[data-id]').forEach(el => {
      const id   = el.dataset.id;
      const item = state.wishlist.find(w => w.id === id);
      if (!item) return;
      const addedAt = new Date(item.addedAt);
      const readyAt = new Date(addedAt.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
      if (now >= readyAt) {
        renderWishlist(); // re-render to show buttons
        clearInterval(wishTimerInterval);
        return;
      }
      const ms   = readyAt - now;
      const d    = Math.floor(ms / (1000 * 60 * 60 * 24));
      const h    = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m    = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const s    = Math.floor((ms % (1000 * 60)) / 1000);
      el.textContent = d > 0 ? `⏳ ${d}일 ${h}시간 ${m}분 후 결정 가능` : `⏳ ${h}시간 ${m}분 ${s}초 후 결정 가능`;
    });
  }, 1000);
}

// ───────────────────────────────────────────────
// 13. CONFIRM DIALOG
// ───────────────────────────────────────────────
function openConfirm(title, msg, callback) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent   = msg;
  confirmCallback = callback;
  document.getElementById('confirmDialog').classList.remove('hidden');
}

function closeConfirm() {
  document.getElementById('confirmDialog').classList.add('hidden');
  confirmCallback = null;
}

function confirmAction() {
  if (confirmCallback) confirmCallback();
  closeConfirm();
}

// ───────────────────────────────────────────────
// 14. CONFETTI EFFECT
// ───────────────────────────────────────────────
function launchConfetti() {
  const colors = ['#f472b6', '#a78bfa', '#60a5fa', '#fbbf24', '#34d399'];
  const shapes = ['●', '★', '♦', '■', '▲'];

  for (let i = 0; i < 18; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      el.style.cssText = `
        left: ${Math.random() * 100}%;
        top: -20px;
        color: ${colors[Math.floor(Math.random() * colors.length)]};
        font-size: ${8 + Math.random() * 14}px;
        animation-duration: ${1.5 + Math.random()}s;
        animation-delay: ${Math.random() * 0.5}s;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    }, i * 40);
  }
}

// ───────────────────────────────────────────────
// 15. UTILITIES
// ───────────────────────────────────────────────
function shakeInput(id) {
  const el = document.getElementById(id);
  el.classList.add('animate-wiggle');
  el.style.borderColor = '#ef4444';
  setTimeout(() => {
    el.classList.remove('animate-wiggle');
    el.style.borderColor = '';
  }, 600);
}

// Demo data seed (first launch)
function seedDemoData() {
  if (localStorage.getItem('yongdong_seeded')) return;

  const now   = new Date();
  const y     = now.getFullYear();
  const m     = now.getMonth() + 1;
  const ly    = m === 1 ? y - 1 : y;
  const lm    = m === 1 ? 12 : m - 1;
  const pad   = n => String(n).padStart(2, '0');

  // This month
  const thisMonthTx = [
    { amount: 3500,  place: 'GS25',     category: '매점/식비', date: `${y}-${pad(m)}-${pad(Math.min(5, now.getDate()))}` },
    { amount: 15000, place: '코인노래방',  category: '코노/PC방', date: `${y}-${pad(m)}-${pad(Math.min(8, now.getDate()))}` },
    { amount: 1500,  place: '버스',      category: '교통비',   date: `${y}-${pad(m)}-${pad(Math.min(10, now.getDate()))}` },
    { amount: 25000, place: '다이소',    category: '쇼핑/뷰티', date: `${y}-${pad(m)}-${pad(Math.min(12, now.getDate()))}` },
  ];

  // Last month
  const lastMonthTx = [
    { amount: 5000,  place: 'CU',       category: '매점/식비', date: `${ly}-${pad(lm)}-05` },
    { amount: 20000, place: 'PC방',     category: '코노/PC방', date: `${ly}-${pad(lm)}-08` },
    { amount: 3000,  place: '지하철',   category: '교통비',   date: `${ly}-${pad(lm)}-10` },
    { amount: 30000, place: '올리브영',  category: '쇼핑/뷰티', date: `${ly}-${pad(lm)}-15` },
    { amount: 12000, place: '배달음식',  category: '매점/식비', date: `${ly}-${pad(lm)}-20` },
  ];

  state.budget = 100000;
  state.transactions = [...thisMonthTx, ...lastMonthTx].map(t => ({
    ...t, id: crypto.randomUUID()
  }));
  state.mileage = {
    points: 35,
    history: [
      { points: 20, msg: '지난달보다 1.5만원 아꼈어요!', date: fmtDate(`${y}-${pad(m)}-${pad(Math.min(5, now.getDate()))}`) },
      { points: 15, msg: '지난달보다 5천원 아꼈어요!', date: fmtDate(`${y}-${pad(m)}-${pad(Math.min(10, now.getDate()))}`) },
    ]
  };
  state.wishlist = [
    {
      id:      crypto.randomUUID(),
      name:    '에어팟 프로',
      price:   350000,
      addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      status:  'pending',
    },
    {
      id:      crypto.randomUUID(),
      name:    '나이키 운동화',
      price:   120000,
      addedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago = ready!
      status:  'pending',
    }
  ];

  saveState();
  localStorage.setItem('yongdong_seeded', '1');
}

// ───────────────────────────────────────────────
// 16. PWA SERVICE WORKER
// ───────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ───────────────────────────────────────────────
// 17. INIT
// ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  seedDemoData();
  loadState(); // reload after seed

  renderHeaderDate();
  renderDashboard();

  // Keyboard dismiss
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeBudgetModal();
      closeTxModal();
      closeWishModal();
      closeConfirm();
    }
  });

  // Update date every minute
  setInterval(renderHeaderDate, 60000);
});
