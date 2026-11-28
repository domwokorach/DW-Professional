'use client';

import { Maximize2, Pause, Play, RotateCcw } from 'lucide-react';

/** Play/pause, replay and full-screen buttons shared by animated project previews. */
export default function PreviewPlaybackControls({ playing, onToggle, onReplay, onFullscreen, canFullscreen }: {
  playing: boolean;
  onToggle: () => void;
  onReplay: () => void;
  onFullscreen: () => void;
  canFullscreen: boolean;
}) {
  return (
    <div className="pv-controls" role="group" aria-label="Preview playback controls">
      <button type="button" className="pv-btn" onClick={onToggle} aria-label={playing ? 'Pause preview animation' : 'Play preview animation'}>
        {playing ? <Pause aria-hidden="true" size={14} /> : <Play aria-hidden="true" size={14} />}
        {playing ? 'Pause' : 'Play'}
      </button>
      <button type="button" className="pv-btn" onClick={onReplay} aria-label="Replay preview animation from the start">
        <RotateCcw aria-hidden="true" size={14} />
        Replay
      </button>
      {canFullscreen && (
        <button type="button" className="pv-btn" onClick={onFullscreen} aria-label="View preview animation full screen">
          <Maximize2 aria-hidden="true" size={14} />
          Full screen
        </button>
      )}
    </div>
  );
}
