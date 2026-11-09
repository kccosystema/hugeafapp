import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import { useAuth } from '../lib/auth.jsx'
import { deleteAccount } from '../lib/account.js'
import './DeleteAccount.css'

const DELETES = [
  'Your profile & settings',
  'All logged workouts & history',
  'Your Sweat, level & streaks',
  'Followed programs & joined challenges',
  'Gym Candy ratings',
  'Any custom exercises you created',
]

export default function DeleteAccount() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [step, setStep] = useState('confirm') // confirm | done
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const canDelete = text.trim().toUpperCase() === 'DELETE'

  async function handleDelete() {
    if (!canDelete || busy) return
    setBusy(true)
    const { error } = await deleteAccount()
    setBusy(false)
    if (error) {
      alert(`Couldn't delete your account: ${error.message}`)
      return
    }
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="da da-done fadeup">
        <StatusBar />
        <div className="da-done-inner">
          <div className="da-wave">👋</div>
          <h1 className="da-done-title">Sorry to see<br />you go</h1>
          <p className="da-done-sub">
            Your account and all your data have been permanently deleted. No trace left behind.
            <br /><br />
            Thanks for training with HugeAF — the door's always open if you want to come back and start fresh.
          </p>
          <button className="da-done-btn" onClick={() => { signOut(); navigate('/') }}>Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className="da fadeup">
      <StatusBar />
      <div className="da-bar">
        <button className="da-back" onClick={() => navigate('/profile')}>‹</button>
        <span className="da-bar-title">Delete account</span>
        <span style={{ width: 34 }} />
      </div>

      <div className="da-scroll scrl">
        <div className="da-warn-icon">⚠️</div>
        <h1 className="da-title">Delete your account?</h1>
        <p className="da-lead">This <b>permanently</b> deletes your HugeAF account and <b>everything</b> in it. This can't be undone.</p>

        <div className="da-list">
          {DELETES.map((d) => (
            <div key={d} className="da-list-item"><span>✕</span>{d}</div>
          ))}
        </div>

        <label className="da-confirm-label">Type <b>DELETE</b> to confirm</label>
        <input
          className="da-confirm-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="DELETE"
          autoCapitalize="characters"
          autoCorrect="off"
        />
      </div>

      <div className="da-foot">
        <button className="da-delete" disabled={!canDelete || busy} onClick={handleDelete}>
          {busy ? 'Deleting…' : 'Permanently delete my account'}
        </button>
        <button className="da-cancel" onClick={() => navigate('/profile')}>Keep my account</button>
      </div>
    </div>
  )
}
