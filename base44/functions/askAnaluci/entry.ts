import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const question = typeof body.question === 'string' ? body.question.trim().slice(0, 400) : '';
    if (!question) return Response.json({ error: 'question is required' }, { status: 400 });

    const base44 = createClientFromRequest(req);

    const releasePage = await base44.entities.Release.list({ sort: 'num', limit: 100 });
    const releases = releasePage?.items ?? releasePage ?? [];
    const trackPage = await base44.entities.Track.list({ sort: 'release_num', limit: 400 });
    const tracks = trackPage?.items ?? trackPage ?? [];

    const byRelease = new Map();
    for (const track of tracks) {
      const list = byRelease.get(track.release_id) || [];
      list.push(`${track.no}. ${track.title}`);
      byRelease.set(track.release_id, list);
    }

    const catalog = releases
      .map((r) => {
        const list = (byRelease.get(r.id) || []).join(' | ');
        return `${r.num}. ${r.title} — artist: ${r.artist} — format: ${r.type} — date: ${r.date} — status: ${r.status} — release id: ${r.release_id} — tracks: ${list}`;
      })
      .join('\n');

    const prompt = `You are Ana.Luci, the operations core for independent artist J'ance Nutt (aliases include JAY.XYE, J'ance, J'ance Nutt, FknJance, JayNutt, ZaddyXYE). Tone: mission-control, precise, confident, slightly cinematic. Never invent data.

ARCHIVE CATALOG (${releases.length} releases, ${tracks.length} tracks):
${catalog}

OPERATOR QUESTION: ${question}

Answer only from the catalog above. Keep it under 90 words, plain text, no markdown, no bullet characters. If the question points at one specific release, return its exact title in release_title; otherwise return an empty string. If the catalog cannot answer, say so plainly.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          release_title: { type: 'string' },
        },
        required: ['answer', 'release_title'],
      },
    });

    const answer = typeof result === 'string' ? result : result?.answer || '';
    const title = (typeof result === 'object' ? result?.release_title || '' : '').trim().toLowerCase();
    const match = title
      ? releases.find((r) => String(r.title).trim().toLowerCase() === title)
      : null;

    return Response.json({
      answer: answer || "I can't resolve that from the archive.",
      release: match ? { id: match.id, title: match.title, num: match.num } : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}