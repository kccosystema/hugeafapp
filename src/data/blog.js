// Bundled blog articles. Body is a list of blocks so we can render the exact
// design (headings, paragraphs, pull-quotes, key-takeaways box).
//   { type: 'p'|'h2'|'quote', text }  or  { type: 'takeaways', items: [] }

export const categories = ['All', 'Hypertrophy', 'Nutrition', 'Recovery', 'Mindset']

export const articles = [
  {
    id: 'science-backed-tips-to-grow',
    title: '5 Science-Backed Tips To Actually Grow',
    category: 'Hypertrophy',
    excerpt: 'The handful of principles that move the needle for natural lifters.',
    image: '/assets/prog2.webp',
    author: 'Dr. Mike R.',
    authorInitials: 'MR',
    date: 'Jun 24',
    readMin: 6,
    featured: true,
    body: [
      { type: 'p', text: "Building muscle isn't complicated, but it does reward consistency and a few well-chosen principles. After years of coaching, these five make the biggest difference for natural lifters." },
      { type: 'h2', text: '1. Train close to failure' },
      { type: 'p', text: 'Most growth happens in the last few hard reps. Leaving 1–2 reps in reserve on your working sets is the sweet spot between stimulus and recovery.' },
      { type: 'quote', text: 'Volume drives growth — but only the volume you can recover from.' },
      { type: 'h2', text: '2. Prioritize progressive overload' },
      { type: 'p', text: 'Add reps or weight over time. If the numbers in your log never move, neither will the mirror. This is exactly what your HugeAF tracker is for.' },
      { type: 'h2', text: '3. Hit each muscle twice a week' },
      { type: 'p', text: 'Frequency lets you accumulate more quality volume without frying any single session. Two moderate hits usually beat one brutal one.' },
      { type: 'takeaways', items: [
        'Take working sets within 1–2 reps of failure',
        'Add a little weight or a rep each week',
        'Train each muscle ~2× per week',
        'Eat enough protein and sleep 7–9 hours',
      ] },
    ],
  },
  {
    id: 'how-much-protein',
    title: 'How Much Protein Do You Really Need?',
    category: 'Nutrition',
    excerpt: 'Cut through the noise — here is what the research actually supports.',
    image: '/assets/chal3.webp',
    author: 'Coach Sarah L.',
    authorInitials: 'SL',
    date: 'Jun 20',
    readMin: 4,
    featured: false,
    body: [
      { type: 'p', text: 'Protein gets the most hype of any macronutrient, and for good reason — it is the raw material for muscle repair. But more is not always better.' },
      { type: 'h2', text: 'The simple number' },
      { type: 'p', text: 'For most lifters, 0.7–1.0 grams per pound of bodyweight per day covers your bases. Going much higher rarely adds more muscle; it mostly adds grocery bills.' },
      { type: 'quote', text: 'Total daily protein matters far more than timing or shake windows.' },
      { type: 'h2', text: 'Spread it out' },
      { type: 'p', text: 'Aim for 3–4 meals with 30–50g of protein each. This keeps muscle protein synthesis elevated across the day without any fancy supplementation.' },
      { type: 'takeaways', items: [
        'Target ~0.8 g per lb of bodyweight daily',
        'Split across 3–4 meals',
        'Whole foods first; shakes to top up',
      ] },
    ],
  },
  {
    id: 'sleep-underrated-supplement',
    title: 'Sleep Is The Most Underrated Supplement',
    category: 'Recovery',
    excerpt: 'No powder in the world beats a consistent seven to nine hours.',
    image: '/assets/prog1.webp',
    author: 'Dr. Mike R.',
    authorInitials: 'MR',
    date: 'Jun 16',
    readMin: 5,
    featured: false,
    body: [
      { type: 'p', text: 'You can nail training and nutrition and still stall if you are chronically under-slept. Recovery is when the adaptation actually happens.' },
      { type: 'h2', text: 'Why it matters' },
      { type: 'p', text: 'Deep sleep is when growth hormone peaks and your nervous system resets. Skimp on it and strength, appetite control, and motivation all suffer.' },
      { type: 'quote', text: 'You don’t grow in the gym — you grow while you sleep off the gym.' },
      { type: 'takeaways', items: [
        'Aim for 7–9 hours, consistently',
        'Keep a regular sleep and wake time',
        'Cut screens and caffeine before bed',
      ] },
    ],
  },
  {
    id: 'progressive-overload-explained',
    title: 'Progressive Overload, Explained Simply',
    category: 'Hypertrophy',
    excerpt: 'The one principle underneath every good program.',
    image: '/assets/prog3.webp',
    author: 'Coach Sarah L.',
    authorInitials: 'SL',
    date: 'Jun 11',
    readMin: 7,
    featured: false,
    body: [
      { type: 'p', text: 'Every effective program is just a clever way to apply one idea: gradually ask your body to do a little more than last time.' },
      { type: 'h2', text: 'Ways to progress' },
      { type: 'p', text: 'Add weight, add reps, add a set, improve your form, or shorten rest. You do not need all of them at once — pick one lever and nudge it each week.' },
      { type: 'quote', text: 'If the log never changes, the physique never changes.' },
      { type: 'takeaways', items: [
        'Beat last session by a rep or a little weight',
        'Track everything so you know your numbers',
        'Deload when progress stalls for 2–3 weeks',
      ] },
    ],
  },
  {
    id: 'habits-that-survive-bad-days',
    title: 'Building A Habit That Survives Bad Days',
    category: 'Mindset',
    excerpt: 'Consistency beats intensity — here is how to make it stick.',
    image: '/assets/chal1.webp',
    author: 'Coach Sarah L.',
    authorInitials: 'SL',
    date: 'Jun 6',
    readMin: 3,
    featured: false,
    body: [
      { type: 'p', text: 'Motivation is a nice bonus, not a plan. The lifters who make it long-term build systems that keep going even when they do not feel like it.' },
      { type: 'quote', text: 'On bad days, shrink the goal — never skip it entirely.' },
      { type: 'h2', text: 'The two-minute rule' },
      { type: 'p', text: 'Commit to just showing up and doing one set. Nine times out of ten you finish the session; the tenth time, you still kept the streak alive.' },
      { type: 'takeaways', items: [
        'Never miss twice in a row',
        'Lower the bar on bad days, don’t skip',
        'Anchor training to an existing routine',
      ] },
    ],
  },
]

export function getArticle(id) {
  return articles.find((a) => a.id === id) || null
}
