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

  const playerId = L.text((req.query || {}).playerId, 80);
  if (playerId.length < 8) return L.json(res, 400, { ok: false, error: 'invalid_player_id' });

  const path = L.TABLE + '?select=' + encodeURIComponent(SELECT) +
    '&player_id=eq.' + encodeURIComponent(playerId) +
    '&order=created_at.desc&limit=50';

  let rows;
  try {
    rows = await L.sb(path, { method: 'GET' });
  } catch (e) {
    console.error('profile query failed', e.status, e.body);
    return L.json(res, 500, { ok: false, error: 'query_failed' });
  }

  const best = {};
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const key = r.mode + ':' + r.difficulty;
    if (!best[key]) best[key] = L.rowOf(r);
  }

  return L.json(res, 200, {
    ok: true,
    playerId: playerId,
    nickname: rows.length ? rows[0].nickname : null,
    runs: rows.map(L.rowOf),
    best: best
  });
};
