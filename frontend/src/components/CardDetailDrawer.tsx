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
  const [company, setCompany] = useState(application.company);
  const [position, setPosition] = useState(application.position);
  const [location, setLocation] = useState(application.location ?? "");
  const [source, setSource] = useState(application.source);
  const [externalJobId, setExternalJobId] = useState(application.externalJobId ?? "");
  const [url, setUrl] = useState(application.url);
  const [updatedAt, setUpdatedAt] = useState(
    application.updatedAt ? new Date(application.updatedAt).toISOString().slice(0, 16) : ""
  );

  const update = useUpdateApplication();
  const del = useDeleteApplication();

  function save() {
    const body: Parameters<typeof update.mutate>[0]["body"] = { notes };
    if (company !== application.company) body.company = company;
    if (position !== application.position) body.position = position;
    if (location !== (application.location ?? "")) body.location = location;
    if (source !== application.source) body.source = source;
    if (externalJobId !== (application.externalJobId ?? "")) body.externalJobId = externalJobId;
    if (url !== application.url) body.url = url;
    const origUpdated = application.updatedAt ? new Date(application.updatedAt).toISOString().slice(0, 16) : "";
    if (updatedAt !== origUpdated) body.updatedAt = new Date(updatedAt).toISOString();

    update.mutate(
      { id: application.id, body },
      { onSuccess: onClose },
    );
  }

  function remove() {
    if (!confirm("Delete this application?")) return;
    del.mutate(application.id, { onSuccess: onClose });
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
            <dt>Company</dt>
            <dd>
              <input
                className="drawer-field-input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </dd>
            <dt>Position</dt>
            <dd>
              <input
                className="drawer-field-input"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </dd>
            <dt>Location</dt>
            <dd>
              <input
                className="drawer-field-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="—"
              />
            </dd>
            <dt>Source</dt>
            <dd>
              <input
                className="drawer-field-input"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </dd>
            <dt>External ID</dt>
            <dd>
              <input
                className="drawer-field-input"
                value={externalJobId}
                onChange={(e) => setExternalJobId(e.target.value)}
                placeholder="—"
              />
            </dd>
            <dt>URL</dt>
            <dd className="drawer-field-row">
              <input
                className="drawer-field-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="url-open-btn"
                  aria-label="Open URL in new tab"
                  title="Open in new tab"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              )}
            </dd>
            <dt>Status</dt>
            <dd>{application.status}</dd>
            <dt>Created</dt>
            <dd>{new Date(application.createdAt).toLocaleString()}</dd>
            <dt>Updated</dt>
            <dd>
              <input
                className="drawer-field-input"
                type="datetime-local"
                value={updatedAt}
                onChange={(e) => setUpdatedAt(e.target.value)}
              />
            </dd>
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
