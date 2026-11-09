import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar.jsx'
import { fetchArticles, categories } from '../lib/blog.js'
import './Blog.css'

export default function Blog() {
  const navigate = useNavigate()
  const [cat, setCat] = useState('All')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticles().then((list) => { setArticles(list); setLoading(false) })
  }, [])

  const list = useMemo(
    () => (cat === 'All' ? articles : articles.filter((a) => a.category === cat)),
    [cat, articles]
  )
  const featured = list.find((a) => a.featured) || list[0]
  const rest = list.filter((a) => a.id !== featured?.id)

  return (
    <div className="page blog fadeup">
      <StatusBar />
      <div className="bl-bar">
        <button className="bl-back" onClick={() => navigate('/')}>‹</button>
        <span className="bl-bar-title">The Blog</span>
        <span style={{ width: 34 }} />
      </div>

      <header className="bl-head">
        <h1 className="bl-title">The Blog</h1>
      </header>

      <div className="bl-chips scrl">
        {categories.map((c) => (
          <button key={c} className={`bl-chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {featured && (
        <div className="px">
          <button className="bl-featured" onClick={() => navigate(`/blog/${featured.id}`)}>
            <img src={featured.image} alt="" />
            <div className="bl-featured-scrim" />
            <span className="bl-featured-badge">EDITOR'S PICK</span>
            <div className="bl-featured-body">
              <span className="bl-cat">{featured.category.toUpperCase()}</span>
              <div className="bl-featured-title">{featured.title}</div>
              <div className="bl-featured-meta">{featured.author} · {featured.readMin} min read</div>
            </div>
          </button>
        </div>
      )}

      <div className="bl-list">
        {rest.map((a) => (
          <button key={a.id} className="bl-row" onClick={() => navigate(`/blog/${a.id}`)}>
            <img src={a.image} alt="" className="bl-row-img" />
            <div className="bl-row-meta">
              <span className="bl-cat">{a.category.toUpperCase()}</span>
              <div className="bl-row-title">{a.title}</div>
              <div className="bl-row-read">{a.readMin} min read</div>
            </div>
          </button>
        ))}
        {loading && <div className="bl-empty">Loading…</div>}
        {!loading && rest.length === 0 && !featured && <div className="bl-empty">No articles in this category yet.</div>}
      </div>
    </div>
  )
}
