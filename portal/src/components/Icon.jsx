const SHAPES = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="1.8" />
    </>
  ),
  phone: (
    <path d="M6.4 3h3.1l1.5 4.1-2.1 1.4a12.4 12.4 0 0 0 5.6 5.6l1.4-2.1L20 13.5v3.1a2.1 2.1 0 0 1-2.3 2.1A16.6 16.6 0 0 1 4.3 5.3 2.1 2.1 0 0 1 6.4 3Z" />
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.4" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>
  ),
  bot: (
    <>
      <rect x="4" y="7.5" width="16" height="12" rx="3.2" />
      <path d="M12 3.2v4.3M9 13.2h.01M15 13.2h.01M9.6 16.8h4.8" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.6" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  logout: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16.5 5.5 12 10 7.5M5.5 12H16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.6" />
      <path d="M16 16l4.4 4.4" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevron: <path d="M6 9.5l6 6 6-6" />,
  play: <path d="M8.5 5.5v13l10.5-6.5-10.5-6.5Z" />,
  check: <path d="M4.5 12.5l4.6 4.6L19.5 6.8" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.6V12l3 1.9" />
    </>
  ),
  trend: <path d="M4 16.6l5.4-5.4 3.4 3.4 6-6M20 8.6h-4.4M20 8.6V13" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  trash: <path d="M4 7h16M9.5 7V5h5v2M6.6 7l.8 12.4h9.2L17.4 7" />,
  sparkle: <path d="M12 3.2l1.7 5.1 5.1 1.7-5.1 1.7L12 16.8l-1.7-5.1L5.2 10l5.1-1.7L12 3.2Z" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="10.5" rx="3" />
      <path d="M5.6 11.4a6.4 6.4 0 0 0 12.8 0M12 17.8V21" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.4" />
      <path d="M3.4 20a5.6 5.6 0 0 1 11.2 0M16 5.6a3.2 3.2 0 0 1 0 6M18.6 20a5.6 5.6 0 0 0-2.2-4.4" />
    </>
  ),
  wave: <path d="M3 12h2.4l2-5 3 10 2.6-7 2 4H21" />,
};

export default function Icon({ name, size = 18, className = '', ...rest }) {
  const shape = SHAPES[name] || SHAPES.grid;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {shape}
    </svg>
  );
}
