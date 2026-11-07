'use strict';

const L = require('./_supabase');

const buckets = new Map();

function rateLimited(req) {
  const ip = String((req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const b = buckets.get(ip) || { start: now, count: 0 };
  if (now - b.start > 10000) { b.start = now; b.count = 0; }
  b.count++;
  buckets.set(ip, b);
  if (buckets.size > 5000) buckets.clear();
  return b.count > 8;
}

module.exports = async function handler(req, res) {
  L.cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return L.json(res, 405, { ok: false, error: 'method_not_allowed' });
  if (!L.enabled()) return L.json(res, 503, { ok: false, error: 'backend_not_configured' });
  if (rateLimited(req)) return L.json(res, 429, { ok: false, error: 'too_many_requests' });

  const body = L.readBody(req);
  if (!body || !L.uuid(body.runId)) return L.json(res, 400, { ok: false, error: 'invalid_run_id' });

  const mode = L.text(body.mode, 24);
  const difficulty = L.text(body.difficulty, 16);
  if (!L.validMode(mode)) return L.json(res, 400, { ok: false, error: 'invalid_mode' });
  if (!L.validDifficulty(difficulty)) return L.json(res, 400, { ok: false, error: 'invalid_difficulty' });

  const playerId = L.text(body.playerId, 80);
  const nickname = L.text(body.nickname, 24);
  if (playerId.length < 8) return L.json(res, 400, { ok: false, error: 'invalid_player_id' });
  if (nickname.length < 1) return L.json(res, 400, { ok: false, error: 'invalid_nickname' });

  const duration = L.int(body.durationSec, 86400);
  const wave = L.int(body.wave, 999);
  const hold = L.int(body.holdSec, 86400);
  if (wave > Math.floor(duration / 20) + 2) return L.json(res, 400, { ok: false, error: 'invalid_wave' });
  if (hold > duration + 300) return L.json(res, 400, { ok: false, error: 'invalid_hold' });

  const row = {
    run_id: body.runId,
    player_id: playerId,
    nickname: nickname,
    mode: mode,
    difficulty: difficulty,
    map_id: L.text(body.mapId, 40) || null,
    result: (body.result === 'win' || body.result === 'settled') ? body.result : 'loss',
    score: L.int(body.score, 100000000),
    yellow_xp: L.int(body.yellowXp, 100000000),
    kills: L.int(body.kills, 100000),
    losses: L.int(body.losses, 100000),
    duration_sec: duration,
    wave: wave,
    hold_sec: hold,
    ships_sunk: L.int(body.shipsSunk, 10000),
    boss_kills: L.int(body.bossKills, 10000),
    client_version: L.text(body.clientVersion, 32) || null
  };

  try {
    await L.sb(L.TABLE, {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(row)
    });
    return L.json(res, 201, { ok: true, runId: row.run_id });
  } catch (e) {
    if (e.status === 409) return L.json(res, 409, { ok: false, error: 'duplicate_run' });
    console.error('submit failed', e.status, e.body);
    return L.json(res, 500, { ok: false, error: 'submit_failed' });
  }
};
