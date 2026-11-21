import { Check, Minus } from "lucide-react";
import MicroLabel from "@/components/MicroLabel";
import { COMPARE_ROWS, COMPARE_SHORT, MEMBERSHIPS } from "@/lib/memberships";

// No horizontal scroll: the row label always sits beside its own marks, so nothing
// scrolls out of reach on a phone. Footnotes live directly under the table.
export default function MembershipCompare() {
  return (
    <div className="hud-panel rounded-sm px-3 py-4 sm:px-4">
      <MicroLabel>What each membership includes</MicroLabel>

      <table className="mt-3 w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b border-amber/10">
            <th className="w-[42%] pb-2 pr-1 text-left" />
            {MEMBERSHIPS.map((membership) => (
              <th key={membership.id} className="w-[11.6%] pb-2 text-center align-bottom">
                <span className="font-mono text-[8px] uppercase leading-tight tracking-[0.06em] text-amber/70">
                  {COMPARE_SHORT[membership.id]}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row) => (
            <tr key={row.label} className="border-t border-white/[0.04]">
              <td className="py-2 pr-1 text-[10px] leading-snug text-foreground/65 sm:text-[11px]">
                {row.label}
              </td>
              {MEMBERSHIPS.map((membership) => (
                <td key={membership.id} className="py-2 text-center align-middle">
                  {row.tiers.includes(membership.id) ? (
                    <Check className="mx-auto h-3 w-3 text-amber/80" />
                  ) : (
                    <Minus className="mx-auto h-3 w-3 text-muted-foreground/30" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 space-y-2 border-t border-amber/10 pt-3">
        <p className="text-[9px] leading-relaxed text-muted-foreground/65">
          <sup>1</sup> No third-party advertising, ever — no ad networks, sponsored placements, or
          promoted outside content. Release news, new drops, and platform news come from the J&apos;ance
          Nutt universe and are part of the service.
        </p>
        <p className="text-[9px] leading-relaxed text-muted-foreground/65">
          <sup>2</sup> Ask ANA.LUCI about the brand, the catalog, or any artist under JN MUZIK CLIK or
          any JJ&amp;CO Trust member.
        </p>
        <p className="text-[9px] leading-relaxed text-muted-foreground/65">
          <sup>3</sup> 10K and 100K members receive every new release as it drops, with no
          subscription needed.
        </p>
      </div>
    </div>
  );
}