import { useState } from "react";
import { useCreateApplication } from "../hooks/useApplications";

interface Props {
  onClose: () => void;
}

export function AddJobModal({ onClose }: Props) {
  const create = useCreateApplication();
  const [form, setForm] = useState({
    company: "",
    position: "",
    location: "",
    url: "",
    source: "manual",
    externalJobId: "",
    notes: "",
  });

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      {
        company: form.company,
        position: form.position,
        location: form.location || undefined,
        url: form.url,
        source: form.source,
        externalJobId: form.externalJobId || undefined,
        notes: form.notes || undefined,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Add Job</h2>
          <button onClick={onClose} aria-label="close">×</button>
        </div>
        <form className="add-form" onSubmit={handleSubmit}>
          <label>
            Company
            <input value={form.company} onChange={set("company")} required />
          </label>
          <label>
            Position
            <input value={form.position} onChange={set("position")} required />
          </label>
          <label>
            Location
            <input value={form.location} onChange={set("location")} />
          </label>
          <label>
            URL
            <input value={form.url} onChange={set("url")} required type="url" />
          </label>
          <label>
            Source
            <input value={form.source} onChange={set("source")} required />
          </label>
          <label>
            Job ID
            <input value={form.externalJobId} onChange={set("externalJobId")} />
          </label>
          <label>
            Notes
            <textarea value={form.notes} onChange={set("notes")} rows={3} />
          </label>
          <div className="add-form-actions">
            <button type="button" className="cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary" disabled={create.isPending}>
              {create.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
