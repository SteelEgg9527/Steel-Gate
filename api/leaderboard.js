'use strict';

const L = require('./_supabase');

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
  const mode = L.text(q.mode, 24);
  const difficulty = L.text(q.difficulty, 16);
  if (!L.validMode(mode)) return L.json(res, 400, { ok: false, error: 'invalid_mode' });
  if (!L.validDifficulty(difficulty)) return L.json(res, 400, { ok: false, error: 'invalid_difficulty' });

  const requested = L.int(q.limit, 100);
  const limit = Math.max(1, Math.min(200, requested || 50));
  const playerId = L.text(q.playerId, 80);
  const path = L.TABLE + '?select=' + encodeURIComponent(SELECT) +
    '&mode=eq.' + encodeURIComponent(mode) +
    '&difficulty=eq.' + encodeURIComponent(difficulty) +
    '&order=' + encodeURIComponent(L.rankFields(mode)) +
    '&limit=' + Math.max(limit * 8, 400);

  let rows;
  try {
    rows = await L.sb(path, { method: 'GET' });
  } catch (e) {
    console.error('leaderboard query failed', e.status, e.body);
    return L.json(res, 500, { ok: false, error: 'query_failed' });
  }

  const seen = {};
  const entries = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (seen[r.player_id]) continue;
    seen[r.player_id] = true;
    const out = L.rowOf(r);
    out.rank = entries.length + 1;
    entries.push(out);
    if (entries.length >= limit + 20) break;
  }

  let myRank = null;
  if (playerId) {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].playerId === playerId) { myRank = entries[i].rank; break; }
    }
  }

  return L.json(res, 200, {
    ok: true,
    mode: mode,
    difficulty: difficulty,
    entries: entries.slice(0, limit),
    myRank: myRank
  });
};
