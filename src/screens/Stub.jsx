import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import './Stub.css'

export default function Stub({ title, icon, blurb }) {
  const navigate = useNavigate()
  return (
    <div className="page stub fadeup">
      <StatusBar />
      <header className="home-top">
        <div className="logo" onClick={() => navigate('/')}>HUGE<span>AF</span></div>
      </header>
      <div className="stub-body">
        <div className="stub-icon">{icon}</div>
        <h1 className="stub-title">{title}</h1>
        <p className="stub-blurb">{blurb}</p>
        <span className="stub-soon">Coming soon</span>
        <button className="stub-back" onClick={() => navigate('/')}>← Back to home</button>
      </div>
    </div>
  )
}
