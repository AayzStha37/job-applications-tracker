import { useDroppable } from "@dnd-kit/core";
import type { Application, Status } from "../types";
import { Card } from "./Card";

interface Props {
  status: Status;
  applications: Application[];
  onOpen: (app: Application) => void;
}

const LABELS: Record<Status, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  SCREEN: "Screen",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const svgProps = {
  className: "column-icon",
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
} as const;

function StatusIcon({ status }: { status: Status }) {
  switch (status) {
    case "SAVED":
      // Bookmark
      return (
        <svg {...svgProps}>
          <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v18l-7-4-7 4V4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "APPLIED":
      // Paper plane / send
      return (
        <svg {...svgProps}>
          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "SCREEN":
      // Phone
      return (
        <svg {...svgProps}>
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "INTERVIEW":
      // Users / people
      return (
        <svg {...svgProps}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "OFFER":
      // Trophy / star
      return (
        <svg {...svgProps}>
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "REJECTED":
      // X circle
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

export function Column({ status, applications, onOpen }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`column ${isOver ? "column-over" : ""}`}
    >
      <div className="column-header">
        <span className="column-label">
          <StatusIcon status={status} />
          {LABELS[status]}
        </span>
        <span className="column-count">{applications.length}</span>
      </div>
      <div className="column-body">
        {applications.map((a) => (
          <Card key={a.id} application={a} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
