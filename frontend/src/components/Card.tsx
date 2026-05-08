import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Application } from "../types";
import { TimeBadge } from "./TimeBadge";

interface Props {
  application: Application;
  onOpen: (app: Application) => void;
}

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
      <div className="card-top-row">
        <div className="card-company">{application.company}</div>
        <TimeBadge date={application.statusChangedAt ?? application.createdAt} />
      </div>
      <div className="card-position">{application.position}</div>
      {application.location && (
        <div className="card-location">{application.location}</div>
      )}
      <div className="card-source">{application.source}</div>
    </div>
  );
}
