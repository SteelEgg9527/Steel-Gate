'use strict';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TABLE = 'steel_runs';

function enabled() {
  return !!(SUPABASE_URL && SERVICE_KEY);
}

async function sb(path, options) {
  if (!enabled()) throw new Error('leaderboard backend not configured');
  const opts = options || {};
  const headers = Object.assign({
    apikey: SERVICE_KEY,
    Authorization: 'Bearer ' + SERVICE_KEY,
    'Content-Type': 'application/json'
  }, opts.headers || {});
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, Object.assign({}, opts, { headers: headers }));
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
  if (!res.ok) {
    const err = new Error('supabase ' + res.status);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, body) {
  cors(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return null; }
  }
  return null;
}

function int(v, max) {
  const n = Math.floor(Number(v));
  if (!isFinite(n) || n < 0) return 0;
  return Math.min(max || 100000000, n);
}

function text(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max || 80);
}

function validMode(v) {
  return v === 'melee' || v === 'lastStand' || v === 'naval' || v === 'navalLastStand';
}

function validDifficulty(v) {
  return v === 'easy' || v === 'normal' || v === 'hard' || v === 'endless';
}

function uuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ''));
}

function rankFields(mode) {
  if (mode === 'lastStand' || mode === 'navalLastStand') {
    return 'wave.desc,hold_sec.desc,kills.desc,score.desc,created_at.asc';
  }
  return 'yellow_xp.desc,score.desc,kills.desc,created_at.asc';
}

function rowOf(r) {
  return {
    runId: r.run_id,
    playerId: r.player_id,
    nickname: r.nickname,
    mode: r.mode,
    difficulty: r.difficulty,
    mapId: r.map_id,
    result: r.result,
    score: r.score,
    yellowXp: r.yellow_xp,
    kills: r.kills,
    losses: r.losses,
    durationSec: r.duration_sec,
    wave: r.wave,
    holdSec: r.hold_sec,
    shipsSunk: r.ships_sunk,
    bossKills: r.boss_kills,
    createdAt: r.created_at
  };
}

module.exports = {
  TABLE,
  enabled,
  sb,
  cors,
  json,
  readBody,
  int,
  text,
  validMode,
  validDifficulty,
  uuid,
  rankFields,
  rowOf
};
