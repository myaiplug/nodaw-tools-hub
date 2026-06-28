const subs = new Map();

export const bus = {
  on(event, fn) {
    if (!subs.has(event)) subs.set(event, new Set());
    subs.get(event).add(fn);
    return () => subs.get(event).delete(fn);
  },
  emit(event, payload) {
    const set = subs.get(event);
    if (!set) return;
    for (const fn of set) {
      try { fn(payload); } catch (e) { console.error(`[bus:${event}]`, e); }
    }
  },
  clear(event) {
    if (event) subs.delete(event);
    else subs.clear();
  },
};
