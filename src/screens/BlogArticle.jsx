import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchArticle } from '../lib/blog.js'
import './BlogArticle.css'

export default function BlogArticle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchArticle(id).then((a) => { if (alive) { setArticle(a); setLoading(false) } })
    return () => { alive = false }
  }, [id])

  if (loading) {
    return (
      <div className="page ba">
        <div className="ba-notfound">
          <button className="ba-round" onClick={() => navigate('/blog')}>‹</button>
          <div className="ba-msg">Loading…</div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="page ba">
        <div className="ba-notfound">
          <button className="ba-round" onClick={() => navigate('/blog')}>‹</button>
          <div className="ba-msg">Article not found.</div>
        </div>
      </div>
    )
  }

  function share() {
    const url = window.location.href
    if (navigator.share) navigator.share({ title: article.title, url }).catch(() => {})
    else { navigator.clipboard?.writeText(url); alert('Link copied') }
  }

  return (
    <div className="page ba fadeup">
      <div className="ba-hero">
        <img src={article.image} alt="" className="ba-hero-img" />
        <div className="ba-hero-scrim" />
        <div className="ba-hero-actions">
          <button className="ba-round" onClick={() => navigate(-1)} aria-label="Back">‹</button>
          <button className="ba-round" onClick={share} aria-label="Share">↗</button>
        </div>
        <div className="ba-hero-body">
          <span className="ba-cat">{article.category.toUpperCase()}</span>
          <h1 className="ba-title">{article.title}</h1>
          <div className="ba-byline">
            <span className="ba-avatar">{article.authorInitials}</span>
            <span className="ba-byline-text">{article.author} · {article.date} · {article.readMin} min read</span>
          </div>
        </div>
      </div>

      <article className="ba-body">
        {article.body.map((block, i) => {
          if (block.type === 'h2') return <h2 key={i} className="ba-h2">{block.text}</h2>
          if (block.type === 'quote') return (
            <blockquote key={i} className="ba-quote"><p>“{block.text}”</p></blockquote>
          )
          if (block.type === 'takeaways') return (
            <div key={i} className="ba-takeaways">
              <div className="ba-takeaways-head">Key takeaways</div>
              <div className="ba-takeaways-list">
                {block.items.map((it, j) => (
                  <div key={j} className="ba-takeaway"><span>✓</span><span>{it}</span></div>
                ))}
              </div>
            </div>
          )
          return <p key={i} className="ba-p">{block.text}</p>
        })}
      </article>
    </div>
  )
}
