import { sankey, sankeyLinkHorizontal, SankeyLink, SankeyNode } from "d3-sankey";
import { useState } from "react";
import { useCompaniesForStatus, useTransitions } from "../hooks/useApplications";
import type { TransitionData } from "../types";
import { ContributionMap } from "./ContributionMap";

const STATUS_COLOR: Record<string, string> = {
  SAVED: "#6b7280",
  APPLIED: "#3b82f6",
  GHOSTED: "#4b5563",
  SCREEN: "#a855f7",
  INTERVIEW: "#f59e0b",
  OFFER: "#22c55e",
  REJECTED: "#ef4444",
  ACTIVE: "#1d4ed8",  // virtual sink — apps still in-flight
};

const CLICKABLE = new Set(["SCREEN", "INTERVIEW", "OFFER"]);

interface SankeyNodeData {
  name: string;
}

type SLinkExtra = Record<string, never>;
type SNode = SankeyNode<SankeyNodeData, SLinkExtra>;
type SLink = SankeyLink<SankeyNodeData, SLinkExtra>;

/** Canonical pipeline order — used to detect and drop backward links that cause cycles. */
const PIPELINE_ORDER: Record<string, number> = {
  SAVED: 0,
  APPLIED: 1,
  GHOSTED: 2,
  SCREEN: 3,
  INTERVIEW: 4,
  OFFER: 5,
  REJECTED: 6,
  ACTIVE: 7,  // virtual terminal: apps currently in-flight
};

function buildSankeyData(transitions: TransitionData[]) {
  // Keep only forward transitions (source order < target order) to avoid cycles
  const forwardTransitions = transitions.filter(
    (t) =>
      t.fromStatus &&
      t.toStatus &&
      (PIPELINE_ORDER[t.fromStatus] ?? -1) < (PIPELINE_ORDER[t.toStatus] ?? -1),
  );

  const nodeNames = Array.from(
    new Set(forwardTransitions.flatMap((t) => [t.fromStatus, t.toStatus])),
  ).sort((a, b) => (PIPELINE_ORDER[a] ?? 99) - (PIPELINE_ORDER[b] ?? 99));

  const nodeIndex = new Map(nodeNames.map((n, i) => [n, i]));

  const nodes: SankeyNodeData[] = nodeNames.map((name) => ({ name }));
  const links = forwardTransitions.map((t) => ({
    source: nodeIndex.get(t.fromStatus)!,
    target: nodeIndex.get(t.toStatus)!,
    value: t.count,
  }));

  return { nodes, links };
}

interface CompaniesDialogProps {
  status: string;
  onClose: () => void;
}

function CompaniesDialog({ status, onClose }: CompaniesDialogProps) {
  const { data, isLoading } = useCompaniesForStatus(status);

  return (
    <div className="companies-dialog-overlay" onClick={onClose}>
      <div className="companies-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="companies-dialog-header">
          <h3>Companies — {status}</h3>
          <button onClick={onClose} aria-label="close">×</button>
        </div>
        <div className="companies-dialog-body">
          {isLoading ? (
            <p className="companies-dialog-empty">Loading…</p>
          ) : !data?.companies?.length ? (
            <p className="companies-dialog-empty">No companies found.</p>
          ) : (
            <ul>
              {data.companies.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const SVG_WIDTH = 960;
const SVG_HEIGHT = 500;

export function Dashboard() {
  const { data: transitions, isLoading, error } = useTransitions();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);

  if (isLoading) return <div className="dashboard"><p className="state">Loading…</p></div>;
  if (error) return <div className="dashboard"><p className="state error">Failed to load transition data.</p></div>;
  if (!transitions || transitions.length === 0) {
    return (
      <div className="dashboard">
        <ContributionMap />
        <h2 style={{ marginTop: 32 }}>Application Flow</h2>
        <div className="sankey-container">
          <p className="sankey-empty">No transition data yet. Start moving applications between stages to see the flow.</p>
        </div>
      </div>
    );
  }

  const { nodes, links } = buildSankeyData(transitions);

  const layout = sankey<SankeyNodeData, SLinkExtra>()
    .nodeWidth(18)
    .nodePadding(20)
    .extent([[24, 24], [SVG_WIDTH - 24, SVG_HEIGHT - 24]]);

  let graph: { nodes: SNode[]; links: SLink[] };
  try {
    graph = layout({
      nodes: nodes.map((d) => ({ ...d })),
      links: links.map((d) => ({ ...d })) as SLink[],
    });
  } catch {
    return (
      <div className="dashboard">
        <h2>Application Flow</h2>
        <div className="sankey-container">
          <p className="sankey-empty">Could not render Sankey diagram with current data.</p>
        </div>
      </div>
    );
  }

  const linkPath = sankeyLinkHorizontal<SankeyNodeData, SLinkExtra>();

  return (
    <div className="dashboard">
      <ContributionMap />

      <h2 style={{ marginTop: 32 }}>Application Flow</h2>
      <div className="sankey-container">
        <svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          style={{ display: "block", maxWidth: "100%" }}
        >
          <defs>
            {graph.links.map((link, i) => {
              const srcName = (link.source as SNode).name;
              const tgtName = (link.target as SNode).name;
              return (
                <linearGradient
                  key={i}
                  id={`grad-${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1={(link.source as SNode).x1 ?? 0}
                  x2={(link.target as SNode).x0 ?? 0}
                >
                  <stop offset="0%" stopColor={STATUS_COLOR[srcName] ?? "#888"} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={STATUS_COLOR[tgtName] ?? "#888"} stopOpacity={0.5} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Links */}
          <g fill="none">
            {graph.links.map((link, i) => {
              const isHover = hoveredLink === i;
              const isDimmed = hoveredLink !== null && !isHover;
              return (
                <path
                  key={i}
                  d={linkPath(link) ?? undefined}
                  stroke={`url(#grad-${i})`}
                  strokeWidth={Math.max(1, link.width ?? 1)}
                  strokeOpacity={isHover ? 0.9 : isDimmed ? 0.15 : 0.55}
                  style={{ transition: "stroke-opacity 0.15s ease", cursor: "default" }}
                  onMouseEnter={() => setHoveredLink(i)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <title>
                    {(link.source as SNode).name} → {(link.target as SNode).name}: {link.value} apps
                  </title>
                </path>
              );
            })}
          </g>

          {/* Nodes */}
          {graph.nodes.map((node, i) => {
            const x0 = node.x0 ?? 0;
            const x1 = node.x1 ?? 0;
            const y0 = node.y0 ?? 0;
            const y1 = node.y1 ?? 0;
            const nodeHeight = y1 - y0;
            const color = STATUS_COLOR[node.name] ?? "#888";
            const isClickable = CLICKABLE.has(node.name);
            const isVirtual = node.name === "ACTIVE";
            const labelX = x0 > SVG_WIDTH / 2 ? x0 - 6 : x1 + 6;
            const labelAnchor = x0 > SVG_WIDTH / 2 ? "end" : "start";
            const cy = (y0 + y1) / 2;

            return (
              <g
                key={i}
                style={{ cursor: isClickable ? "pointer" : "default" }}
                onClick={() => isClickable && setSelectedStatus(node.name)}
              >
                <rect
                  x={x0}
                  y={y0}
                  width={x1 - x0}
                  height={nodeHeight}
                  fill={color}
                  rx={4}
                  opacity={0.9}
                />
                {(isClickable || isVirtual) && (
                  <rect
                    x={x0 - 2}
                    y={y0 - 2}
                    width={x1 - x0 + 4}
                    height={nodeHeight + 4}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    strokeDasharray={isVirtual ? "4 3" : undefined}
                    rx={5}
                    opacity={0.4}
                  />
                )}
                <text
                  x={labelX}
                  y={cy}
                  textAnchor={labelAnchor}
                  dominantBaseline="middle"
                  fontSize={12}
                  fontFamily="Inter, sans-serif"
                  fill={isVirtual ? "#93c5fd" : "#f0f0f0"}
                >
                  {isVirtual ? `Active (${node.value ?? 0})` : `${node.name} (${node.value ?? 0})`}
                  {isClickable ? " ↗" : ""}
                </text>
              </g>
            );
          })}
        </svg>
        {CLICKABLE.size > 0 && (
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
            Hover a flow to highlight it · Click <strong>SCREEN</strong>, <strong>INTERVIEW</strong>, or <strong>OFFER</strong> to see companies · <em style={{ color: "#93c5fd" }}>Active</em> = currently in-flight
          </p>
        )}
      </div>

      {selectedStatus && (
        <CompaniesDialog
          status={selectedStatus}
          onClose={() => setSelectedStatus(null)}
        />
      )}
    </div>
  );
}
