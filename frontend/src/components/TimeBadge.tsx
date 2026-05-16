interface Props {
  date: string;
}

function getTimeElapsed(date: string): { label: string; color: "green" | "yellow" | "red" } {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 24) {
    return { label: "<24h", color: "green" };
  } else if (diffDays < 2) {
    return { label: "1d", color: "green" };
  } else if (diffDays < 3) {
    return { label: "2d", color: "yellow" };
  } else if (diffDays < 7) {
    return { label: `${Math.floor(diffDays)}d`, color: "yellow" };
  } else if (diffDays < 14) {
    return { label: "1w", color: "red" };
  } else if (diffDays < 30) {
    return { label: `${Math.floor(diffDays / 7)}w`, color: "red" };
  } else {
    const months = Math.floor(diffDays / 30);
    return { label: months === 1 ? "1mo" : `${months}mo`, color: "red" };
  }
}

export function TimeBadge({ date }: Props) {
  const { label, color } = getTimeElapsed(date);

  return (
    <span className={`time-badge time-badge-${color}`} title={new Date(date).toLocaleDateString()}>
      <svg
        className="time-badge-icon"
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stopwatch body */}
        <circle cx="12" cy="13" r="9" stroke="currentColor" strokeWidth="2.5" />
        {/* Top button/stem */}
        <rect x="10.5" y="1" width="3" height="4" rx="1" fill="currentColor" />
        {/* Clock hand - quarter fill */}
        <path d="M12 13V7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 13H17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {label}
    </span>
  );
}
