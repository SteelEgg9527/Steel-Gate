'use strict';

const L = require('./_supabase');

const DIFF_WEIGHT = { easy: 0.8, normal: 1.0, hard: 1.25, endless: 1.5 };
const SELECT = [
  'run_id', 'player_id', 'nickname', 'mode', 'difficulty', 'map_id', 'result',
  'score', 'yellow_xp', 'kills', 'losses', 'duration_sec', 'wave', 'hold_sec',
  'ships_sunk', 'boss_kills', 'created_at'
].join(',');

module.exports = async function handler(req, res) {
  L.cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return L.json(res, 405, { ok: false, error: 'method_not_allowed' });
  if (!L.enabled()) return L.json(res, 503, { ok: false, error: 'backend_not_configured' });

  const q = req.query || {};
  const scope = L.text(q.scope, 16) === 'overall' ? 'overall' : 'mode';
  const requested = L.int(q.limit, 100);
  const limit = Math.max(1, Math.min(200, requested || 100));
  const playerId = L.text(q.playerId, 80);

  if (scope === 'overall') {
    const path = L.TABLE + '?select=' + encodeURIComponent(SELECT) +
      '&order=' + encodeURIComponent('created_at.desc') +
      '&limit=' + Math.max(limit, 100);
    let rows;
    try {
      rows = await L.sb(path, { method: 'GET' });
    } catch (e) {
      console.error('overall query failed', e.status, e.body);
      return L.json(res, 500, { ok: false, error: 'query_failed' });
    }
    const entries = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const weight = DIFF_WEIGHT[r.difficulty] || 1;
      const out = L.rowOf(r);
      out.difficultyWeight = weight;
      out.points = Math.round((r.score || 0) * weight);
      out.score = r.score || 0;
      out.wave = r.wave || 0;
      out.holdSec = r.hold_sec || 0;
      entries.push(out);
    }
    entries.sort(function (a, b) {
      return (b.points - a.points) || (b.score - a.score) ||
        (b.difficultyWeight - a.difficultyWeight) ||
        String(b.createdAt).localeCompare(String(a.createdAt));
    });
    for (let k = 0; k < entries.length; k++) entries[k].rank = k + 1;
    let myRank = null;
    if (playerId) {
      for (let k = 0; k < entries.length; k++) {
        if (entries[k].playerId === playerId) { myRank = entries[k].rank; break; }
      }
    }
    return L.json(res, 200, {
      ok: true, scope: 'overall',
      entries: entries.slice(0, limit),
      myRank: myRank
    });
  }

  const mode = L.text(q.mode, 24);
  const difficulty = L.text(q.difficulty, 16);
  if (!L.validMode(mode)) return L.json(res, 400, { ok: false, error: 'invalid_mode' });
  if (!L.validDifficulty(difficulty)) return L.json(res, 400, { ok: false, error: 'invalid_difficulty' });

  const path = L.TABLE + '?select=' + encodeURIComponent(SELECT) +
    '&mode=eq.' + encodeURIComponent(mode) +
    '&difficulty=eq.' + encodeURIComponent(difficulty) +
    '&order=' + encodeURIComponent('created_at.desc') +
    '&limit=' + Math.max(limit, 100);

  let rows;
  try {
    rows = await L.sb(path, { method: 'GET' });
  } catch (e) {
    console.error('leaderboard query failed', e.status, e.body);
    return L.json(res, 500, { ok: false, error: 'query_failed' });
  }

  const entries = [];
  for (let i = 0; i < rows.length; i++) {
    const out = L.rowOf(rows[i]);
    entries.push(out);
  }
  entries.sort(function (a, b) {
    if (mode === 'lastStand' || mode === 'navalLastStand') {
      return (b.wave - a.wave) || (b.holdSec - a.holdSec) ||
        (b.kills - a.kills) || (b.score - a.score) ||
        String(a.createdAt).localeCompare(String(b.createdAt));
    }
    return (b.yellowXp - a.yellowXp) || (b.score - a.score) ||
      (b.kills - a.kills) || String(a.createdAt).localeCompare(String(b.createdAt));
  });
  for (let k = 0; k < entries.length; k++) entries[k].rank = k + 1;
  let myRank = null;
  if (playerId) {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].playerId === playerId) { myRank = entries[i].rank; break; }
    }
  }

  return L.json(res, 200, {
    ok: true, scope: 'mode',
    mode: mode,
    difficulty: difficulty,
    entries: entries.slice(0, limit),
    myRank: myRank
  });
};
