import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { useApplications, useUpdateApplication } from "../hooks/useApplications";
import { STATUSES, STATUS_ORDER, VALID_TRANSITIONS, type Application, type Status } from "../types";
import { CardDetailDrawer } from "./CardDetailDrawer";
import { Column } from "./Column";

export function Board() {
  const { data, isLoading, error } = useApplications();
  const update = useUpdateApplication();
  const [selected, setSelected] = useState<Application | null>(null);
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const grouped = useMemo(() => {
    const out: Record<Status, Application[]> = {
      SAVED: [], APPLIED: [], GHOSTED: [], SCREEN: [], INTERVIEW: [], OFFER: [], REJECTED: [],
    };
    const q = search.toLowerCase().trim();
    for (const a of data ?? []) {
      if (q && !a.company.toLowerCase().includes(q) && !a.position.toLowerCase().includes(q)) continue;
      out[a.status].push(a);
    }
    return out;
  }, [data, search]);

  function onDragEnd(e: DragEndEvent) {
    if (!e.over) return;
    const id = Number(e.active.id);
    const newStatus = e.over.id as Status;
    const current = data?.find((a) => a.id === id);
    if (!current || current.status === newStatus) return;

    const allowed = VALID_TRANSITIONS[current.status];
    const isValidForward = allowed.includes(newStatus);

    if (!isValidForward) {
      // Check if it's a backward move (human error correction)
      const fromOrder = STATUS_ORDER[current.status];
      const toOrder = STATUS_ORDER[newStatus];
      const isBackward = toOrder < fromOrder;

      if (isBackward) {
        const confirmed = window.confirm(
          `Move from ${current.status} back to ${newStatus}? This is unusual — continue?`,
        );
        if (!confirmed) return;
      } else {
        // Invalid forward move (e.g. SAVED→REJECTED, APPLIED→OFFER)
        window.alert(
          `Cannot move directly from ${current.status} to ${newStatus}.`,
        );
        return;
      }
    }

    update.mutate({ id, body: { status: newStatus } });
  }

  if (isLoading) return <div className="state">Loading…</div>;
  if (error) return <div className="state error">Failed to load: {String(error)}</div>;

  return (
    <>
      <div className="board-search">
        <div className="board-search-wrapper">
          <input
            type="text"
            placeholder="Search company or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="board-search-input"
          />
          <svg className="board-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
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
