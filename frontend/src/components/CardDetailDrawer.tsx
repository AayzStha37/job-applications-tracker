import { useState } from "react";
import {
  useDeleteApplication,
  useUpdateApplication,
} from "../hooks/useApplications";
import type { Application } from "../types";

interface Props {
  application: Application;
  onClose: () => void;
}

export function CardDetailDrawer({ application, onClose }: Props) {
  const [notes, setNotes] = useState(application.notes ?? "");
  const update = useUpdateApplication();
  const del = useDeleteApplication();

  function save() {
    update.mutate(
      { id: application.id, body: { notes } },
      { onSuccess: onClose },
    );
  }

  function remove() {
    if (!confirm("Delete this application?")) return;
    del.mutate(application.id, { onSuccess: onClose });
  }

  function copyTexPath() {
    if (application.tailoredCvPath) {
      navigator.clipboard.writeText(application.tailoredCvPath).catch(() => {});
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>{application.position}</h2>
          <button onClick={onClose} aria-label="close">×</button>
        </div>
        <div className="drawer-body">
          <dl>
            <dt>Company</dt><dd>{application.company}</dd>
            <dt>Location</dt><dd>{application.location ?? "—"}</dd>
            <dt>Source</dt><dd>{application.source}</dd>
            <dt>External ID</dt><dd>{application.externalJobId ?? "—"}</dd>
            <dt>URL</dt><dd><a href={application.url} target="_blank" rel="noreferrer">{application.url}</a></dd>
            <dt>Status</dt><dd>{application.status}</dd>
            <dt>LOC / MAIL</dt><dd>{application.locCode ?? "—"} / {application.mailAlias ?? "—"}</dd>
            <dt>Tailor</dt>
            <dd>
              <span className={`tailor-badge tailor-${application.tailorStatus.toLowerCase()}`}>
                {application.tailorStatus}
              </span>
              {application.tailorError && (
                <div className="tailor-error">{application.tailorError}</div>
              )}
            </dd>
            {application.tailoredCvPath && (
              <>
                <dt>Tex path</dt>
                <dd>
                  <code className="tex-path">{application.tailoredCvPath}</code>
                  <button className="copy-btn" onClick={copyTexPath} type="button">copy</button>
                </dd>
              </>
            )}
            <dt>Created</dt><dd>{new Date(application.createdAt).toLocaleString()}</dd>
            <dt>Updated</dt><dd>{new Date(application.updatedAt).toLocaleString()}</dd>
          </dl>
          <label className="notes-label">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
            />
          </label>
        </div>
        <div className="drawer-footer">
          <button className="danger" onClick={remove}>Delete</button>
          <button className="primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
