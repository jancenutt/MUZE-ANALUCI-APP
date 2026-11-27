import { getAccessToken } from "@base44/sdk";
import { invalidateCatalogCache } from "@/lib/catalogData";

// The admin intake tools file straight to Cloudflare through the
// analuci-intake Worker: files land in R2 and catalog.json is updated in
// place. The Worker checks the signed-in user's token with Base44 and only
// lets admins write. Nothing is filed to Base44 anymore.
const INTAKE_URL = "https://analuci-intake.xye-jancenutt.workers.dev";
const CHUNK_SIZE = 16 * 1024 * 1024;
const SINGLE_LIMIT = 95 * 1024 * 1024;

async function call(path, options = {}) {
  const token = getAccessToken();
  const res = await fetch(INTAKE_URL + path, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `intake_${res.status}`);
  return data;
}

const asJson = (body) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// kind: "audio" | "video" | "drop" | "cover-release" | "cover-track".
// Audio and artwork land in the public archive bucket; videos and drop
// packages land in the private bucket (the Worker decides by kind).
export async function uploadIntakeFile({ file, kind, releaseId, trackId, duration }) {
  let result;
  if (file.size <= SINGLE_LIMIT) {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    form.append("release_id", releaseId);
    if (trackId) form.append("track_id", trackId);
    if (duration != null && duration !== "") form.append("duration", String(duration));
    result = await call("/upload", { method: "POST", body: form });
  } else {
    const meta = {
      kind,
      release_id: releaseId,
      track_id: trackId,
      filename: file.name,
      content_type: file.type || "application/octet-stream",
      duration: duration ?? undefined,
    };
    const created = await call("/mp/create", asJson(meta));
    const parts = [];
    try {
      const count = Math.ceil(file.size / CHUNK_SIZE);
      for (let i = 0; i < count; i++) {
        const q = new URLSearchParams({
          key: created.key,
          upload_id: created.upload_id,
          kind,
          n: String(i + 1),
        });
        const part = await call(`/mp/part?${q.toString()}`, {
          method: "PUT",
          body: file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        });
        parts.push({ part_number: part.part_number, etag: part.etag });
      }
      result = await call(
        "/mp/complete",
        asJson({ ...meta, key: created.key, upload_id: created.upload_id, parts })
      );
    } catch (err) {
      try {
        await call("/mp/abort", asJson({ kind, key: created.key, upload_id: created.upload_id }));
      } catch {
        /* best effort */
      }
      throw err;
    }
  }
  invalidateCatalogCache();
  return result;
}

// Field-only catalog writes (e.g. flipping a video public/private).
export async function updateCatalogRecord({ target, id, fields }) {
  const result = await call("/update", asJson({ target, id, fields }));
  invalidateCatalogCache();
  return result;
}
