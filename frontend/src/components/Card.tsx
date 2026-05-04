import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Application, TailorStatus } from "../types";

interface Props {
  application: Application;
  onOpen: (app: Application) => void;
}

const TAILOR_BADGE_TEXT: Record<TailorStatus, string> = {
  PENDING: "tailor: pending",
  TAILORED: "tailor: ready",
  FAILED: "tailor: failed",
  SKIPPED: "tailor: skipped",
};

export function Card({ application, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: application.id });

  return (
    <div
      ref={setNodeRef}
      className="card"
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
      onDoubleClick={() => onOpen(application)}
    >
      <div className="card-company">{application.company}</div>
      <div className="card-position">{application.position}</div>
      {application.location && (
        <div className="card-location">{application.location}</div>
      )}
      <div className="card-meta">
        <span className="card-source">{application.source}</span>
        <span
          className={`tailor-badge tailor-${application.tailorStatus.toLowerCase()}`}
          title={application.tailorError ?? TAILOR_BADGE_TEXT[application.tailorStatus]}
        >
          {TAILOR_BADGE_TEXT[application.tailorStatus]}
        </span>
      </div>
    </div>
  );
}
