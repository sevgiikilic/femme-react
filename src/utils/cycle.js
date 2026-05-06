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
    days: '1—5',
    color: 'var(--jazz-red)',
    desc: 'Adet günleri. Östrojen ve progesteron en düşük seviyede; vücut yenileniyor. Enerji düşük, içe dönüklük artar.',
    symptoms: ['Karın krampları','Bel ağrısı','Yorgunluk','Baş ağrısı','Şişkinlik','Hassasiyet','Düşük enerji','Uyku ihtiyacı','Hassas göğüsler'],
    food:    ['Demir açısından zengin (kırmızı et, koyu yeşillikler)', 'Magnezyum (kabak çekirdeği, koyu çikolata)', 'Sıcak çorbalar', 'Zencefil & papatya çayı'],
    foodBad: ['Kafein (krampları artırır)', 'Çok tuzlu yiyecekler', 'Alkol', 'Aşırı şeker'],
    fitness: ['Yürüyüş', 'Hafif yoga', 'Esneme & restorative pozlar', 'Gerekirse dinlenme'],
    skin:    ['Yatıştırıcı rutin. Aktifleri azalt.', 'Hidrasyon ve bariyer odaklı.', 'Niyasinamid + panthenol'],
    skinFocus: { am: ['Temizleyici','Nemlendirici','SPF'], pm: ['Temizleyici','Nemlendirici'] },
    skinNote: 'Yatıştırıcı, basit rutin. Aktiflerden uzak dur.',
    actives: ['niyasinamid','centella','panthenol','hyalüronik','seramid'],
  },
  follicular: {
    name: 'Foliküler',
    days: '6—13',
    color: 'var(--moon-pink)',
    desc: 'Östrojen yükseliyor. Enerji, motivasyon ve cilt parlaklığı artıyor. Yeni şeyler denemek için ideal dönem.',
    symptoms: ['Yüksek enerji','İyi ruh hali','Net düşünme','Artmış motivasyon','Cilt parlaklığı','Yaratıcılık'],
    food:    ['Probiyotikler (yoğurt, kefir)', 'Çimlendirilmiş tahıllar', 'Hafif proteinler (somon)', 'Bol yeşillik'],
    foodBad: ['Aşırı işlenmiş gıda', 'Trans yağlar'],
    fitness: ['HIIT', 'Güç antrenmanı', 'Koşu', 'Yeni dersler dene', 'Headstand denemeleri'],
    skin:    ['Aktifler için iyi dönem.', 'C vitamini serumu ekleyebilirsin.', 'Eksfolian uygulayabilirsin.'],
    skinFocus: { am: ['Temizleyici','Serum','Nemlendirici','SPF'], pm: ['Temizleyici','Eksfoliant','Serum','Nemlendirici'] },
    skinNote: 'Cilt en toleranslı dönem. Aktifleri kademeli artırabilirsin.',
    actives: ['c vitamini','retinol','aha','bha','peptit'],
  },
  ovulation: {
    name: 'Ovulasyon',
    days: '14',
    color: 'var(--gold)',
    desc: 'Östrojen tepe noktada. Kendini en iyi hissettiğin gün. Sosyallik ve özgüven yüksek.',
    symptoms: ['Cinsel istek artışı','Hafif tek taraflı karın ağrısı','Cilt en iyi halinde','Yüksek özgüven','Hafif şişkinlik','Beyaz akıntı artışı'],
    food:    ['Antioksidanlar (yaban mersini, böğürtlen)', 'Brokoli & karnabahar', 'Lif', 'Bol su'],
    foodBad: ['Aşırı sodyum', 'Alkol'],
    fitness: ['Yüksek yoğunluk', 'Grup dersi', 'Power yoga', 'En zorlu antrenman için ideal'],
    skin:    ['Cilt parlak ve dengeli.', 'Antioksidanlar ışıltıyı destekler.', 'C vitamini + peptit'],
    skinFocus: { am: ['Temizleyici','Serum','Nemlendirici','SPF'], pm: ['Temizleyici','Serum','Nemlendirici'] },
    skinNote: 'Cilt parlak ve dengeli. Antioksidanlar ışıltıyı destekler.',
    actives: ['c vitamini','peptit','antioksidan','niyasinamid'],
  },
  luteal: {
    name: 'Luteal',
    days: '15—28',
    color: 'var(--moon-lilac)',
    desc: 'Progesteron yükselir sonra düşer. Şişkinlik, ruh hali dalgalanmaları başlayabilir. Kendine yumuşak ol.',
    symptoms: ['Şişkinlik','Sivilceler','Göğüs hassasiyeti','Sinirlilik','Tatlı krizleri','Tuzlu krizleri','Düşük motivasyon','Anksiyete','Uyku problemi','Su retansiyonu','Konsantrasyon güçlüğü','Gece terlemesi'],
    food:    ['B6 (muz, balık)', 'Kompleks karbonhidrat (tatlı patates)', 'Magnezyum (badem, koyu çikolata)', 'Papatya & rezene çayı'],
    foodBad: ['Beyaz şeker', 'Tuzlu cipsler', 'Kafein', 'Alkol'],
    fitness: ['Pilates', 'Hafif kardio', 'Yoga', 'Yürüyüş', 'Yoğunluğu hafifle'],
    skin:    ['Sebum artar. BHA faydalı.', 'Niyasinamid + çinko önerilir.', 'Spot tedavisi uygula.'],
    skinFocus: { am: ['Temizleyici','Niyasinamid','Nemlendirici','SPF'], pm: ['Temizleyici','BHA / Spot Tedavi','Yatıştırıcı','Nemlendirici'] },
    skinNote: 'Sebum artar, sivilce riski yüksek. BHA ve niyasinamid faydalı.',
    actives: ['salisilik','bha','niyasinamid','centella','çinko'],
  },
};
