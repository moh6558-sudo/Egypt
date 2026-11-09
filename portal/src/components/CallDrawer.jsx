import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import StatusPill from './StatusPill.jsx';
import { api } from '../api.js';
import { formatDateTime, formatDuration } from '../lib/format.js';

export default function CallDrawer({ callId, onClose }) {
  const [log, setLog] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api(`/api/call-logs/${callId}`)
      .then((data) => {
        if (alive) setLog(data);
      })
      .catch((err) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [callId]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Call detail">
        <div className="drawer-head">
          <div className="avatar" style={{ width: 40, height: 40, flexBasis: 40, fontSize: 14 }}>
            <Icon name="phone" size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 15 }}>{log ? log.caller_name : 'Call detail'}</h3>
            <p style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 3 }}>
              {log ? log.caller_phone : 'Loading…'}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {error ? <div className="form-error">{error}</div> : null}

          {!log && !error ? (
            <>
              <div className="skeleton" style={{ height: 64 }} />
              <div className="skeleton" style={{ height: 140 }} />
            </>
          ) : null}

          {log ? (
            <>
              <div className="detail-grid">
                <div className="detail">
                  <span className="k">Outcome</span>
                  <span className="v">
                    <StatusPill value={log.outcome} />
                  </span>
                </div>
                <div className="detail">
                  <span className="k">Duration</span>
                  <span className="v">{formatDuration(log.duration_seconds)}</span>
                </div>
                <div className="detail">
                  <span className="k">Received</span>
                  <span className="v">{formatDateTime(log.occurred_at)}</span>
                </div>
                <div className="detail">
                  <span className="k">Caller number</span>
                  <span className="v">{log.caller_phone || 'Unknown'}</span>
                </div>
              </div>

              <div>
                <div className="section-title">Summary</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.7, color: '#c8d1e0' }}>{log.summary}</p>
              </div>

              <div>
                <div className="section-title">Recording</div>
                {log.recording_url ? (
                  <audio controls src={log.recording_url} style={{ width: '100%' }} />
                ) : (
                  <div className="audio-shell">
                    <span className="play-btn" aria-hidden="true">
                      <Icon name="play" size={14} />
                    </span>
                    <span>No recording stored for this call.</span>
                  </div>
                )}
              </div>

              <div>
                <div className="section-title">Full transcript</div>
                <div className="transcript">
                  {(log.transcript || 'No transcript available.').split('\n').map((line, index) => (
                    <div
                      key={index}
                      className={`tl ${line.startsWith('Agent:') ? 'agent' : ''}`}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
}
