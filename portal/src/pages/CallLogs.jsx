import { useEffect, useState } from 'react';
import CallDrawer from '../components/CallDrawer.jsx';
import Icon from '../components/Icon.jsx';
import StatusPill from '../components/StatusPill.jsx';
import { api } from '../api.js';
import { formatDateTime, formatDuration } from '../lib/format.js';

const FILTERS = ['All', 'Booked', 'Inquiry', 'Missed'];

export default function CallLogs() {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    let alive = true;
    const run = () => {
      const params = new URLSearchParams();
      if (filter !== 'All') params.set('outcome', filter);
      if (query.trim()) params.set('q', query.trim());
      api(`/api/call-logs?${params.toString()}`)
        .then((data) => {
          if (alive) {
            setLogs(data);
            setError('');
          }
        })
        .catch((err) => {
          if (alive) setError(err.message);
        });
    };
    const timer = setTimeout(run, query ? 220 : 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [filter, query]);

  return (
    <>
      <div className="card">
        <div className="toolbar">
          <div className="seg" role="tablist" aria-label="Filter by outcome">
            {FILTERS.map((option) => (
              <button
                key={option}
                role="tab"
                aria-selected={filter === option}
                className={filter === option ? 'on' : ''}
                onClick={() => setFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <label className="search">
            <Icon name="search" size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search caller, number, summary…"
              aria-label="Search call logs"
            />
          </label>
        </div>

        {error ? (
          <div className="empty">
            <div className="empty-icon">
              <Icon name="close" size={19} />
            </div>
            <h4>Could not load calls</h4>
            <p>{error}</p>
          </div>
        ) : null}

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Caller</th>
                <th>Outcome</th>
                <th>Duration</th>
                <th>Summary</th>
                <th>Received</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {logs === null ? (
                <tr>
                  <td colSpan={6}>
                    <div className="skeleton" style={{ height: 42, margin: '10px 0' }} />
                    <div className="skeleton" style={{ height: 42, margin: '10px 0' }} />
                  </td>
                </tr>
              ) : null}

              {logs?.map((log) => (
                <tr key={log.id} className="clickable" onClick={() => setActiveId(log.id)}>
                  <td>
                    <div className="cell-main">{log.caller_name || 'Unknown caller'}</div>
                    <div className="cell-sub">{log.caller_phone}</div>
                  </td>
                  <td>
                    <StatusPill value={log.outcome} />
                  </td>
                  <td className="cell-num">{formatDuration(log.duration_seconds)}</td>
                  <td className="cell-muted">
                    <div className="truncate">{log.summary}</div>
                  </td>
                  <td className="cell-num">{formatDateTime(log.occurred_at)}</td>
                  <td>
                    <div className="row-actions">
                      <Icon name="chevron" size={15} style={{ transform: 'rotate(-90deg)', color: 'var(--muted-2)' }} />
                    </div>
                  </td>
                </tr>
              ))}

              {logs && logs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <div className="empty-icon">
                        <Icon name="phone" size={19} />
                      </div>
                      <h4>No calls match this view</h4>
                      <p>Try a different outcome filter or clear the search.</p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {activeId ? <CallDrawer callId={activeId} onClose={() => setActiveId(null)} /> : null}
    </>
  );
}
