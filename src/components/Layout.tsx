import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/earning', label: 'Earning', icon: '💼', end: false },
  { to: '/upload', label: '', icon: '+', end: false, upload: true },
  { to: '/messages', label: 'Inbox', icon: '💬', end: false },
  { to: '/profile', label: 'Me', icon: '👤', end: false },
]

export default function Layout() {
  return (
    <div className="app-shell">
      <div className="page">
        <Outlet />
      </div>
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `nav-item ${item.upload ? 'upload' : ''} ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
