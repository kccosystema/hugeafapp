// Seed data for today's session — mirrors the "Push Day" design.

export const todaysWorkout = {
  id: 'push-day',
  block: 'RECOMMENDED FOR YOU · PUSH/PULL/LEGS',
  title: 'Push Day',
  subtitle: 'Chest & Triceps',
  hero: '/assets/hero.webp',
  meta: { exercises: 7, sets: 24, minutes: 52 },
  exercises: [
    {
      id: 'bench',
      name: 'Barbell Bench Press',
      image: '/assets/guide-bench.png',
      target: '4 × 8–10',
      last: '155 × 8',
      sets: [
        { prev: '135×12', lb: 135, reps: 12, done: true },
        { prev: '155×10', lb: 155, reps: 10, done: true },
        { prev: '155×8', lb: 155, reps: 8, done: false },
        { prev: '155×8', lb: '', reps: '', done: false },
      ],
    },
    {
      id: 'incline-db',
      name: 'Incline Dumbbell Press',
      target: '3 × 10–12',
      last: '60 × 11',
      sets: [
        { prev: '60×12', lb: '', reps: '', done: false },
        { prev: '60×11', lb: '', reps: '', done: false },
        { prev: '60×10', lb: '', reps: '', done: false },
      ],
    },
    {
      id: 'cable-fly',
      name: 'Cable Fly',
      target: '3 × 15',
      last: '30 × 15',
      sets: [
        { prev: '30×15', lb: '', reps: '', done: false },
        { prev: '30×15', lb: '', reps: '', done: false },
        { prev: '30×14', lb: '', reps: '', done: false },
      ],
    },
    {
      id: 'dips',
      name: 'Weighted Dips',
      target: '3 × 10',
      last: 'BW+25 × 10',
      sets: [
        { prev: '25×10', lb: '', reps: '', done: false },
        { prev: '25×10', lb: '', reps: '', done: false },
        { prev: '25×9', lb: '', reps: '', done: false },
      ],
    },
    {
      id: 'tricep-pushdown',
      name: 'Tricep Rope Pushdown',
      target: '4 × 12–15',
      last: '50 × 14',
      sets: [
        { prev: '50×15', lb: '', reps: '', done: false },
        { prev: '50×14', lb: '', reps: '', done: false },
        { prev: '50×13', lb: '', reps: '', done: false },
        { prev: '45×15', lb: '', reps: '', done: false },
      ],
    },
    {
      id: 'overhead-ext',
      name: 'Overhead Tricep Extension',
      target: '3 × 12',
      last: '70 × 12',
      sets: [
        { prev: '70×12', lb: '', reps: '', done: false },
        { prev: '70×11', lb: '', reps: '', done: false },
        { prev: '65×12', lb: '', reps: '', done: false },
      ],
    },
    {
      id: 'lateral-raise',
      name: 'Cable Lateral Raise',
      target: '4 × 15',
      last: '15 × 15',
      sets: [
        { prev: '15×15', lb: '', reps: '', done: false },
        { prev: '15×15', lb: '', reps: '', done: false },
        { prev: '15×14', lb: '', reps: '', done: false },
        { prev: '12×15', lb: '', reps: '', done: false },
      ],
    },
  ],
}

export const stats = {
  streak: 12,
  volumeWeek: 9420,
  prsThisMonth: 4,
}

export const programs = [
  { id: 'ppl', title: 'PPL Hypertrophy', image: '/assets/prog2.webp', perWeek: '6 DAYS / WK', week: 3, total: 8, pct: 38 },
  { id: '531', title: '5/3/1 Strength', image: '/assets/prog1.webp', perWeek: '4 DAYS / WK', week: 1, total: 12, pct: 9 },
  { id: 'glute', title: 'Glute Builder', image: '/assets/prog3.webp', perWeek: '5 DAYS / WK', week: 5, total: 8, pct: 62 },
]

export const challenges = [
  { id: 'pushup', image: '/assets/chal1.webp', tag: '30-DAY · DAY 12', title: '30-Day Push-Up Test', sub: '2,140 lifters · top 18%' },
  { id: 'squat', image: '/assets/chal2.webp', tag: 'PR · 1 WEEK LEFT', title: 'Squat PR Challenge', sub: 'Beat your 1RM of 245 lb' },
]

export const muscleGroups = [
  { name: 'Chest', count: 42 },
  { name: 'Back', count: 58 },
  { name: 'Legs', count: 63 },
  { name: 'Shoulders', count: 37 },
  { name: 'Arms', count: 49 },
]

export const blogPosts = [
  { id: 'hypertrophy-tips', tag: 'HYPERTROPHY', title: '5 science-backed tips to actually grow', read: '6 min read', image: '/assets/prog2.webp' },
  { id: 'protein', tag: 'NUTRITION', title: 'How much protein do you really need?', read: '4 min read', image: '/assets/chal3.webp' },
]

export const supplements = ['Creatine', 'Whey protein', 'Pre-workout', 'Omega-3']
