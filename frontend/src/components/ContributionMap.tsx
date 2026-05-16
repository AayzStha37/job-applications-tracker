import { useApplications } from "../hooks/useApplications";

const CELL = 13;
const GAP = 4;
const STEP = CELL + GAP;
const MONTH_GAP = 8; // extra px between month boundaries
const WEEKS = 53;
const LEFT_GUTTER = 36;
const TOP_GUTTER = 24;
const BOTTOM_GUTTER = 32;

const COLORS = ["#2d333b", "#0e4429", "#006d32", "#26a641", "#39d353"];

function bucket(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

function toLocalDateStr(isoStr: string): string {
  const d = new Date(isoStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS: [number, string][] = [[1, "Mon"], [3, "Wed"], [5, "Fri"]];

export function ContributionMap() {
  const { data: applications } = useApplications();


  const counts = new Map<string, number>();
  if (applications) {
    for (const app of applications) {
      if (app.status === "SAVED") continue;
      const d = toLocalDateStr(app.createdAt);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDay = today.getDay();

  const gridEnd = new Date(today);
  gridEnd.setDate(today.getDate() + (6 - todayDay));

  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridEnd.getDate() - WEEKS * 7 + 1);

  type Week = { dateStr: string; inFuture: boolean }[];
  const weeks: Week[] = [];
  const cursor = new Date(gridStart);

  for (let w = 0; w < WEEKS; w++) {
    const week: Week = [];
    for (let d = 0; d < 7; d++) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const day = String(cursor.getDate()).padStart(2, "0");
      week.push({ dateStr: `${y}-${m}-${day}`, inFuture: cursor > today });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  // Per-week x offsets — accumulate MONTH_GAP whenever month changes vs previous week
  const weekX: number[] = [];
  let extraOffset = 0;
  for (let w = 0; w < weeks.length; w++) {
    if (w > 0) {
      const prevMonth = parseInt(weeks[w - 1][0].dateStr.split("-")[1], 10);
      const curMonth  = parseInt(weeks[w][0].dateStr.split("-")[1], 10);
      if (curMonth !== prevMonth) extraOffset += MONTH_GAP;
    }
    weekX.push(LEFT_GUTTER + w * STEP + extraOffset);
  }

  const total = Array.from(counts.values()).reduce((s, v) => s + v, 0);

  // Month labels at the first week of each month
  const monthLabels: { x: number; label: string }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    const month = parseInt(weeks[w][0].dateStr.split("-")[1], 10) - 1;
    if (month !== lastMonth) {
      monthLabels.push({ x: weekX[w], label: MONTH_NAMES[month] });
      lastMonth = month;
    }
  }

  const RIGHT_GUTTER = 32; // room for "More" legend label
  const svgWidth = weekX[WEEKS - 1] + STEP + RIGHT_GUTTER;
  const svgHeight = TOP_GUTTER + 7 * STEP + BOTTOM_GUTTER;

  return (
    <div className="contribution-map">
      <div className="contribution-map-header">
        <h2>{total} application{total !== 1 ? "s" : ""} in the last year</h2>
      </div>
      <div className="contribution-grid-wrap">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMinYMid meet"
          style={{ display: "block", width: "100%", height: "auto" }}
        >
          {/* Month labels */}
          {monthLabels.map(({ x, label }) => (
            <text
              key={`${label}-${x}`}
              x={x}
              y={TOP_GUTTER - 6}
              fontSize={10}
              fill="var(--text-muted)"
              fontFamily="Inter, sans-serif"
            >
              {label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map(([dow, label]) => (
            <text
              key={label}
              x={LEFT_GUTTER - 6}
              y={TOP_GUTTER + dow * STEP + CELL * 0.75}
              fontSize={10}
              fill="var(--text-muted)"
              fontFamily="Inter, sans-serif"
              textAnchor="end"
            >
              {label}
            </text>
          ))}

          {/* Cells */}
          {weeks.map((week, w) =>
            week.map(({ dateStr, inFuture }, d) => {
              const count = inFuture ? 0 : (counts.get(dateStr) ?? 0);
              const color = inFuture ? "transparent" : COLORS[bucket(count)];
              const x = weekX[w];
              const y = TOP_GUTTER + d * STEP;
              return (
                <rect
                  key={dateStr}
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={color}
                >
                  {!inFuture && (
                    <title>
                      {count} application{count !== 1 ? "s" : ""} on {formatDate(dateStr)}
                    </title>
                  )}
                </rect>
              );
            })
          )}

          {/* Legend */}
          {(() => {
            const legendY = TOP_GUTTER + 7 * STEP + 12;
            const legendRightX = weekX[WEEKS - 1] + STEP;
            const legendCells = 5;
            const moreX = legendRightX - legendCells * STEP - 6;
            return (
              <>
                <text
                  x={moreX - 4}
                  y={legendY + CELL * 0.75}
                  fontSize={10}
                  fill="var(--text-muted)"
                  fontFamily="Inter, sans-serif"
                  textAnchor="end"
                >
                  Less
                </text>
                {COLORS.map((color, i) => (
                  <rect
                    key={i}
                    x={moreX + i * STEP}
                    y={legendY}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    fill={color}
                  />
                ))}
                <text
                  x={moreX + legendCells * STEP + 2}
                  y={legendY + CELL * 0.75}
                  fontSize={10}
                  fill="var(--text-muted)"
                  fontFamily="Inter, sans-serif"
                >
                  More
                </text>
              </>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
