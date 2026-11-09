// Built-in challenges. `type` drives how progress is tracked:
//  daily    — check in once per day (progress = days done)
//  count    — accumulate a total (progress = reps/etc.)
//  pr       — one-shot: mark when you hit it
//  workouts — auto-counted from your logged workouts since joining

export const challenges = [
  {
    id: 'pushup-30',
    title: '30-Day Push-Up Test',
    image: '/assets/chal1.webp',
    tag: '30 DAYS',
    type: 'daily',
    goal: 30,
    unit: 'days',
    durationDays: 30,
    participants: 2140,
    summary: 'Do your push-up set every day for 30 straight days. Check in each day to keep the streak alive.',
  },
  {
    id: 'consistency-20',
    title: '20 Workouts in 30 Days',
    image: '/assets/hero.webp',
    tag: '30 DAYS',
    type: 'workouts',
    goal: 20,
    unit: 'workouts',
    durationDays: 30,
    participants: 3120,
    summary: 'Log 20 workouts in a month. Counts automatically from every session you finish.',
  },
  {
    id: 'pushup-1000',
    title: '1,000 Push-Ups',
    image: '/assets/chal3.webp',
    tag: '1 WEEK',
    type: 'count',
    goal: 1000,
    unit: 'reps',
    durationDays: 7,
    participants: 1503,
    summary: 'Rack up 1,000 push-up reps in seven days. Log them as you go — anywhere, any time.',
  },
  {
    id: 'squat-pr',
    title: 'Squat PR Challenge',
    image: '/assets/chal2.webp',
    tag: '2 WEEKS',
    type: 'pr',
    goal: 1,
    unit: 'PR',
    durationDays: 14,
    participants: 860,
    summary: 'Set a new squat 1-rep-max before the clock runs out. Mark it the moment you hit it.',
  },
]

export function getChallenge(id) {
  return challenges.find((c) => c.id === id) || null
}
