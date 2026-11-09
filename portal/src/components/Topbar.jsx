import Icon from './Icon.jsx';

export default function Topbar({ title, subtitle, actions, onMenu }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="topbar">
      <button className="icon-btn hamburger" onClick={onMenu} aria-label="Open navigation">
        <Icon name="menu" size={19} />
      </button>
      <div className="topbar-title">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="topbar-actions">
        <span className="topbar-date">{today}</span>
        {actions}
      </div>
    </header>
  );
}
