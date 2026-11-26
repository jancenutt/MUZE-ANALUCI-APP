import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PageNotFound from "@/lib/PageNotFound";

// Clean release URLs (e.g. /jayxye/arizona, /jayxye/77) are the links Google
// and older shares point at. Releases are stored with a slug, so resolve the
// slug to the release record and land on the canonical /release/:id page.
export default function ReleaseSlugRedirect() {
  const { slug } = useParams();
  const [target, setTarget] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const page = await base44.entities.Release.filter({ slug }, { limit: 1 });
        const record = page?.items?.[0];
        if (alive && record?.id) setTarget(record.id);
      } catch (err) {
        // No match — fall through to the 404 below.
      } finally {
        if (alive) setDone(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (target) return <Navigate to={`/release/${target}`} replace />;
  if (done) return <PageNotFound />;
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
