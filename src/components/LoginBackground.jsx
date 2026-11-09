import { useEffect, useMemo, useRef, useState } from 'react'
import { loginMedia } from '../data/loginMedia.js'

const IMAGE_MS = 6000 // how long each still image holds before advancing

// Fisher–Yates shuffle so the order (and first frame) differs every visit.
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function LoginBackground() {
  const media = useMemo(() => shuffle(loginMedia), [])
  const [idx, setIdx] = useState(0)
  const timer = useRef(null)

  const item = media[idx] || media[0]
  const next = () => setIdx((i) => (i + 1) % media.length)

  // Images advance on a timer; videos advance when they finish (onEnded),
  // with a safety timeout in case the video can't play.
  useEffect(() => {
    clearTimeout(timer.current)
    if (media.length < 2) return
    const wait = item.type === 'image' ? IMAGE_MS : 15000
    timer.current = setTimeout(next, wait)
    return () => clearTimeout(timer.current)
  }, [idx])

  if (!item) return null

  return item.type === 'video' ? (
    <video
      key={idx}
      className="login-photo login-fade"
      src={item.src}
      poster={item.poster}
      autoPlay
      muted
      playsInline
      onEnded={next}
    />
  ) : (
    <img key={idx} className="login-photo login-fade login-kenburns" src={item.src} alt="" />
  )
}
