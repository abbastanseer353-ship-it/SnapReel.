import { NavLink, Outlet } from 'react-router-dom'
import { useUnreadTotal } from '../lib/chatState'

const navItems = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/earning', label: 'Earning', icon: '💼', end: false },
  { to: '/create', label: '', icon: '+', end: false, upload: true },
  { to: '/messages', label: 'Inbox', icon: '💬', end: false, badge: true },
  { to: '/profile', label: 'Me', icon: '👤', end: false },
]

export default function Layout() {
  const unread = useUnreadTotal()

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
            <span className="nav-icon" style={{ position: 'relative' }}>
              {item.icon}
              {item.badge && unread > 0 && (
                <span className="nav-badge">{unread > 99 ? '99+' : unread}</span>
              )}
            </span>
            {item.label && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
