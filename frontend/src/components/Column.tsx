import { useDroppable } from "@dnd-kit/core";
import type { Application, Status } from "../types";
import { Card } from "./Card";

interface Props {
  status: Status;
  applications: Application[];
  onOpen: (app: Application) => void;
}

const LABELS: Record<Status, string> = {
  APPLIED: "Applied",
  SCREEN: "Screen",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export function Column({ status, applications, onOpen }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`column ${isOver ? "column-over" : ""}`}
    >
      <div className="column-header">
        <span>{LABELS[status]}</span>
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
