#!/usr/bin/env node
/**
 * Elvanto API — exhaustive read-only schema probe.
 *
 * Purpose: live-verify the schema documented in .agents/planning/elvanto/findings.md
 * against the production account, incl. custom-field UUIDs, enum values, and
 * list-vs-detail field drift. WRITE ENDPOINTS ARE NEVER CALLED (getAll/getInfo/search only).
 *
 * Credentials: env ELVANTO_API_KEY wins; else parsed from runsheets api.php
 * (never copied into this repo). Auth = Basic `API_KEY:` per api.php.
 *
 * Output → scripts/elvanto-probe/
 *   report.json         raw observed shapes (field paths + types + truncated samples)
 *   schema-report.md    diff vs expected (findings.md) — feed back into findings/schema.dbml
 *   custom-fields.json  full custom-field inventory (UUIDs, types, option values)
 *
 * Run: node scripts/elvanto-schema-probe.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const RUNSHEETS_API_PHP =
  process.env.ELVANTO_API_PHP || 'C:\\laragon\\www\\runsheets\\public\\api.php';
const OUT_DIR = path.resolve('scripts/elvanto-probe');
const DELAY_MS = 350;
const SAMPLE_MAX = 40;

// ── credentials ──────────────────────────────────────────────────────────────
function loadApiKey() {
  if (process.env.ELVANTO_API_KEY) return process.env.ELVANTO_API_KEY;
  const php = fs.readFileSync(RUNSHEETS_API_PHP, 'utf8');
  const m = php.match(/ELVANTO_API_KEY['"],\s*'([^']+)'/);
  if (!m) throw new Error(`Set ELVANTO_API_KEY or check ${RUNSHEETS_API_PHP}`);
  return m[1];
}
const AUTH = 'Basic ' + Buffer.from(loadApiKey() + ':').toString('base64');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(endpoint, params = {}, attempt = 1) {
  const res = await fetch(`https://api.elvanto.com/v1/${endpoint}.json`, {
    method: 'POST',
    headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    await sleep(1200 * attempt);
    return call(endpoint, params, attempt + 1);
  }
  const json = await res.json().catch(() => ({ status: 'error', error: `non-json http ${res.status}` }));
  return { http: res.status, json };
}

// ── shape extraction ─────────────────────────────────────────────────────────
// fields: Map<path, {types:Set, sample:string}>
function walk(value, prefix, fields, depth = 0) {
  if (depth > 6 || value === undefined) return;
  if (Array.isArray(value)) {
    merge(fields, prefix || '<root>', 'array', null);
    if (value.length) walk(value[0], `${prefix}[]`, fields, depth + 1);
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      const p = prefix ? `${prefix}.${k}` : k;
      const t = Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v;
      merge(fields, p, t, v);
      if (t === 'array' && v.length) walk(v[0], `${p}[]`, fields, depth + 1);
      else if (t === 'object') walk(v, p, fields, depth + 1);
    }
  }
}
function merge(fields, p, t, v) {
  if (!fields.has(p)) fields.set(p, { types: new Set(), sample: '' });
  const f = fields.get(p);
  f.types.add(t);
  if (!f.sample && v !== null && v !== undefined && typeof v !== 'object')
    f.sample = String(v).slice(0, SAMPLE_MAX);
}

// ── expected shapes (from findings.md 2026-08-24) ────────────────────────────
const PERSON = ['id','date_added','date_modified','category_id','firstname','preferred_name','middle_name','lastname','email','phone','mobile','admin','archived','contact','volunteer','status','username','last_login','country','timezone','picture','family_id','family_relationship','birthday','gender','locations','custom_*'];
const EXPECTED = {
  'people/getAll':        { item: 'person',   fields: PERSON },
  'people/search':        { item: 'person',   fields: PERSON },
  'people/getInfo':       { item: 'person',   fields: PERSON },
  'groups/getAll':        { item: 'group',    fields: ['id','date_added','date_modified','name','status','description','logo','picture','meeting_address','meeting_city','meeting_state','meeting_postcode','meeting_country','meeting_day','meeting_time','meeting_start_date','meeting_end_date','meeting_start_time','meeting_end_time','meeting_frequency','people'] },
  'services/getAll':      { item: 'service',  fields: ['id','status','date_added','date_modified','name','series_name','date','description','service_type','location','service_times','plans','volunteers','songs','files','notes'] },
  'songs/getAll':         { item: 'song',     fields: ['id','status','date_added','date_modified','title','permalink','number','item','learn','allow_downloads','artist','album','notes','categories','locations'] },
  'calendar/getAll':      { item: 'calendar', fields: ['id','name','color','members','published'] },
  'calendar/events/getAll':{ item: 'event',   fields: ['id','picture','calendar_id','interval','name','description','admin_notes','where','start_date','end_date','all_day','url','color','locations'] },
  'financial/transactions/getAll': { item: 'transaction', fields: ['id','person_id','person_first_name','person_last_name','person_email','transaction_date','transaction_datetime','transaction_method','check_number','batch','transaction_total','amounts','created_by_id','created_by_first_name','created_by_last_name','created_at','updated_by_id','updated_by_first_name','updated_by_last_name','updated_at'] },
  'financial/categories/getAll':   { item: 'category',    fields: ['id','status','name'] },
  'people/categories/getAll':      { item: 'category',    fields: ['id','name','color'] },
  'people/customFields/getAll':    { item: 'custom_field',fields: ['id','name','type','values'] },
  'peopleFlows/getAll':            { item: 'people_flow', fields: ['id','name','status','access','admins','locations','demographics','steps'] },
};

// enum observation points: [endpointItemPath, dbEnumName]
const ENUM_PATHS = [
  ['person.status','person_status'], ['person.gender','gender'], ['person.marital_status','marital_status'],
  ['person.family_relationship','family_relationship'], ['group.status','group_status'],
  ['event.status','event_status'], ['transaction.transaction_method','transaction_method'],
  ['custom_field.type','custom_field_type'],
];

// ── probe plan (read-only) ───────────────────────────────────────────────────
const yearAgo = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
const yearAhead = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);

const COLLECTIONS = [
  ['people/categories/getAll', {}],
  ['people/customFields/getAll', { page_size: 1000 }],
  ['people/getAll', { page_size: 10 }],
  ['groups/getAll', { page_size: 10, fields: ['people'] }],
  ['services/getAll', { page_size: 10, start: yearAgo, end: yearAhead, fields: ['series_name','service_times','plans','volunteers','songs','files','notes'] }],
  ['songs/getAll', { page_size: 10 }],
  ['calendar/getAll', {}],
  ['calendar/events/getAll', { page_size: 10, start: yearAgo, end: yearAhead, fields: ['locations'] }],
  ['financial/transactions/getAll', { page_size: 10, start: yearAgo, end: yearAhead }],
  ['financial/categories/getAll', { page_size: 1000 }],
  ['peopleFlows/getAll', {}],
];

function firstItem(json, key, singular) {
  const node = json?.[key]?.[singular];
  if (!node) return null;
  return Array.isArray(node) ? node[0] : node;
}

// ── main ─────────────────────────────────────────────────────────────────────
const results = {};   // endpoint -> {http,status,error?,fields:{path:{types,sample}}}
const enumsObserved = {}; // enumName -> Set(values)
const cfInventory = [];

if (process.argv.includes('--report-only')) {
  Object.assign(results, JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'report.json'), 'utf8')));
  fs.writeFileSync(path.join(OUT_DIR, 'schema-report.md'), diffReport());
  console.log(`Report rebuilt from existing report.json → ${path.join(OUT_DIR, 'schema-report.md')}`);
  process.exit(0);
}

console.log('Elvanto schema probe — READ-ONLY\n');

for (const [endpoint, params] of COLLECTIONS) {
  process.stdout.write(`GET ${endpoint} ... `);
  const { http, json } = await call(endpoint, params);
  if (json.status !== 'ok') {
    const empty = json.error?.code === 404 || /no .* (match|found)/i.test(json.error?.message ?? '');
    console.log(`${empty ? 'EMPTY' : 'FAIL'} http=${http} ${JSON.stringify(json.error)?.slice(0, 120)}`);
    results[endpoint] = { http, status: empty ? 'empty-dataset' : 'error', error: json.error };
    continue;
  }
  const seg = endpoint.split('/');
  const SINGULAR_OVERRIDES = {
    people: 'person', categories: 'category', custom_fields: 'custom_field',
    people_flows: 'people_flow', people_flow_steps: 'people_flow_step',
    calendars: 'calendar', events: 'event',
  };
  const plural = seg[seg.length - 1] === 'getAll' ? seg[seg.length - 2] : seg[seg.length - 1];
  const singular = SINGULAR_OVERRIDES[plural] ?? plural.replace(/ies$/, 'y').replace(/s$/, '');
  const fields = new Map();
  walk(json, '', fields);

  // enum harvest on item level
  const items = json[plural]?.[singular];
  const arr = Array.isArray(items) ? items : items ? [items] : [];
  harvestEnums(plural, singular, arr);

  if (endpoint === 'people/customFields/getAll') {
    for (const cf of arr) {
      cfInventory.push({
        id: cf.id, name: cf.name, type: cf.type,
        options: cf.values?.value?.map((v) => ({ id: v.id, name: v.name })) ?? [],
      });
    }
  }

  results[endpoint] = { http, status: 'ok', total: json[plural]?.total ?? arr.length, fields: serializeFields(fields) };
  console.log(`ok (${results[endpoint].total} items, ${fields.size} field paths)`);

  // ── detail probes chained off first IDs ──
  await detailProbes(endpoint, { people: arr, json });
  await sleep(DELAY_MS);
}

function harvestEnums(plural, singular, arr) {
  const grab = (obj, path, set) => {
    let cur = obj;
    for (const part of path.split('.')) {
      if (cur == null) return;
      cur = cur[part];
    }
    if (cur != null) set.add(String(cur));
  };
  const map = {
    person: [['status','person_status'],['gender','gender'],['marital_status','marital_status'],['family_relationship','family_relationship']],
    group: [['status','group_status']],
    event: [['status','event_status']],
    transaction: [['transaction_method','transaction_method']],
    custom_field: [['type','custom_field_type']],
  };
  for (const item of arr) {
    for (const [p, en] of map[singular] ?? []) {
      enumsObserved[en] ??= new Set();
      grab(item, p, enumsObserved[en]);
    }
  }
}

async function detailProbes(endpoint, ctx) {
  const probe = async (ep, params, itemKey) => {
    process.stdout.write(`  GET ${ep} ... `);
    const { http, json } = await call(ep, params);
    if (json.status !== 'ok') {
      console.log(`FAIL http=${http} ${JSON.stringify(json.error)?.slice(0, 100)}`);
      results[ep] = { http, status: json.status, error: json.error };
      return null;
    }
    const fields = new Map();
    walk(json, '', fields);
    results[ep] = { http, status: 'ok', fields: serializeFields(fields) };
    console.log(`ok (${fields.size} field paths)`);
    await sleep(DELAY_MS);
    return json;
  };

  if (endpoint === 'people/getAll' && ctx.people[0]) {
    await probe('people/getInfo', { id: ctx.people[0].id, fields: ['locations'] });
  }
  if (endpoint === 'groups/getAll' && ctx.json.groups?.group?.[0]) {
    await probe('groups/getInfo', { id: ctx.json.groups.group[0].id });
  }
  if (endpoint === 'services/getAll' && ctx.json.services?.service?.[0]) {
    await probe('services/getInfo', { id: ctx.json.services.service[0].id, fields: ['series_name','service_times','rehearsal_times','other_times','plans','volunteers','songs','files','notes'] });
  }
  if (endpoint === 'songs/getAll' && ctx.json.songs?.song?.[0]) {
    const songId = ctx.json.songs.song[0].id;
    await probe('songs/getInfo', { id: songId });
    const a = await probe('songs/arrangements/getAll', { song_id: songId, page_size: 10 });
    const arrId = a?.arrangements?.arrangement?.[0]?.id;
    if (arrId) {
      await probe('songs/arrangements/getInfo', { id: arrId });
      const k = await probe('songs/keys/getAll', { arrangement_id: arrId, page_size: 10 });
      const keyId = k?.keys?.key?.[0]?.id;
      if (keyId) await probe('songs/keys/getInfo', { id: keyId });
    }
  }
  if (endpoint === 'financial/transactions/getAll' && ctx.json.transactions?.transaction?.[0]) {
    await probe('financial/transactions/getInfo', { id: ctx.json.transactions.transaction[0].id });
  }
  if (endpoint === 'peopleFlows/getAll' && ctx.json.people_flows?.people_flow?.[0]) {
    const flow = ctx.json.people_flows.people_flow[0];
    const steps = await probe('peopleFlows/steps/getAll', { flow_id: flow.id });
    const stepId = steps?.people_flow_steps?.people_flow_step?.[0]?.id;
    if (stepId) await probe('peopleFlows/steps/people', { step_id: stepId });
  }
}

function serializeFields(map) {
  return Object.fromEntries([...map.entries()].map(([p, f]) => [p, { types: [...f.types], sample: f.sample }]));
}

// ── diff vs expected ─────────────────────────────────────────────────────────
function envelopeKey(ep) {
  const seg = ep.split('/');
  return seg[seg.length - 1] === 'getAll' ? seg[seg.length - 2] : seg[seg.length - 1];
}

function diffReport() {
  const lines = ['# Elvanto Schema Probe Report', '', `Generated: ${new Date().toISOString()}`, ''];
  for (const [ep, exp] of Object.entries(EXPECTED)) {
    const r = results[ep];
    lines.push(`## ${ep}`);
    if (!r || r.status === 'error' || !r.fields) {
      lines.push(r?.status === 'empty-dataset'
        ? '**EMPTY DATASET** (404 — nothing to observe; schema unverified against live data)\n'
        : '**CALL FAILED** — see report.json\n');
      continue;
    }
    const observedRoot = Object.keys(r.fields).filter((p) => !p.includes('.'));
    const confirmed = [], extra = [];
    for (const f of exp.fields) {
      if (f.endsWith('*')) {
        if (Object.keys(r.fields).some((k) => k.startsWith(f.slice(0, -1)))) confirmed.push(f);
      } else if (observedRoot.includes(f)) confirmed.push(f);
      else confirmed.push(`${f} ⚠️ not in sample`);
    }
    for (const o of observedRoot) {
      const known = exp.fields.some((f) => f === o || (f.endsWith('*') && o.startsWith(f.slice(0, -1))));
      const structural = ['generated_in','status','on_this_page','page','per_page','total', envelopeKey(ep)];
      if (!known && !structural.includes(o)) extra.push(o);
    }
    lines.push(`- Confirmed: ${confirmed.length}/${exp.fields.length}`);
    if (extra.length) lines.push(`- **NEW/unexpected:** ${extra.join(', ')}`);
    lines.push('');
  }
  lines.push('## Observed enum values');
  for (const [en, vals] of Object.entries(enumsObserved))
    lines.push(`- \`${en}\`: ${[...vals].join(' | ') || '(none seen)'}`);
  return lines.join('\n');
}

// ── write outputs ────────────────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(results, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'schema-report.md'), diffReport());
fs.writeFileSync(path.join(OUT_DIR, 'custom-fields.json'), JSON.stringify(cfInventory, null, 2));

console.log(`\nDone. ${Object.values(results).filter((r) => r.status === 'ok').length}/${Object.keys(results).length} calls ok.`);
console.log(`Custom fields inventoried: ${cfInventory.length}`);
console.log(`Output → ${OUT_DIR}{/report.json,/schema-report.md,/custom-fields.json}`);
