'use client';

import { ChevronsDownUp, ChevronsUpDown, Maximize, Minimize, RotateCcw, ScanSearch, ZoomIn, ZoomOut } from 'lucide-react';
import type { ReactNode } from 'react';

function Tool({ label, onClick, children, pressed }: { label: string; onClick: () => void; children: ReactNode; pressed?: boolean }) {
  return (
    <button type="button" className="ig-tool" onClick={onClick} aria-label={label} title={label} aria-pressed={pressed}>
      {children}
    </button>
  );
}

/** Graph exploration controls: zoom, fit, expand/collapse departments, reset and full screen. */
export default function GraphToolbar({ onZoomIn, onZoomOut, onFit, onCollapseAll, onExpandAll, onReset, onFullscreen, isFullscreen, canFullscreen }: {
  onZoomIn: () => void; onZoomOut: () => void; onFit: () => void; onCollapseAll: () => void; onExpandAll: () => void;
  onReset: () => void; onFullscreen: () => void; isFullscreen: boolean; canFullscreen: boolean;
}) {
  return (
    <div className="ig-toolbar" role="toolbar" aria-label="Graph controls">
      <Tool label="Zoom in" onClick={onZoomIn}><ZoomIn aria-hidden="true" size={16} /></Tool>
      <Tool label="Zoom out" onClick={onZoomOut}><ZoomOut aria-hidden="true" size={16} /></Tool>
      <Tool label="Fit graph to screen" onClick={onFit}><ScanSearch aria-hidden="true" size={16} /></Tool>
      <Tool label="Collapse all departments" onClick={onCollapseAll}><ChevronsDownUp aria-hidden="true" size={16} /></Tool>
      <Tool label="Expand all departments and teams" onClick={onExpandAll}><ChevronsUpDown aria-hidden="true" size={16} /></Tool>
      <Tool label="Reset graph" onClick={onReset}><RotateCcw aria-hidden="true" size={16} /></Tool>
      {canFullscreen && (
        <Tool label={isFullscreen ? 'Exit full screen' : 'View graph full screen'} onClick={onFullscreen}>
          {isFullscreen ? <Minimize aria-hidden="true" size={16} /> : <Maximize aria-hidden="true" size={16} />}
        </Tool>
      )}
    </div>
  );
}
