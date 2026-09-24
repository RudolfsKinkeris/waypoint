import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import GearIcon from './GearIcon.jsx';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/test-cases', label: 'Test Cases' },
  { to: '/test-suites', label: 'Suites' },
  { to: '/test-runs', label: 'Runs' },
  { to: '/flaky-tests', label: 'Flaky Tests' },
  { to: '/bugs', label: 'Bugs' },
  { to: '/reports', label: 'Reports' },
];

function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Collapse the mobile menu automatically after any navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Link to="/" className="top-nav-brand">
          <img src="/logo.svg" alt="" width="26" height="26" className="top-nav-logo" />
          Waypoint
        </Link>

        <button
          type="button"
          className="top-nav-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="top-nav-toggle-bar" />
          <span className="top-nav-toggle-bar" />
          <span className="top-nav-toggle-bar" />
        </button>

        <nav className={`top-nav-links${menuOpen ? ' open' : ''}`}>
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/settings" className="top-nav-icon-link" aria-label="Settings">
            <GearIcon />
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default TopNav;
