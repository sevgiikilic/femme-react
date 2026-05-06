// ── date helpers ──────────────────────────────────────
export const ymd = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
export const fromYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => ymd(new Date());
export const daysBetween = (a, b) => Math.round((fromYmd(b) - fromYmd(a)) / 86400000);
export const addDays = (s, n) => { const d = fromYmd(s); d.setDate(d.getDate() + n); return ymd(d); };

const TR_MONTHS_SHORT = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const TR_MONTHS_LONG  = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TR_DAYS         = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

export const formatShort = (s) => { const d = fromYmd(s); return `${d.getDate()} ${TR_MONTHS_SHORT[d.getMonth()]}`; };
export const formatLong  = (s) => { const d = fromYmd(s); return `${TR_DAYS[d.getDay()]}, ${d.getDate()} ${TR_MONTHS_LONG[d.getMonth()]}`; };

// ── cycle calculation ─────────────────────────────────
function getAvgCycleLength(state) {
  const ps = [...state.periods].sort((a, b) => a.start.localeCompare(b.start));
  if (ps.length < 2) return state.avgCycle;
  const diffs = [];
  for (let i = 1; i < ps.length; i++) diffs.push(daysBetween(ps[i - 1].start, ps[i].start));
  const w = diffs.map((_, i) => i + 1);
  const sumW = w.reduce((a, b) => a + b, 0);
  return Math.round(diffs.reduce((s, d, i) => s + d * w[i], 0) / sumW);
}

function getAvgPeriodLength(state) {
  if (!state.periods.length) return state.avgPeriod;
  return Math.round(state.periods.reduce((s, p) => s + (p.length || state.avgPeriod), 0) / state.periods.length);
}

export function cycleInfo(state, forDate = today()) {
  if (!state.periods.length) return null;
  const last = [...state.periods].sort((a, b) => b.start.localeCompare(a.start))[0].start;
  const avgC = getAvgCycleLength(state);
  const avgP = getAvgPeriodLength(state);

  let cyclesAhead = Math.floor(daysBetween(last, forDate) / avgC);
  let cycleStart  = addDays(last, cyclesAhead * avgC);
  let dayInCycle  = daysBetween(cycleStart, forDate) + 1;
  if (dayInCycle > avgC) { cycleStart = addDays(cycleStart, avgC); dayInCycle = daysBetween(cycleStart, forDate) + 1; }

  const ovuDay = avgC - 14;
  let phaseKey;
  if (dayInCycle <= avgP)          phaseKey = 'menstrual';
  else if (dayInCycle <= ovuDay - 1) phaseKey = 'follicular';
  else if (dayInCycle <= ovuDay + 1) phaseKey = 'ovulation';
  else                               phaseKey = 'luteal';

  return {
    cycleStart, dayInCycle, avgC, avgP, phaseKey,
    nextPeriod:  addDays(cycleStart, avgC),
    ovulation:   addDays(cycleStart, ovuDay - 1),
    fertileStart: addDays(cycleStart, ovuDay - 5),
    fertileEnd:  addDays(cycleStart, ovuDay),
  };
}

// ── phase content ─────────────────────────────────────
export const PHASES = {
  menstrual: {
    name: 'Menstrüel',
    color: 'var(--jazz-red)',
    desc: 'Adet günleri. Östrojen ve progesteron en düşük seviyede; vücut yenileniyor. Enerji düşük, içe dönüklük artar.',
    food:    ['Demir açısından zengin (kırmızı et, koyu yeşillikler)', 'Magnezyum (kabak çekirdeği, koyu çikolata)', 'Sıcak çorbalar', 'Zencefil & papatya çayı'],
    fitness: ['Yürüyüş', 'Hafif yoga', 'Esneme & restorative pozlar', 'Gerekirse dinlenme'],
    skin:    ['Yatıştırıcı rutin. Aktifleri azalt.', 'Hidrasyon ve bariyer odaklı.', 'Niyasinamid + panthenol'],
  },
  follicular: {
    name: 'Foliküler',
    color: 'var(--moon-pink)',
    desc: 'Östrojen yükseliyor. Enerji, motivasyon ve cilt parlaklığı artıyor. Yeni şeyler denemek için ideal dönem.',
    food:    ['Probiyotikler (yoğurt, kefir)', 'Çimlendirilmiş tahıllar', 'Hafif proteinler (somon)', 'Bol yeşillik'],
    fitness: ['HIIT', 'Güç antrenmanı', 'Koşu', 'Yeni dersler dene'],
    skin:    ['Aktifler için iyi dönem.', 'C vitamini serumu ekleyebilirsin.', 'Eksfolian uygulayabilirsin.'],
  },
  ovulation: {
    name: 'Ovulasyon',
    color: 'var(--gold)',
    desc: 'Östrojen tepe noktada. Kendini en iyi hissettiğin gün. Sosyallik ve özgüven yüksek.',
    food:    ['Antioksidanlar (yaban mersini, böğürtlen)', 'Brokoli & karnabahar', 'Lif', 'Bol su'],
    fitness: ['Yüksek yoğunluk', 'Grup dersi', 'Power yoga', 'En zorlu antrenman için ideal'],
    skin:    ['Cilt parlak ve dengeli.', 'Antioksidanlar ışıltıyı destekler.', 'C vitamini + peptit'],
  },
  luteal: {
    name: 'Luteal',
    color: 'var(--moon-lilac)',
    desc: 'Progesteron yükselir sonra düşer. Şişkinlik, ruh hali dalgalanmaları başlayabilir. Kendine yumuşak ol.',
    food:    ['B6 (muz, balık)', 'Kompleks karbonhidrat (tatlı patates, yulaf)', 'Magnezyum (badem, koyu çikolata)', 'Papatya & rezene çayı'],
    fitness: ['Pilates', 'Hafif kardio', 'Yoga', 'Yürüyüş', 'Yoğunluğu hafifle'],
    skin:    ['Sebum artar. BHA faydalı.', 'Niyasinamid + çinko önerilir.', 'Spot tedavisi uygula.'],
  },
};
