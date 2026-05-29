import {
  isStaleReport,
  sortReportsByDateDesc,
  conditionReportUrl,
} from "@/lib/trails/conditions";
import type { TrailAlert, ConditionReport } from "@/lib/trails/schema";

const LEVEL_LABEL: Record<TrailAlert["level"], string> = {
  info: "Notice",
  caution: "Caution",
  closure: "Closure",
};

/**
 * Pinned official alerts plus recent, community-sourced condition reports for a
 * trail. Stale reports are de-emphasized with both muted text and an explicit
 * "Out of date" label (never colour alone). Always offers a link to report
 * current conditions through the issue form.
 */
export function TrailConditions({
  trail,
  now = new Date(),
}: {
  trail: {
    slug: string;
    name: string;
    alerts: TrailAlert[];
    conditionReports: ConditionReport[];
  };
  now?: Date;
}) {
  const reports = sortReportsByDateDesc(trail.conditionReports);

  return (
    <section aria-labelledby="conditions-heading" className="mt-8">
      <h2 id="conditions-heading" className="display text-forest text-2xl">
        Trail conditions
      </h2>

      {trail.alerts.length > 0 ? (
        <ul aria-label="Trail alerts" className="mt-4 space-y-2">
          {trail.alerts.map((alert, i) => {
            const strong = alert.level !== "info";
            return (
              <li
                key={i}
                className={`rounded-xl border p-4 ${
                  strong
                    ? "bg-amber/10 border-amber-600/40"
                    : "border-forest/15 bg-cream-50"
                }`}
              >
                <p className="text-sm">
                  <span
                    className={`font-semibold ${strong ? "text-amber-700" : "text-olive"}`}
                  >
                    {LEVEL_LABEL[alert.level]}
                  </span>
                  <span className="text-ink/40"> &middot; </span>
                  <time dateTime={alert.date} className="text-ink/60">
                    {alert.date}
                  </time>
                </p>
                <p className="text-ink/80 mt-1">{alert.message}</p>
                {alert.source ? (
                  <a
                    href={alert.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-olive hover:text-forest text-sm underline-offset-4 hover:underline"
                  >
                    Official notice
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {reports.length > 0 ? (
        <ul aria-label="Recent condition reports" className="mt-4 space-y-1.5">
          {reports.map((report, i) => {
            const stale = isStaleReport(report.date, now);
            return (
              <li
                key={i}
                className={`border-forest/5 border-b py-1.5 text-sm ${
                  stale ? "text-ink/50" : ""
                }`}
              >
                <span
                  className={stale ? "font-medium" : "text-olive font-medium"}
                >
                  {report.status}
                </span>
                <span className="text-ink/40"> &middot; </span>
                <time dateTime={report.date} className="text-ink/60">
                  {report.date}
                </time>
                {stale ? (
                  <span className="text-ink/50 italic">
                    {" "}
                    &middot; Out of date
                  </span>
                ) : null}
                {report.note ? (
                  <span className="text-ink/70 italic">
                    {" "}
                    &ldquo;{report.note}&rdquo;
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-ink/70 mt-4 text-sm">
          No recent condition reports. Hiked it lately?
        </p>
      )}

      <a
        href={conditionReportUrl(trail)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-olive hover:text-forest mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
      >
        Report current conditions →
      </a>
    </section>
  );
}
