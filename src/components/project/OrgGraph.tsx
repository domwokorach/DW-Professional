"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { orgNodes, orgLinks, type OrgNode, type OrgNodeType, type OrgLink } from "@/data/orgGraphData";

type SimNode = OrgNode & d3.SimulationNodeDatum;
type SimLink = { source: SimNode; target: SimNode; kind: OrgLink["kind"] };

const TYPE_COLOR: Record<OrgNodeType, string> = {
  organisation: "#5b8def",
  department: "#8b7bf0",
  team: "#6ee7ff",
  role: "#f0b429",
  person: "#e2e8f0",
  project: "#34d399",
};

const TYPE_RADIUS: Record<OrgNodeType, number> = {
  organisation: 22,
  department: 16,
  team: 12,
  role: 8,
  person: 9,
  project: 10,
};

const TYPE_LABEL: Record<OrgNodeType, string> = {
  organisation: "Organisation",
  department: "Department",
  team: "Team",
  role: "Role",
  person: "Person",
  project: "Project / Initiative",
};

const FILTERABLE_TYPES: OrgNodeType[] = ["department", "team", "role", "person", "project"];
const COLLAPSIBLE: OrgNodeType[] = ["department", "team"];

const childrenMap = new Map<string, string[]>();
orgNodes.forEach((n) => {
  if (n.parentId) {
    const arr = childrenMap.get(n.parentId) ?? [];
    arr.push(n.id);
    childrenMap.set(n.parentId, arr);
  }
});
const nodeByIdAll = new Map(orgNodes.map((n) => [n.id, n]));

function directReports(id: string): OrgNode[] {
  return orgNodes.filter(
    (n) => n.managerId === id || (!n.managerId && n.parentId === id && n.type === "person")
  );
}

function descendantPeopleCount(id: string): number {
  let count = 0;
  const stack = [...(childrenMap.get(id) ?? [])];
  while (stack.length) {
    const cur = stack.pop() as string;
    if (nodeByIdAll.get(cur)?.type === "person") count++;
    stack.push(...(childrenMap.get(cur) ?? []));
  }
  return count;
}

export default function OrgGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const positionsRef = useRef(new Map<string, { x: number; y: number }>());

  const [size, setSize] = useState({ width: 800, height: 520 });
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(["team-innovation-lab"])
  );
  const [activeTypes, setActiveTypes] = useState<Set<OrgNodeType>>(
    () => new Set(FILTERABLE_TYPES)
  );
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selected = selectedId ? nodeByIdAll.get(selectedId) ?? null : null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = entry.contentRect.width;
      setSize({ width: Math.max(320, width), height: Math.max(420, Math.min(620, width * 0.6)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { visibleNodes, visibleLinks } = useMemo(() => {
    const hidden = new Set<string>();
    const hideDescendants = (id: string) => {
      for (const childId of childrenMap.get(id) ?? []) {
        if (!hidden.has(childId)) {
          hidden.add(childId);
          hideDescendants(childId);
        }
      }
    };
    collapsed.forEach(hideDescendants);

    const nodes = orgNodes.filter((n) => {
      if (hidden.has(n.id)) return false;
      if (n.type !== "organisation" && !activeTypes.has(n.type)) return false;
      return true;
    });
    const visibleIds = new Set(nodes.map((n) => n.id));
    const links = orgLinks.filter((l) => visibleIds.has(l.source) && visibleIds.has(l.target));
    return { visibleNodes: nodes, visibleLinks: links };
  }, [collapsed, activeTypes]);

  // zoom setup (once)
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on("zoom", (event) => {
        svg.select<SVGGElement>("g.zoom-layer").attr("transform", event.transform.toString());
      });
    svg.call(zoom);
    zoomRef.current = zoom;
    return () => {
      svg.on(".zoom", null);
    };
  }, []);

  // main render effect
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const { width, height } = size;
    const svg = d3.select(svgEl);
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    let g = svg.select<SVGGElement>("g.zoom-layer");
    if (g.empty()) {
      g = svg.append("g").attr("class", "zoom-layer");
      g.append("g").attr("class", "links");
      g.append("g").attr("class", "nodes");
    }

    const simNodes: SimNode[] = visibleNodes.map((n) => {
      const cached = positionsRef.current.get(n.id);
      return {
        ...n,
        x: cached?.x ?? width / 2 + (Math.random() - 0.5) * 60,
        y: cached?.y ?? height / 2 + (Math.random() - 0.5) * 60,
      };
    });
    const simNodeById = new Map(simNodes.map((n) => [n.id, n]));
    const simLinks: SimLink[] = visibleLinks.flatMap((l) => {
      const source = simNodeById.get(l.source);
      const target = simNodeById.get(l.target);
      if (!source || !target) return [];
      return [{ source, target, kind: l.kind }];
    });

    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance((l) => (l.kind === "structure" ? 68 : 105))
          .strength((l) => (l.kind === "structure" ? 0.85 : 0.2))
      )
      .force("charge", d3.forceManyBody().strength(-220))
      .force("collide", d3.forceCollide<SimNode>((d) => TYPE_RADIUS[d.type] + 16))
      .force("x", d3.forceX(width / 2).strength(0.02))
      .force("y", d3.forceY(height / 2).strength(0.02))
      .alpha(0.9)
      .alphaDecay(0.035);

    const linkSel = g
      .select<SVGGElement>("g.links")
      .selectAll<SVGLineElement, SimLink>("line")
      .data(simLinks, (d) => `${(d as SimLink).source.id}-${(d as SimLink).target.id}-${(d as SimLink).kind}`);
    linkSel.exit().transition().duration(200).style("opacity", 0).remove();
    const linkEnter = linkSel
      .enter()
      .append("line")
      .attr("class", (d) => `org-link kind-${d.kind}`)
      .attr("stroke", (d) =>
        d.kind === "structure"
          ? "rgba(255,255,255,0.18)"
          : d.kind === "reporting"
            ? "#5b8def"
            : d.kind === "cross-functional"
              ? "#8b7bf0"
              : "#34d399"
      )
      .attr("stroke-width", (d) => (d.kind === "structure" ? 1.5 : 1.2))
      .attr("stroke-dasharray", (d) =>
        d.kind === "structure" ? null : d.kind === "project" ? "2,3" : "4,3"
      )
      .style("opacity", 0);
    const allLinks = linkEnter.merge(linkSel);
    allLinks.transition().duration(300).style("opacity", 0.9);

    const nodeSel = g
      .select<SVGGElement>("g.nodes")
      .selectAll<SVGGElement, SimNode>("g.node")
      .data(simNodes, (d) => (d as SimNode).id);
    nodeSel.exit().transition().duration(200).style("opacity", 0).remove();

    const nodeEnter = nodeSel
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("data-id", (d) => d.id)
      .style("opacity", 0)
      .style("cursor", "pointer")
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => `${d.name}, ${TYPE_LABEL[d.type]}`);

    nodeEnter
      .append("circle")
      .attr("r", (d) => TYPE_RADIUS[d.type])
      .attr("fill", (d) => TYPE_COLOR[d.type])
      .attr("fill-opacity", (d) => (d.type === "person" ? 0.16 : 0.22))
      .attr("stroke", (d) => TYPE_COLOR[d.type])
      .attr("stroke-width", 1.75);

    nodeEnter
      .append("text")
      .attr("class", "collapse-indicator")
      .attr("text-anchor", "middle")
      .attr("dy", "0.32em")
      .style("font-size", "11px")
      .style("font-family", "monospace")
      .style("fill", "#e2e8f0")
      .style("pointer-events", "none")
      .text((d) =>
        COLLAPSIBLE.includes(d.type) && (childrenMap.get(d.id)?.length ?? 0) > 0
          ? collapsed.has(d.id)
            ? "+"
            : ""
          : ""
      );

    nodeEnter
      .append("text")
      .attr("class", "node-label")
      .attr("y", (d) => TYPE_RADIUS[d.type] + 13)
      .attr("text-anchor", "middle")
      .style("font-family", "monospace")
      .style("font-size", "10px")
      .style("fill", "#a3a3a3")
      .style("pointer-events", "none")
      .text((d) => (d.name.length > 18 ? `${d.name.slice(0, 17)}…` : d.name));

    nodeEnter
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedId(d.id);
      })
      .on("mouseenter", (_event, d) => setHoveredId(d.id))
      .on("mouseleave", () => setHoveredId(null))
      .on("keydown", (event: KeyboardEvent, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setSelectedId(d.id);
        }
      });

    const drag = d3
      .drag<SVGGElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.25).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        positionsRef.current.set(d.id, { x: d.x as number, y: d.y as number });
      });
    nodeEnter.call(drag);

    const nodeMerge = nodeEnter.merge(nodeSel);
    nodeMerge.transition().duration(300).style("opacity", 1);

    simulation.on("tick", () => {
      allLinks
        .attr("x1", (d) => d.source.x as number)
        .attr("y1", (d) => d.source.y as number)
        .attr("x2", (d) => d.target.x as number)
        .attr("y2", (d) => d.target.y as number);
      nodeMerge.attr("transform", (d) => `translate(${d.x},${d.y})`);
      simNodes.forEach((n) => positionsRef.current.set(n.id, { x: n.x as number, y: n.y as number }));
    });

    return () => {
      simulation.stop();
    };
  }, [visibleNodes, visibleLinks, size, collapsed]);

  // hover / selection highlight (lightweight, no rebuild)
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    const activeId = hoveredId ?? selectedId;
    const nodesSel = svg.selectAll<SVGGElement, SimNode>("g.node");
    const linksSel = svg.selectAll<SVGLineElement, SimLink>("line.org-link");

    if (!activeId) {
      nodesSel.style("opacity", 1);
      linksSel.style("opacity", 0.9);
    } else {
      const connected = new Set<string>([activeId]);
      linksSel.each((d) => {
        if (d.source.id === activeId) connected.add(d.target.id);
        if (d.target.id === activeId) connected.add(d.source.id);
      });
      nodesSel.style("opacity", (d) => (connected.has(d.id) ? 1 : 0.22));
      linksSel.style("opacity", (d) =>
        d.source.id === activeId || d.target.id === activeId ? 1 : 0.06
      );
    }

    nodesSel
      .select<SVGCircleElement>("circle")
      .attr("stroke-width", (d) => (d.id === selectedId ? 3 : 1.75));
  }, [hoveredId, selectedId]);

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleType(type: OrgNodeType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function focusOnNode(id: string) {
    // Expand any collapsed ancestors so the node becomes visible.
    setCollapsed((prev) => {
      const next = new Set(prev);
      let current = nodeByIdAll.get(id);
      while (current?.parentId) {
        next.delete(current.parentId);
        current = nodeByIdAll.get(current.parentId);
      }
      return next;
    });
    setSelectedId(id);

    window.setTimeout(() => {
      const svgEl = svgRef.current;
      const zoom = zoomRef.current;
      const pos = positionsRef.current.get(id);
      if (!svgEl || !zoom || !pos) return;
      const transform = d3.zoomIdentity
        .translate(size.width / 2, size.height / 2)
        .scale(1.3)
        .translate(-pos.x, -pos.y);
      d3.select(svgEl).transition().duration(500).call(zoom.transform, transform);
    }, 80);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = search.trim().toLowerCase();
    if (!term) return;
    const match = orgNodes.find((n) => n.name.toLowerCase().includes(term));
    if (match) focusOnNode(match.id);
  }

  const manager = selected?.managerId
    ? nodeByIdAll.get(selected.managerId)
    : selected?.parentId
      ? nodeByIdAll.get(selected.parentId)
      : null;
  const reports = selected ? directReports(selected.id) : [];
  const teamSize =
    selected?.teamSize ?? (selected ? descendantPeopleCount(selected.id) || undefined : undefined);
  const projects = selected?.projectIds
    ?.map((id) => nodeByIdAll.get(id)?.name)
    .filter((n): n is string => Boolean(n));

  return (
    <div className="rounded-2xl border border-line bg-surface/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            list="org-graph-nodes"
            placeholder="Search department, team, role or person…"
            aria-label="Search the organisation graph"
            className="w-64 max-w-full rounded-lg border border-line bg-ink/60 px-3 py-2 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <datalist id="org-graph-nodes">
            {orgNodes.map((n) => (
              <option key={n.id} value={n.name} />
            ))}
          </datalist>
          <button
            type="submit"
            className="rounded-lg border border-line px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted transition-colors hover:border-accent/40 hover:text-white"
          >
            Focus
          </button>
        </form>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by node type">
          {FILTERABLE_TYPES.map((type) => {
            const active = activeTypes.has(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono transition-colors ${
                  active
                    ? "border-accent/40 text-white"
                    : "border-line text-muted opacity-50 hover:opacity-80"
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: TYPE_COLOR[type] }}
                  aria-hidden
                />
                {TYPE_LABEL[type]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden rounded-xl border border-line bg-ink/60"
        >
          <svg
            ref={svgRef}
            width="100%"
            height={size.height}
            role="img"
            aria-label="Interactive organisation graph of Innovation X, showing departments, teams, roles, people, reporting lines and projects."
            onClick={() => setSelectedId(null)}
          />
          <p className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-widest text-muted/70">
            Scroll to zoom · Drag to pan · Drag a node to reposition
          </p>
        </div>

        <div className="rounded-xl border border-line bg-ink/40 p-4">
          {selected ? (
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className="font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: TYPE_COLOR[selected.type] }}
                  >
                    {TYPE_LABEL[selected.type]}
                  </p>
                  <h3 className="mt-1 text-lg font-medium text-white">{selected.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close details"
                  className="text-muted transition-colors hover:text-white"
                >
                  ✕
                </button>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                {selected.title && (
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      Job Title
                    </dt>
                    <dd className="mt-0.5 text-muted">{selected.title}</dd>
                  </div>
                )}
                {selected.department && (
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      Department
                    </dt>
                    <dd className="mt-0.5 text-muted">{selected.department}</dd>
                  </div>
                )}
                {selected.team && (
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      Team
                    </dt>
                    <dd className="mt-0.5 text-muted">{selected.team}</dd>
                  </div>
                )}
                {manager && (
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      Manager
                    </dt>
                    <dd className="mt-0.5 text-muted">{manager.name}</dd>
                  </div>
                )}
                {reports.length > 0 && (
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      Direct Reports ({reports.length})
                    </dt>
                    <dd className="mt-0.5 text-muted">
                      {reports.map((r) => r.name).join(", ")}
                    </dd>
                  </div>
                )}
                {typeof teamSize === "number" && teamSize > 0 && (
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      Team Size
                    </dt>
                    <dd className="mt-0.5 text-muted">{teamSize} people</dd>
                  </div>
                )}
                {selected.responsibilities && (
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      Responsibilities
                    </dt>
                    <dd className="mt-0.5 space-y-1 text-muted">
                      {selected.responsibilities.map((r) => (
                        <p key={r} className="before:mr-1.5 before:text-accent before:content-['—']">
                          {r}
                        </p>
                      ))}
                    </dd>
                  </div>
                )}
                {projects && projects.length > 0 && (
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      Current Projects
                    </dt>
                    <dd className="mt-0.5 text-muted">{projects.join(", ")}</dd>
                  </div>
                )}
                {selected.status && (
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      Status
                    </dt>
                    <dd className="mt-0.5 text-muted">{selected.status}</dd>
                  </div>
                )}
              </dl>

              {COLLAPSIBLE.includes(selected.type) &&
                (childrenMap.get(selected.id)?.length ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleCollapse(selected.id)}
                    className="mt-4 w-full rounded-lg border border-line px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted transition-colors hover:border-accent/40 hover:text-white"
                  >
                    {collapsed.has(selected.id) ? "Expand" : "Collapse"} children
                  </button>
                )}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Click a node to see its details — role, department, manager, direct reports,
              responsibilities and current projects. Click a department or team again to expand
              or collapse it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
