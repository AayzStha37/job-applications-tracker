import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { useApplications, useUpdateApplication } from "../hooks/useApplications";
import { STATUSES, type Application, type Status } from "../types";
import { CardDetailDrawer } from "./CardDetailDrawer";
import { Column } from "./Column";

export function Board() {
  const { data, isLoading, error } = useApplications();
  const update = useUpdateApplication();
  const [selected, setSelected] = useState<Application | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const grouped = useMemo(() => {
    const out: Record<Status, Application[]> = {
      APPLIED: [], SCREEN: [], INTERVIEW: [], OFFER: [], REJECTED: [], WITHDRAWN: [],
    };
    for (const a of data ?? []) out[a.status].push(a);
    return out;
  }, [data]);

  function onDragEnd(e: DragEndEvent) {
    if (!e.over) return;
    const id = Number(e.active.id);
    const status = e.over.id as Status;
    const current = data?.find((a) => a.id === id);
    if (!current || current.status === status) return;
    update.mutate({ id, body: { status } });
  }

  if (isLoading) return <div className="state">Loading…</div>;
  if (error) return <div className="state error">Failed to load: {String(error)}</div>;

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="board">
          {STATUSES.map((s) => (
            <Column
              key={s}
              status={s}
              applications={grouped[s]}
              onOpen={setSelected}
            />
          ))}
        </div>
      </DndContext>
      {selected && (
        <CardDetailDrawer
          application={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
