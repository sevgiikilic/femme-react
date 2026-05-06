import { cycleInfo, today, PHASES } from '../utils/cycle';

export const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://femme-ai.swq-bms.workers.dev';

export async function aiCall(body, aiUrl) {
  const url = aiUrl || WORKER_URL;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
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
