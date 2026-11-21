import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const NOTION_VERSION = '2025-09-03';
const PLACEHOLDERS = new Set(['', 'not shown', 'n/a', 'na', '-', 'none', 'null', '—']);

const RELEASE_FIELDS = ['title', 'artist', 'date', 'year', 'upc', 'type', 'track_count', 'release_id'];
const TRACK_FIELDS = ['title', 'artist', 'no'];

async function notion(token, path, options = {}) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Notion ${res.status}: ${text}`);
  return JSON.parse(text);
}

function plain(rich) {
  if (!Array.isArray(rich)) return '';
  return rich.map((r) => r.plain_text || '').join('').trim();
}

function propValue(prop) {
  if (!prop) return null;
  switch (prop.type) {
    case 'title': return plain(prop.title);
    case 'rich_text': return plain(prop.rich_text);
    case 'number': return prop.number;
    case 'select': return prop.select?.name ?? null;
    case 'status': return prop.status?.name ?? null;
    case 'date': return prop.date?.start ?? null;
    case 'url': return prop.url;
    case 'unique_id': return prop.unique_id ? `${prop.unique_id.prefix || ''}${prop.unique_id.number}` : null;
    default: return null;
  }
}

function relations(prop) {
  if (!prop || prop.type !== 'relation') return [];
  return (prop.relation || []).map((r) => r.id);
}

function titleOf(obj) {
  return plain(obj.title || obj.name || []) || 'Untitled';
}

async function queryAll(token, dataSourceId) {
  const rows = [];
  let cursor = null;
  for (let page = 0; page < 25; page++) {
    const data = await notion(token, `/data_sources/${dataSourceId}/query`, {
      method: 'POST',
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    rows.push(...(data.results || []));
    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }
  return rows;
}

function flatten(row) {
  const out = {};
  for (const [name, prop] of Object.entries(row.properties || {})) out[name] = propValue(prop);
  return out;
}

function usable(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    // Notion uses "Not shown" as a stand-in for missing data — never write it over real catalog values.
    if (!v || PLACEHOLDERS.has(v)) return false;
    if (v.startsWith('not shown') || v.includes(' not shown')) return false;
    return true;
  }
  if (typeof value === 'number') return Number.isFinite(value);
  return true;
}

// Notion title cells carry stream counts and an explicit marker. The counts are reporting
// noise and never reach the archive; the explicit marker must stay visible, so it is kept
// as a compact " (Explicit)" suffix instead of being dropped.
function hasExplicitMarker(text) {
  return /explicit marker shown|[\(\[]explicit[\)\]]/i.test(text);
}

function cleanTitle(value) {
  const text = String(value ?? '');
  if (!text) return text;
  const explicit = hasExplicitMarker(text);
  const cleaned = text
    .replace(/\s*[·|•]\s*explicit marker shown/gi, '')
    .replace(/\s*explicit marker shown/gi, '')
    .replace(/\s*[\d,.]+\s*all[\s-]?time\s*streams?/gi, '')
    .replace(/\s*[·|•]\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const bare = cleaned.replace(/\s*[\(\[]explicit[\)\]]\s*$/i, '').trim();
  return explicit ? `${bare} (Explicit)` : cleaned;
}

// Matching key: the title without its explicit suffix, so a marker never blocks a match.
function baseTitle(value) {
  return String(value ?? '').replace(/\s*[\(\[]explicit[\)\]]\s*$/i, '').trim();
}

function normTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’'`´]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function yearOf(iso) {
  if (!iso) return null;
  const y = Number(String(iso).slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

const TYPE_MAP = {
  album: 'Album',
  ep: 'EP',
  single: 'Single',
  mixtape: 'Mixtape',
  'not shown': 'Not shown',
};

async function resolveSources(token) {
  const search = await notion(token, '/search', {
    method: 'POST',
    body: JSON.stringify({ filter: { property: 'object', value: 'data_source' }, page_size: 100 }),
  });
  let releases = null;
  let tracks = null;
  for (const ds of search.results || []) {
    const name = titleOf(ds).toLowerCase();
    if (!releases && /^releases?\b/.test(name)) releases = ds.id;
    if (!tracks && /^tracks?\b/.test(name)) tracks = ds.id;
  }
  return { releases, tracks };
}

function buildReleasePlan(notionRows, appReleases) {
  const byNum = new Map(appReleases.map((r) => [Number(r.num), r]));
  const updates = [];
  const creates = [];
  const unmatched = [];
  // Notion page id → catalog number, so tracks can join through the relation.
  const pageToNum = new Map();

  for (const row of notionRows) {
    const flat = flatten(row);
    const rawTitle = String(flat.Release || '').trim();
    const parsed = rawTitle.match(/^(\d+)\s*[·•∙\-–—:]\s*(.+)$/);
    const num = parsed ? Number(parsed[1]) : null;
    if (!num) {
      unmatched.push({ row: rawTitle, reason: 'No catalog number in the Notion title' });
      continue;
    }
    pageToNum.set(row.id, num);

    const iso = flat['Release Date'];
    const candidate = {
      title: cleanTitle(parsed ? parsed[2].trim() : rawTitle),
      artist: flat['Primary Artist'],
      date: flat['Release Date as shown'] || formatDate(iso),
      year: yearOf(iso),
      upc: flat.UPC,
      type: TYPE_MAP[String(flat['Release Type'] || '').toLowerCase()] || null,
      track_count: typeof flat['Visible Track Count'] === 'number' ? flat['Visible Track Count'] : null,
      release_id: flat['Distributor Release ID'],
    };

    const incoming = {};
    for (const key of RELEASE_FIELDS) {
      const value = candidate[key];
      if (usable(value)) incoming[key] = typeof value === 'string' ? value.trim() : value;
    }

    const existing = byNum.get(num);
    if (!existing) {
      creates.push({ num, ...incoming });
      continue;
    }

    const patch = {};
    for (const [key, value] of Object.entries(incoming)) {
      const current = existing[key];
      if (key === 'track_count' || key === 'year') {
        if (Number(current) !== Number(value)) patch[key] = value;
      } else if (String(current ?? '').trim() !== String(value).trim()) {
        patch[key] = value;
      }
    }
    if (Object.keys(patch).length) updates.push({ id: existing.id, num, title: existing.title, patch });
  }

  return { pageToNum, updates, creates, unmatched };
}

function buildTrackPlan(notionRows, appTracks, pageToNum) {
  const byKey = new Map();
  const byTitle = new Map();
  for (const t of appTracks) {
    if (Number.isFinite(Number(t.release_num)) && Number.isFinite(Number(t.no))) {
      byKey.set(`${Number(t.release_num)}:${Number(t.no)}`, t);
    }
    const key = normTitle(baseTitle(t.title));
    if (!key) continue;
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key).push(t);
  }

  const updates = [];
  const creates = [];
  const unmatched = [];

  for (const row of notionRows) {
    const flat = flatten(row);
    const title = cleanTitle(String(flat.Track || '').trim());
    const no = typeof flat['Track Number'] === 'number' ? flat['Track Number'] : null;
    const artist = flat['Track Artist / Credits'];

    const relatedIds = relations(row.properties?.Release);
    const releaseNum = relatedIds.map((id) => pageToNum.get(id)).find((n) => Number.isFinite(n)) ?? null;

    if (!usable(title)) {
      unmatched.push({ row: title, reason: 'Missing track title' });
      continue;
    }

    const incoming = { title: title.trim() };
    if (usable(artist)) incoming.artist = String(artist).trim();
    if (usable(no)) incoming.no = no;

    let target = null;
    if (releaseNum != null && no != null) {
      target = byKey.get(`${releaseNum}:${no}`) || null;
    }
    // Fall back to a unique title match already in the catalog.
    if (!target) {
      const hits = byTitle.get(normTitle(baseTitle(title))) || [];
      if (hits.length === 1) target = hits[0];
      else if (hits.length > 1) {
        unmatched.push({
          row: title,
          reason: `Title appears in ${hits.length} releases — link it in Notion's Release column`,
        });
        continue;
      }
    }

    if (!target) {
      if (releaseNum != null && no != null) {
        const release = { release_num: releaseNum, ...incoming };
        creates.push(release);
      } else {
        unmatched.push({ row: title, reason: "Not in the catalog and not linked to a release in Notion" });
      }
      continue;
    }

    const patch = {};
    for (const key of TRACK_FIELDS) {
      if (!(key in incoming)) continue;
      const current = target[key];
      if (key === 'no') {
        if (Number(current) !== Number(incoming[key])) patch[key] = incoming[key];
      } else if (String(current ?? '').trim() !== String(incoming[key]).trim()) {
        patch[key] = incoming[key];
      }
    }
    if (Object.keys(patch).length) {
      updates.push({ id: target.id, title: target.title, release_num: target.release_num, patch });
    }
  }

  return { updates, creates, unmatched };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('notion');
    const sources = await resolveSources(accessToken);
    if (!sources.releases || !sources.tracks) {
      return Response.json(
        { error: 'Could not find both a Releases and a Tracks database in Notion.' },
        { status: 404 }
      );
    }

    const [notionReleases, notionTracks] = await Promise.all([
      queryAll(accessToken, sources.releases),
      queryAll(accessToken, sources.tracks),
    ]);

    const [releasePage, trackRows] = await Promise.all([
      base44.asServiceRole.entities.Release.list({ sort: 'num', limit: 500 }),
      (async () => {
        const items = [];
        let cursor = null;
        for (let i = 0; i < 10; i++) {
          const page = await base44.asServiceRole.entities.Track.filter(
            {},
            { limit: 200, ...(cursor ? { cursor } : {}) }
          );
          items.push(...page.items);
          if (!page.has_more || !page.next_cursor) break;
          cursor = page.next_cursor;
        }
        return items;
      })(),
    ]);

    const catalogReleases = Array.isArray(releasePage) ? releasePage : releasePage.items || [];
    const releasePlan = buildReleasePlan(notionReleases, catalogReleases);
    const trackPlan = buildTrackPlan(notionTracks, trackRows, releasePlan.pageToNum);

    let applied = { releaseUpdates: 0, releaseCreates: 0, trackUpdates: 0, trackCreates: 0 };
    if (!dryRun) {
      if (releasePlan.updates.length) {
        await base44.asServiceRole.entities.Release.bulkUpdate(
          releasePlan.updates.map(({ id, patch }) => ({ id, ...patch }))
        );
        applied.releaseUpdates = releasePlan.updates.length;
      }
      if (releasePlan.creates.length) {
        await base44.asServiceRole.entities.Release.bulkCreate(releasePlan.creates);
        applied.releaseCreates = releasePlan.creates.length;
      }
      if (trackPlan.updates.length) {
        await base44.asServiceRole.entities.Track.bulkUpdate(
          trackPlan.updates.map(({ id, patch }) => ({ id, ...patch }))
        );
        applied.trackUpdates = trackPlan.updates.length;
      }
      if (trackPlan.creates.length) {
        await base44.asServiceRole.entities.Track.bulkCreate(trackPlan.creates);
        applied.trackCreates = trackPlan.creates.length;
      }
    }

    return Response.json({
      dryRun,
      applied,
      counts: {
        notionReleases: notionReleases.length,
        notionTracks: notionTracks.length,
        catalogReleases: catalogReleases.length,
        catalogTracks: trackRows.length,
      },
      releases: {
        updates: releasePlan.updates.length,
        creates: releasePlan.creates.length,
        unmatched: releasePlan.unmatched.length,
      },
      tracks: {
        updates: trackPlan.updates.length,
        creates: trackPlan.creates.length,
        unmatched: trackPlan.unmatched.length,
      },
      samples: {
        releaseUpdates: releasePlan.updates.slice(0, 6),
        releaseCreates: releasePlan.creates.slice(0, 4),
        trackUpdates: trackPlan.updates.slice(0, 8),
        trackCreates: trackPlan.creates.slice(0, 4),
        unmatched: [...releasePlan.unmatched, ...trackPlan.unmatched].slice(0, 10),
      },
    });
  } catch (error) {
    console.log('notionLibrary sync error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}