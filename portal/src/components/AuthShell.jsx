import Icon from './Icon.jsx';

const POINTS = [
  'Answers every call in your brand voice, 24/7.',
  'Books straight into your calendar and logs the details.',
  'Keeps each client’s data completely separate.',
];

export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <aside className="auth-aside">
        <div className="auth-logo">
          <div className="brand-mark">
            <Icon name="wave" size={19} />
          </div>
          <div>
            <div className="brand-name">Voxa</div>
            <div className="brand-sub">White-label voice AI</div>
          </div>
        </div>

        <div className="auth-copy">
          <h2>Your AI receptionist,<br />on every call.</h2>
          <p>
            One portal for the businesses you look after — live call logs, transcripts, bookings
            and agent settings, each behind its own secure workspace.
          </p>
          <div className="auth-points">
            {POINTS.map((point) => (
              <div className="auth-point" key={point}>
                <span className="dot">
                  <Icon name="check" size={13} />
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: 11.5, color: 'var(--muted-2)' }}>
          © {new Date().getFullYear()} Voxa · White-label AI receptionist platform
        </div>
      </aside>

      <div className="auth-panel">{children}</div>
    </div>
  );
}
