// Background media for the login screen. Shuffled on each visit and cycled
// through while the user is on the screen. Videos are compressed to ~720p,
// audio-stripped, ~10s clips (see /public/assets/login*.mp4). Add more entries
// any time — drop a file in /public/assets and add a line here.
export const loginMedia = [
  { type: 'video', src: '/assets/login0.mp4', poster: '/assets/login0.jpg' },
  { type: 'video', src: '/assets/login1.mp4', poster: '/assets/login1.jpg' },
  { type: 'video', src: '/assets/login2.mp4', poster: '/assets/login2.jpg' },
  { type: 'video', src: '/assets/login3.mp4', poster: '/assets/login3.jpg' },
  { type: 'video', src: '/assets/login4.mp4', poster: '/assets/login4.jpg' },
  { type: 'video', src: '/assets/login5.mp4', poster: '/assets/login5.jpg' },
]
