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

// 폭탄 캐릭터 5단계 상태
const PIG_STATES = [
  {
    maxPct: 50,
    bodyColor: '#fce7f3', earColor: '#f9a8d4',
    shadow: 'rgba(244,114,182,0.30)',
    cheekOpacity: 0,
    mouthStyle: { borderRadius: '0 0 12px 12px', borderTop: 'none', borderBottom: '3px solid #1a1a1a', borderColor: '#1a1a1a' },
    eyeColor: '#1a1a1a', showBrows: false,
    sweat1: 0, sweat2: 0, steam: 0,
    animClass: 'pig-anim-bounce',
    label: '행복해요 😊', labelColor: '#be185d',
  },
  {
    maxPct: 70,
    bodyColor: '#ffe0ec', earColor: '#f472b6',
    shadow: 'rgba(244,114,182,0.38)',
    cheekOpacity: 0.25,
    mouthStyle: { borderRadius: '0 0 6px 6px', borderTop: 'none', borderBottom: '3px solid #1a1a1a', borderColor: '#1a1a1a' },
    eyeColor: '#1a1a1a', showBrows: false,
    sweat1: 1, sweat2: 0, steam: 0,
    animClass: 'pig-anim-nervous',
    label: '조금 주의하세요 😅', labelColor: '#f97316',
  },
  {
    maxPct: 85,
    bodyColor: '#fec4a0', earColor: '#fb923c',
    shadow: 'rgba(249,115,22,0.45)',
    cheekOpacity: 0.6,
    mouthStyle: { borderRadius: '6px 6px 0 0', borderTop: '3px solid #1a1a1a', borderBottom: 'none', borderColor: '#1a1a1a', marginTop: '2px' },
    eyeColor: '#7c2d12', showBrows: false,
    sweat1: 1, sweat2: 1, steam: 0,
    animClass: 'pig-anim-shake',
    label: '지갑 닫으세요... 🥵', labelColor: '#ea580c',
  },
  {
    maxPct: 100,
    bodyColor: '#fca5a5', earColor: '#ef4444',
    shadow: 'rgba(239,68,68,0.55)',
    cheekOpacity: 0.85,
    mouthStyle: { borderRadius: '6px 6px 0 0', borderTop: '3px solid #991b1b', borderBottom: 'none', borderColor: '#991b1b', marginTop: '2px' },
    eyeColor: '#991b1b', showBrows: false,
    sweat1: 1, sweat2: 1, steam: 0,
    animClass: 'pig-anim-hot',
    label: '한계에요!! 🔥', labelColor: '#dc2626',
  },
  {
    maxPct: Infinity,
    bodyColor: '#ef4444', earColor: '#b91c1c',
    shadow: 'rgba(185,28,28,0.70)',
    cheekOpacity: 1,
    mouthStyle: { borderRadius: '8px 8px 0 0', borderTop: '3px solid #7f1d1d', borderBottom: 'none', borderColor: '#7f1d1d', marginTop: '2px', width: '22px' },
    eyeColor: '#7f1d1d', showBrows: true,
    sweat1: 1, sweat2: 1, steam: 1,
    animClass: 'pig-anim-angry',
    label: '지갑을 닫아라!!!! 😡', labelColor: '#b91c1c',
  },
];

const GIFT_CARDS = [
  { id: 'gc1', name: '스타벅스 아메리카노', emoji: '☕', brand: 'Starbucks', price: 150, value: '4,500원권', color: '#00704A', bg: '#d4edda' },
  { id: 'gc2', name: '버블티 쿠폰',        emoji: '🧋', brand: '공차',     price: 120, value: '5,000원권', color: '#8B4513', bg: '#fdf0e0' },
  { id: 'gc3', name: '맥도날드 버거',      emoji: '🍔', brand: "McDonald's", price: 200, value: '빅맥 세트', color: '#DA020E', bg: '#fdecea' },
  { id: 'gc4', name: '넥슨 캐시',          emoji: '🎮', brand: 'Nexon',    price: 300, value: '5,000원권', color: '#003087', bg: '#dce8fb' },
  { id: 'gc5', name: '편의점 상품권',      emoji: '🏪', brand: 'CU/GS25',  price: 250, value: '5,000원권', color: '#6d28d9', bg: '#ede9fe' },
  { id: 'gc6', name: '영화관 팝콘',        emoji: '🍿', brand: 'CGV',      price: 180, value: '팝콘 M사이즈', color: '#dc2626', bg: '#fee2e2' },
  { id: 'gc7', name: '배달앱 할인쿠폰',   emoji: '🛵', brand: '배달의민족', price: 400, value: '3,000원 할인', color: '#2563eb', bg: '#dbeafe' },
  { id: 'gc8', name: '올리브영 쿠폰',     emoji: '💄', brand: 'Oliveyoung', price: 500, value: '5,000원 할인', color: '#be185d', bg: '#fce7f3' },
];

// ───────────────────────────────────────────────
// 2. STATE
// ───────────────────────────────────────────────
let state = {
  budget: 0,
  transactions: [],
  mileage: { points: 0, history: [], giftCards: [] },
  wishlist: [],
  timeOffsetDays: 0,  // 시연용 시간 오프셋 (일 단위)
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

// 시연용 시뮬레이션 시간 반환
function getSimulatedDate() {
  return new Date(Date.now() + (state.timeOffsetDays || 0) * 24 * 60 * 60 * 1000);
}

function today() {
  return getSimulatedDate().toISOString().split('T')[0];
}

function getYM(d) {
  const date = d || getSimulatedDate();
  return { y: date.getFullYear(), m: date.getMonth() + 1 };
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

function diffMs(from, to) {
  return new Date(to || getSimulatedDate()) - new Date(from);
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
  const now = getSimulatedDate();
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
  const now  = getSimulatedDate();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dateStr = `${now.getMonth()+1}월 ${now.getDate()}일 (${days[now.getDay()]})`;
  document.getElementById('headerDate').textContent = dateStr;

  // 시연 모드 뱃지
  const badge = document.getElementById('demoBadge');
  const offset = state.timeOffsetDays || 0;
  if (badge) {
    if (offset !== 0) {
      badge.textContent = offset > 0 ? `+${offset}일` : `${offset}일`;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
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
    bar.style.background = 'var(--c-red)';
  } else if (pct >= 80) {
    bar.style.background = 'var(--c-orange)';
  } else {
    bar.style.background = 'var(--c-blue)';
  }

  // Donut chart
  renderDonut(spent, budget);

  // Pig character
  renderPigCharacter(pct);

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
          ? ['#007AFF', 'rgba(120,120,128,0.12)']
          : ['rgba(120,120,128,0.12)', 'rgba(120,120,128,0.06)'],
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
  const now  = getSimulatedDate();
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
    diffEl.style.color = 'var(--c-red)';
  } else if (diff < 0) {
    diffEl.textContent = '-' + fmtMoneyShort(Math.abs(diff));
    diffEl.style.color = 'var(--c-blue)';
  } else {
    diffEl.textContent = '같아요';
    diffEl.style.color = 'var(--c-label3)';
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
        backgroundColor: ['var(--c-fill)', 'var(--c-blue)'],
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
    el.innerHTML = '<p class="text-center py-6 text-[14px]" style="color:var(--c-label3)">소비 내역이 없어요</p>';
    return;
  }

  el.innerHTML = recent.map(t => {
    const cat = CATEGORIES[t.category] || CATEGORIES['기타'];
    return `
    <div class="ios-row gap-3 px-4">
      <span class="text-2xl shrink-0" style="width:32px;text-align:center">${cat.emoji}</span>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-[15px] truncate" style="color:var(--c-label)">${t.place || t.category}</p>
        <p class="text-[12px] mt-0.5" style="color:var(--c-label3)">${fmtDate(t.date)}</p>
      </div>
      <span class="font-semibold text-[15px]" style="color:var(--c-label)">-${fmtMoney(t.amount)}</span>
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

// ─── Pig Character ───
function renderPigCharacter(pct) {
  const pigChar  = document.getElementById('pigChar');
  const pigBody  = document.getElementById('pigBody');
  const pigEarL  = document.getElementById('pigEarL');
  const pigEarR  = document.getElementById('pigEarR');
  const pigCheekL = document.getElementById('pigCheekL');
  const pigCheekR = document.getElementById('pigCheekR');
  const pigBrows  = document.getElementById('pigBrows');
  const pigEyeL   = document.getElementById('pigEyeL');
  const pigEyeR   = document.getElementById('pigEyeR');
  const pigMouth  = document.getElementById('pigMouth');
  const pigSweat1 = document.getElementById('pigSweat1');
  const pigSweat2 = document.getElementById('pigSweat2');
  const pigSteam  = document.getElementById('pigSteam');
  const pigLabel  = document.getElementById('pigLabel');
  if (!pigChar) return;

  // Pick state
  const s = PIG_STATES.find(st => pct < st.maxPct) || PIG_STATES[PIG_STATES.length - 1];

  // Body + ears color
  pigBody.style.backgroundColor = s.bodyColor;
  pigBody.style.boxShadow = `0 6px 24px ${s.shadow}, inset 0 -3px 8px rgba(0,0,0,0.06)`;
  pigEarL.style.backgroundColor = s.earColor;
  pigEarR.style.backgroundColor = s.earColor;

  // Cheek blush
  pigCheekL.style.opacity = s.cheekOpacity;
  pigCheekR.style.opacity = s.cheekOpacity;

  // Angry brows
  pigBrows.style.display = s.showBrows ? 'flex' : 'none';

  // Eyes color
  pigEyeL.style.backgroundColor = s.eyeColor;
  pigEyeR.style.backgroundColor = s.eyeColor;
  // Angry: slightly squinted
  const eyeScale = s.showBrows ? 'scaleY(0.7)' : 'none';
  pigEyeL.style.transform = eyeScale;
  pigEyeR.style.transform = eyeScale;

  // Mouth shape
  Object.assign(pigMouth.style, {
    borderRadius:   '',
    borderTop:      '',
    borderBottom:   '',
    borderColor:    '',
    marginTop:      '',
    width:          '',
    ...s.mouthStyle
  });

  // Sweat / steam — toggle .visible class (animation only runs when visible)
  pigSweat1.classList.toggle('visible', s.sweat1 === 1);
  pigSweat2.classList.toggle('visible', s.sweat2 === 1);
  pigSteam.classList.toggle('visible',  s.steam  === 1);

  // Animation class
  pigChar.className = `pig-wrap ${s.animClass}`;

  // Label
  if (pigLabel) {
    pigLabel.textContent = s.label;
    pigLabel.style.color = s.labelColor;
  }
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
        <p class="text-[17px] font-semibold" style="color:var(--c-label3)">기록이 없어요</p>
        <p class="text-[14px] mt-1" style="color:var(--c-label3)">+ 추가를 눌러 소비를 기록해봐요</p>
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
      <div class="ios-row px-0 gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${cat.cls}">
          ${cat.emoji}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-[16px] truncate" style="color:var(--c-label)">${t.place || t.category}</p>
          <span class="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${cat.cls} mt-1">${t.category}</span>
        </div>
        <div class="text-right shrink-0">
          <p class="font-semibold text-[16px]" style="color:var(--c-label)">-${fmtMoney(t.amount)}</p>
          <button onclick="confirmDeleteTx('${t.id}')" class="text-[12px] font-semibold mt-1" style="color:var(--c-red)">삭제</button>
        </div>
      </div>`;
    }).join('');

    return `
    <div class="mb-5">
      <div class="flex justify-between items-center mb-1.5 px-1">
        <p class="ios-section-label mb-0 border-0" style="padding-bottom:0">${fmtDate(date)}</p>
        <p class="text-[13px] font-semibold" style="color:var(--c-blue)">-${fmtMoney(dayTotal)}</p>
      </div>
      <div class="ios-card px-4 py-1">
        ${items}
      </div>
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

  // Gift card store
  renderGiftCardStore(pts);

  // Owned gift cards
  renderOwnedGiftCards();

  // Level guide
  const guideEl = document.getElementById('levelGuide');
  guideEl.innerHTML = LEVELS.map((lv, i) => {
    const active = pts >= lv.min;
    return `
    <div class="ios-row gap-3 ${active ? '' : 'opacity-40'} px-4">
      <span class="text-3xl">${lv.char}</span>
      <div class="flex-1">
        <p class="text-[15px] font-semibold" style="color:var(--c-label)">Lv.${i+1} ${lv.label}</p>
        <p class="text-[12px] mt-0.5" style="color:var(--c-label3)">${lv.min.toLocaleString()}P 이상</p>
      </div>
      ${active ? '<span class="text-[15px] font-bold" style="color:var(--c-green)">✓</span>' : '<span class="text-[15px]" style="color:var(--c-label3)">🔒</span>'}
    </div>`;
  }).join('');

  // Mileage history
  const histEl = document.getElementById('mileageHistory');
  const hist   = [...(state.mileage.history || [])].reverse().slice(0, 10);
  if (!hist.length) {
    histEl.innerHTML = '<p class="text-center py-6 text-[14px]" style="color:var(--c-label3)">아직 적립 내역이 없어요</p>';
  } else {
    histEl.innerHTML = hist.map(h => `
      <div class="ios-row gap-3 px-4">
        <span class="text-2xl">${h.type === 'spend' ? '🎁' : '🐷'}</span>
        <div class="flex-1">
          <p class="text-[15px] font-semibold" style="color:var(--c-label)">${h.msg}</p>
          <p class="text-[12px] mt-0.5" style="color:var(--c-label3)">${h.date}</p>
        </div>
        <span class="font-semibold text-[15px]" style="color:${h.type === 'spend' ? 'var(--c-red)' : 'var(--c-blue)'}">${h.type === 'spend' ? '-' : '+'}${h.points}P</span>
      </div>`).join('');
  }
}

function renderGiftCardStore(pts) {
  const el = document.getElementById('giftCardStore');
  if (!el) return;

  // Sync badge
  const badge = document.getElementById('storePointsBadge');
  if (badge) badge.textContent = pts.toLocaleString();

  el.innerHTML = GIFT_CARDS.map(gc => {
    const canBuy = pts >= gc.price;
    return `
    <div class="ios-row gap-3 px-4 py-3">
      <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style="background:${gc.bg}">${gc.emoji}</div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-[15px]" style="color:var(--c-label)">${gc.name}</p>
        <p class="text-[12px] mt-0.5" style="color:var(--c-label3)">${gc.brand} · ${gc.value}</p>
        <p class="text-[13px] font-bold mt-1" style="color:${gc.color}">${gc.price}P</p>
      </div>
      <button onclick="buyGiftCard('${gc.id}')"
        class="shrink-0 text-[13px] font-semibold px-3 py-1.5 rounded-full transition-opacity active:opacity-60"
        style="${canBuy ? 'background:var(--c-blue);color:#fff' : 'background:var(--c-fill);color:var(--c-label3)'}">
        ${canBuy ? '교환' : '부족'}
      </button>
    </div>`;
  }).join('');
}

function renderOwnedGiftCards() {
  const el   = document.getElementById('ownedGiftCards');
  const wrap = document.getElementById('ownedGiftCardsWrap');
  if (!el || !wrap) return;

  const owned = (state.mileage.giftCards || []).slice().reverse();
  if (!owned.length) {
    el.innerHTML = '<p class="text-center py-6 text-[14px]" style="color:var(--c-label3)">교환한 기프티콘이 없어요</p>';
    wrap.classList.remove('hidden');
    return;
  }

  wrap.classList.remove('hidden');
  el.innerHTML = owned.map(item => {
    const gc = GIFT_CARDS.find(g => g.id === item.gcId) || {};
    return `
    <div class="ios-row gap-3 px-4">
      <span class="text-3xl">${gc.emoji || '🎁'}</span>
      <div class="flex-1">
        <p class="text-[15px] font-semibold" style="color:var(--c-label)">${item.name}</p>
        <p class="text-[12px] mt-0.5" style="color:var(--c-label3)">${item.date}</p>
      </div>
      <span class="text-[12px] font-bold px-2.5 py-1 rounded-full" style="background:rgba(52,199,89,0.15);color:var(--c-green)">보유중 ✓</span>
    </div>`;
  }).join('');
}

function buyGiftCard(gcId) {
  const gc = GIFT_CARDS.find(g => g.id === gcId);
  if (!gc) return;
  const pts = state.mileage.points;
  if (pts < gc.price) {
    showToast('포인트가 부족해요 😢', `${gc.price - pts}P 더 모아야 해요!`, '💸');
    return;
  }
  openConfirm(
    `${gc.emoji} ${gc.name} 교환`,
    `${gc.price}P를 사용해서 ${gc.name} (${gc.value})을 교환할까요?`,
    () => {
      state.mileage.points -= gc.price;
      state.mileage.giftCards = state.mileage.giftCards || [];
      state.mileage.giftCards.push({
        gcId:  gc.id,
        name:  gc.name,
        value: gc.value,
        date:  fmtDate(today()),
      });
      state.mileage.history = state.mileage.history || [];
      state.mileage.history.push({
        type:   'spend',
        points: gc.price,
        msg:    `${gc.name} 교환!`,
        date:   fmtDate(today()),
      });
      saveState();
      renderReward();
      renderMileagePreview();
      launchConfetti();
      showToast(`${gc.name} 교환 완료! 🎉`, `${gc.value} 기프티콘이 생겼어요!`, gc.emoji);
    }
  );
}

// ─── Wishlist ───
function renderWishlist() {
  const el = document.getElementById('wishList');

  if (!state.wishlist.length) {
    el.innerHTML = `
      <div class="text-center py-16">
        <p class="text-[17px] font-semibold" style="color:var(--c-label3)">위시리스트가 비어있어요</p>
        <p class="text-[14px] mt-1" style="color:var(--c-label3)">+ 추가를 눌러 담아봐요 ✨</p>
      </div>`;
    return;
  }

  const sorted = [...state.wishlist].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

  el.innerHTML = sorted.map(w => {
    const addedAt   = new Date(w.addedAt);
    const readyAt   = new Date(addedAt.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    const now       = getSimulatedDate();
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
    if (w.status === 'bought')  statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full" style="background:rgba(52,199,89,0.15);color:var(--c-green)">✅ 구매 확정</span>';
    if (w.status === 'skipped') statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full" style="background:rgba(142,142,147,0.15);color:var(--c-label3)">🎉 참았다!</span>';

    let actions = '';
    if (!isDone) {
      if (isReady) {
        actions = `
          <div class="flex gap-2 mt-3 pt-3" style="border-top:0.5px solid var(--c-sep)">
            <button onclick="wishDecide('${w.id}', 'bought')"
              class="flex-1 text-[13px] font-semibold py-2 rounded-xl active:opacity-60" style="background:rgba(52,199,89,0.15);color:var(--c-green)">
              ✅ 구매 확정
            </button>
            <button onclick="wishDecide('${w.id}', 'skipped')"
              class="flex-1 text-[13px] font-semibold py-2 rounded-xl active:opacity-60" style="background:var(--c-fill);color:var(--c-blue)">
              🎉 참았다!
            </button>
          </div>`;
      } else {
        actions = `
          <div class="mt-3 pt-3" style="border-top:0.5px solid var(--c-sep)">
            <div class="w-full rounded-full h-1.5" style="background:var(--c-fill)">
              <div class="h-full rounded-full transition-all"
                style="width:${Math.round((now - addedAt) / (readyAt - addedAt) * 100)}%;background:var(--c-blue)"></div>
            </div>
            <p class="text-[12px] font-semibold mt-1.5 text-center countdown-ring" style="color:var(--c-blue)" data-id="${w.id}">${timerText}</p>
          </div>`;
      }
    }

    return `
    <div class="ios-card p-4 mb-4 shadow-sm ${isDone ? 'wishlist-done' : ''}" id="wish-${w.id}">
      <div class="flex items-start gap-3">
        <span class="text-3xl mt-0.5 shrink-0">🛍️</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <p class="font-semibold text-[16px]" style="color:var(--c-label)">${w.name}</p>
            ${statusBadge}
          </div>
          <p class="text-[18px] font-bold" style="color:var(--c-label)">${fmtMoney(w.price)}</p>
          <p class="text-[11px] mt-1" style="color:var(--c-label3)">등록: ${fmtDate(w.addedAt.split('T')[0])}</p>
        </div>
        <button onclick="confirmDeleteWish('${w.id}')" class="text-[15px] p-1 active:opacity-60" style="color:var(--c-label3)">삭제</button>
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
    addedAt: getSimulatedDate().toISOString(),
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
    const now = getSimulatedDate();
    document.querySelectorAll('.countdown-ring[data-id]').forEach(el => {
      const id   = el.dataset.id;
      const item = state.wishlist.find(w => w.id === id);
      if (!item) return;
      const addedAt = new Date(item.addedAt);
      const readyAt = new Date(addedAt.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
      if (now >= readyAt) {
        renderWishlist();
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

  const now   = getSimulatedDate();
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
    points: 175,
    giftCards: [],
    history: [
      { points: 20, msg: '지난달보다 1.5만원 아꼈어요!', date: fmtDate(`${y}-${pad(m)}-${pad(Math.min(5, now.getDate()))}`) },
      { points: 15, msg: '지난달보다 5천원 아꼈어요!', date: fmtDate(`${y}-${pad(m)}-${pad(Math.min(10, now.getDate()))}`) },
      { points: 140, msg: '위시리스트 참기 성공! (나이키 에어포스)', date: fmtDate(`${y}-${pad(m)}-${pad(Math.min(12, now.getDate()))}`) },
    ]
  };
  state.wishlist = [
    {
      id:      crypto.randomUUID(),
      name:    '에어팟 프로',
      price:   350000,
      addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status:  'pending',
    },
    {
      id:      crypto.randomUUID(),
      name:    '나이키 운동화',
      price:   120000,
      addedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      status:  'pending',
    }
  ];

  saveState();
  localStorage.setItem('yongdong_seeded', '1');
}

// ───────────────────────────────────────────────
// 16-A. TIME CONTROL (시연 모드)
// ───────────────────────────────────────────────
function openTimePanel() {
  document.getElementById('timePanel').classList.remove('hidden');
  updateTimePanelDisplay();
}

function closeTimePanel() {
  document.getElementById('timePanel').classList.add('hidden');
}

function updateTimePanelDisplay() {
  const sim = getSimulatedDate();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const el = document.getElementById('simDateDisplay');
  if (el) el.textContent = `${sim.getFullYear()}년 ${sim.getMonth()+1}월 ${sim.getDate()}일 (${days[sim.getDay()]})`;

  const offsetEl = document.getElementById('offsetDisplay');
  const off = state.timeOffsetDays || 0;
  if (offsetEl) {
    offsetEl.textContent = off === 0 ? '현재 시간' : (off > 0 ? `+${off}일 후` : `${off}일 전`);
    offsetEl.className = off === 0
      ? 'text-sm font-black text-gray-500'
      : 'text-sm font-black text-purple-600';
  }
}

function shiftTime(days) {
  state.timeOffsetDays = (state.timeOffsetDays || 0) + days;
  saveState();
  updateTimePanelDisplay();
  renderHeaderDate();
  if (currentTab === 'home')   renderDashboard();
  if (currentTab === 'log')    renderTxLog();
  if (currentTab === 'reward') renderReward();
  if (currentTab === 'wish')   renderWishlist();
}

function resetTime() {
  state.timeOffsetDays = 0;
  saveState();
  updateTimePanelDisplay();
  renderHeaderDate();
  if (currentTab === 'home')   renderDashboard();
  if (currentTab === 'log')    renderTxLog();
  if (currentTab === 'reward') renderReward();
  if (currentTab === 'wish')   renderWishlist();
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
      closeTimePanel();
    }
  });

  // Update date every minute
  setInterval(renderHeaderDate, 60000);
});
