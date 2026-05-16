import { useState } from "react";
import { type ApiToken, type MintedToken, listTokens, mintToken, revokeToken } from "../api/tokens";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function Settings() {
  const qc = useQueryClient();
  const { data: tokens = [], isLoading } = useQuery<ApiToken[]>({
    queryKey: ["tokens"],
    queryFn: listTokens,
  });

  const [newName, setNewName] = useState("");
  const [minted, setMinted] = useState<MintedToken | null>(null);
  const [copied, setCopied] = useState(false);

  const mintMutation = useMutation({
    mutationFn: (name: string) => mintToken(name),
    onSuccess: (data) => {
      setMinted(data);
      setNewName("");
      qc.invalidateQueries({ queryKey: ["tokens"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: number) => revokeToken(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tokens"] }),
  });

  function handleCopy() {
    if (!minted) return;
    navigator.clipboard.writeText(minted.token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="settings-page">
      <h2>Extension Tokens</h2>
      <p className="settings-desc">
        Generate a token once, paste it into the browser extension&apos;s Options page.
        The token value is only shown once — copy it before closing this dialog.
      </p>

      <div className="token-mint-row">
        <input
          className="token-name-input"
          placeholder="Token name (e.g. home-chrome)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) mintMutation.mutate(newName.trim());
          }}
        />
        <button
          className="add-job-btn"
          disabled={!newName.trim() || mintMutation.isPending}
          onClick={() => mintMutation.mutate(newName.trim())}
        >
          Generate token
        </button>
      </div>

      {minted && (
        <div className="token-reveal">
          <p className="token-reveal-label">Copy this token now — it will not be shown again:</p>
          <div className="token-reveal-row">
            <code className="token-value">{minted.token}</code>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button className="token-dismiss" onClick={() => setMinted(null)}>
            I&apos;ve copied it, dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <p>Loading tokens…</p>
      ) : (
        <table className="token-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
              <th>Last used</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t) => (
              <tr key={t.id} className={t.revokedAt ? "token-row-revoked" : ""}>
                <td>{t.name}</td>
                <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td>{t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString() : "Never"}</td>
                <td>{t.revokedAt ? "Revoked" : "Active"}</td>
                <td>
                  {!t.revokedAt && (
                    <button
                      className="revoke-btn"
                      disabled={revokeMutation.isPending}
                      onClick={() => {
                        if (confirm(`Revoke token "${t.name}"? The extension using it will stop working.`)) {
                          revokeMutation.mutate(t.id);
                        }
                      }}
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {tokens.length === 0 && (
              <tr>
                <td colSpan={5} className="token-empty">No tokens yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
