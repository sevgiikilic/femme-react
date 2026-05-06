import { useState, useCallback } from 'react';

const KEY = 'femme_v3';

const DEFAULT = {
  setup: false,
  avgCycle: 28,
  avgPeriod: 5,
  periods: [],
  days: {},
  body: [],
  foods: [],
  products: [],
  meals: [],
  workouts: [],
  customSymptoms: [],
  chat: [],
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function useAppState() {
  const [state, setState] = useState(load);

  const save = useCallback((next) => {
    localStorage.setItem(KEY, JSON.stringify(next));
    setState(next);
  }, []);

  const update = useCallback((patch) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { state, update, save };
}
