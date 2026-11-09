import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CallDrawer from '../components/CallDrawer.jsx';
import Icon from '../components/Icon.jsx';
import StatusPill from '../components/StatusPill.jsx';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, formatDateTime, formatDuration, formatTime } from '../lib/format.js';

function StatCard({ label, value, icon, foot }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">
          <Icon name={icon} size={15} />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">{foot}</div>
    </div>
  );
}

export default function Dashboard() {
  const { company } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activeCall, setActiveCall] = useState(null);

  useEffect(() => {
    let alive = true;
    api('/api/dashboard')
      .then((payload) => {
        if (alive) setData(payload);
      })
      .catch((err) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  if (error) {
    return (
      <div className="card">
        <div className="empty">
          <div className="empty-icon">
            <Icon name="close" size={19} />
          </div>
          <h4>Could not load your dashboard</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="stat-grid">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="skeleton" style={{ height: 116 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 250 }} />
      </div>
    );
  }

  const { stats, volume, outcomes, recent_calls: recentCalls, upcoming } = data;
  const maxVolume = Math.max(1, ...volume.map((point) => point.count));
  const totalOutcomes = Math.max(1, outcomes.reduce((sum, item) => sum + item.count, 0));
  const delta = stats.calls_30d - stats.calls_prev_30d;
  const deltaTone = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const deltaLabel =
    delta === 0
      ? 'Same as previous 30 days'
      : `${delta > 0 ? '+' : ''}${delta} vs previous 30 days`;
  const avgTalk = stats.calls_30d ? Math.round(stats.talk_minutes_30d / stats.calls_30d) : 0;

  return (
    <>
      <div className="page-head">
        <div className="grow">
          <h2>Overview · last 30 days</h2>
          <div className="headline">
            {greeting}
            {company?.name ? `, ${company.name}` : ''}
          </div>
          <p className="sub">
            Your receptionist answered {stats.calls_30d} call{stats.calls_30d === 1 ? '' : 's'} and
            booked {stats.booked_30d} appointment{stats.booked_30d === 1 ? '' : 's'}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link className="btn" to="/calls">
            <Icon name="phone" size={15} />
            View call logs
          </Link>
          <Link className="btn btn-primary" to="/appointments">
            <Icon name="calendar" size={15} />
            Appointments
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="Calls answered"
          value={stats.calls_30d}
          icon="phone"
          foot={
            <>
              <span className={`delta ${deltaTone}`}>{deltaLabel}</span>
            </>
          }
        />
        <StatCard
          label="Appointments booked"
          value={stats.booked_30d}
          icon="calendar"
          foot={<span>{stats.booking_rate}% of calls converted</span>}
        />
        <StatCard
          label="Talk time"
          value={`${stats.talk_minutes_30d}m`}
          icon="clock"
          foot={<span>≈ {avgTalk} min per call</span>}
        />
        <StatCard
          label="Upcoming appointments"
          value={stats.upcoming_appointments}
          icon="users"
          foot={<span>{stats.missed_30d} call{stats.missed_30d === 1 ? '' : 's'} missed this month</span>}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Call volume</h3>
              <p>Answered calls per day, last 14 days</p>
            </div>
            <div className="spacer" />
            <span className="pill neutral">{stats.calls_30d} in 30 days</span>
          </div>
          <div className="card-body">
            <div className="chart">
              {volume.map((point, index) => (
                <div className="chart-col" key={point.date} title={`${point.count} calls`}>
                  <div className="chart-bar-wrap">
                    <div
                      className={`chart-bar ${point.count === 0 ? 'muted' : ''}`}
                      style={{ height: `${Math.max(3, (point.count / maxVolume) * 100)}%` }}
                    />
                  </div>
                  <span className="chart-label">
                    {index % 2 === 1 || index === volume.length - 1
                      ? new Date(`${point.date}T00:00:00`).getDate()
                      : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>Call outcomes</h3>
              <p>How your agent resolved each call</p>
            </div>
          </div>
          <div className="card-body">
            {outcomes.map((item) => (
              <div className="outcome-row" key={item.outcome}>
                <div className="outcome-top">
                  <span style={{ color: '#cdd6e6' }}>{item.outcome}</span>
                  <span>
                    {item.count} · {Math.round((item.count / totalOutcomes) * 100)}%
                  </span>
                </div>
                <div className="outcome-track">
                  <div
                    className={`outcome-fill ${item.outcome}`}
                    style={{ width: `${Math.max(3, (item.count / totalOutcomes) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Recent calls</h3>
              <p>Newest first</p>
            </div>
            <div className="spacer" />
            <Link className="btn btn-sm btn-ghost" to="/calls">
              All calls
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Caller</th>
                  <th>Outcome</th>
                  <th>Duration</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map((log) => (
                  <tr key={log.id} className="clickable" onClick={() => setActiveCall(log.id)}>
                    <td>
                      <div className="cell-main">{log.caller_name || 'Unknown caller'}</div>
                      <div className="cell-sub">{log.caller_phone}</div>
                    </td>
                    <td>
                      <StatusPill value={log.outcome} />
                    </td>
                    <td className="cell-num">{formatDuration(log.duration_seconds)}</td>
                    <td className="cell-muted">{formatDateTime(log.occurred_at)}</td>
                  </tr>
                ))}
                {recentCalls.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty">
                        <h4>No calls yet</h4>
                        <p>As soon as your agent answers a call it will appear here.</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>Upcoming</h3>
              <p>Scheduled appointments</p>
            </div>
            <div className="spacer" />
            <Link className="btn btn-sm btn-ghost" to="/appointments">
              Open
            </Link>
          </div>
          <div className="card-body" style={{ display: 'grid', gap: 12 }}>
            {upcoming.length === 0 ? (
              <div className="empty" style={{ padding: '26px 8px' }}>
                <h4>Nothing booked yet</h4>
                <p>Appointments your agent books show up here.</p>
              </div>
            ) : (
              upcoming.map((appointment) => (
                <div
                  key={appointment.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    paddingBottom: 12,
                    borderBottom: '1px solid #171d27',
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      flex: '0 0 46px',
                      borderRadius: 10,
                      border: '1px solid var(--line)',
                      background: '#111722',
                      textAlign: 'center',
                      padding: '6px 0',
                    }}
                  >
                    <div style={{ fontSize: 10, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {new Date(appointment.scheduled_at).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 680 }}>{formatDate(appointment.scheduled_at).split(' ')[1]}</div>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="cell-main" style={{ fontSize: 13 }}>
                      {appointment.customer_name}
                    </div>
                    <div className="cell-sub">{appointment.service || 'Service not specified'}</div>
                    <div className="cell-sub" style={{ marginTop: 3 }}>
                      {formatTime(appointment.scheduled_at)}
                    </div>
                  </div>
                  <StatusPill value={appointment.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {activeCall ? <CallDrawer callId={activeCall} onClose={() => setActiveCall(null)} /> : null}
    </>
  );
}
