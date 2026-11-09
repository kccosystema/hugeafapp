import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav.jsx'
import './components/BottomNav.css'
import './components/StatusBar.css'

import Home from './screens/Home.jsx'
import Workout from './screens/Workout.jsx'
import Progress from './screens/Progress.jsx'
import Exercises from './screens/Exercises.jsx'
import ExerciseDetail from './screens/ExerciseDetail.jsx'
import Programs from './screens/Programs.jsx'
import ProgramDetail from './screens/ProgramDetail.jsx'
import TenByThree from './screens/TenByThree.jsx'
import Challenges from './screens/Challenges.jsx'
import ChallengeDetail from './screens/ChallengeDetail.jsx'
import Blog from './screens/Blog.jsx'
import BlogArticle from './screens/BlogArticle.jsx'
import FormGuides from './screens/FormGuides.jsx'
import FormGuideDetail from './screens/FormGuideDetail.jsx'
import GymCandy from './screens/GymCandy.jsx'
import GymCandyForm from './screens/GymCandyForm.jsx'
import Profile from './screens/Profile.jsx'
import ProfileEdit from './screens/ProfileEdit.jsx'
import DeleteAccount from './screens/DeleteAccount.jsx'
import Stub from './screens/Stub.jsx'
import Login from './screens/Login.jsx'
import Onboarding from './screens/Onboarding.jsx'
import { useAuth } from './lib/auth.jsx'

export default function App() {
  const location = useLocation()
  const { session, loading, profile, profileLoading } = useAuth()

  // Fullscreen screens (own bars/actions) hide the app bottom nav.
  // Gym Candy add/edit sheet is fullscreen; the /gym-candy dashboard keeps the nav.
  const hideNav = location.pathname === '/workout'
    || location.pathname.startsWith('/gym-candy/')
    || location.pathname === '/profile/edit'
    || location.pathname === '/delete-account'

  // Reset the scroll position whenever the route changes.
  useEffect(() => {
    const root = document.getElementById('root')
    if (root) root.scrollTop = 0
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (loading || (session && profileLoading)) {
    return (
      <div className="app-splash">
        <div className="app-splash-logo">HUGE<span>AF</span></div>
      </div>
    )
  }

  if (!session) return <Login />

  // Signed in but hasn't finished profile setup → onboarding.
  if (!profile?.onboarded) return <Onboarding />

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workout" element={<Workout />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/exercises/:id" element={<ExerciseDetail />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/ten-by-three" element={<TenByThree />} />
        <Route path="/programs/:id" element={<ProgramDetail />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/challenges/:id" element={<ChallengeDetail />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogArticle />} />
        <Route path="/guides" element={<FormGuides />} />
        <Route path="/guides/:id" element={<FormGuideDetail />} />
        <Route path="/gym-candy" element={<GymCandy />} />
        <Route path="/gym-candy/new" element={<GymCandyForm />} />
        <Route path="/gym-candy/:id" element={<GymCandyForm />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        <Route
          path="/supplements"
          element={<Stub title="Supplements" icon="💊" blurb="The supplement directory — what works, dosing, and timing." />}
        />
        <Route
          path="*"
          element={<Stub title="Not found" icon="?" blurb="That screen doesn't exist yet." />}
        />
      </Routes>
      {!hideNav && <BottomNav />}
    </>
  )
}
