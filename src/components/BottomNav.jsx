import { NavLink, useNavigate } from 'react-router-dom'

const items = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/exercises', label: 'Exercises', icon: '≣' },
  { to: '/programs', label: 'Programs', icon: '▦' },
  { to: '/progress', label: 'Progress', icon: '◔' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  return (
    <nav className="bottom-nav">
      <NavLink to={items[0].to} className="nav-item" end>
        {({ isActive }) => <Tab item={items[0]} active={isActive} />}
      </NavLink>
      <NavLink to={items[1].to} className="nav-item">
        {({ isActive }) => <Tab item={items[1]} active={isActive} />}
      </NavLink>

      <button className="nav-fab" onClick={() => navigate('/workout')} aria-label="Log set">
        <span className="nav-fab-circle">+</span>
        <span className="nav-fab-label">Log set</span>
      </button>

      <NavLink to={items[2].to} className="nav-item">
        {({ isActive }) => <Tab item={items[2]} active={isActive} />}
      </NavLink>
      <NavLink to={items[3].to} className="nav-item">
        {({ isActive }) => <Tab item={items[3]} active={isActive} />}
      </NavLink>
    </nav>
  )
}

function Tab({ item, active }) {
  return (
    <span className={active ? 'tab active' : 'tab'}>
      <span className="tab-icon">{item.icon}</span>
      <span className="tab-label">{item.label}</span>
    </span>
  )
}
