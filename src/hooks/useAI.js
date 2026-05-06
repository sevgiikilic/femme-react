import { cycleInfo, today, PHASES } from '../utils/cycle';

export const WORKER_URL = 'https://femme-ai.swq-bms.workers.dev';

// Reject http:// URLs when page is https (mixed content) and catch obviously wrong URLs
function resolveUrl(aiUrl) {
  if (!aiUrl || typeof aiUrl !== 'string') return WORKER_URL;
  const trimmed = aiUrl.trim();
  if (!trimmed) return WORKER_URL;
  // Block mixed content (https page → http url)
  if (trimmed.startsWith('http://')) return WORKER_URL;
  // Must look like a valid URL
  if (!trimmed.startsWith('https://')) return WORKER_URL;
  return trimmed;
}

export async function aiCall(body, aiUrl) {
  const url = resolveUrl(aiUrl);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function getEffectiveUrl(aiUrl) {
  return resolveUrl(aiUrl);
}

export function buildContext(state) {
  const ci = cycleInfo(state);
  const log = state.days[today()] || {};
  const lastBody = [...state.body].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
  return {
    cycle: ci ? { day: ci.dayInCycle, phase: PHASES[ci.phaseKey].name, avgCycle: ci.avgC } : null,
    today: { mood: log.mood, energy: log.energy, symptoms: log.symptoms, skinStates: log.skinStates },
    body: lastBody ? { weight: lastBody.weight, bloat: lastBody.bloat } : null,
    foodLove:  state.foods.filter(f => f.pref === 'love').map(f => f.name),
    foodSkip:  state.foods.filter(f => f.pref === 'skip').map(f => f.name),
    foodReact: state.foods.filter(f => f.pref === 'react' || (f.issues && f.issues.length)).map(f => ({ name: f.name, issues: f.issues })),
  };
}
