// 2,250+ exercises bundled from the user's Google Sheet (gymgymgym).
// Shape per item: { id, name, muscle, equipment, difficulty, region, mechanics, video? }
import exercises from './exercises.json'

export { exercises }

// Display order for muscle-group sections in the picker.
export const muscleOrder = [
  'Custom',
  'Chest', 'Back', 'Shoulders', 'Trapezius',
  'Biceps', 'Triceps', 'Forearms',
  'Abdominals', 'Quadriceps', 'Hamstrings', 'Glutes',
  'Hip Flexors', 'Adductors', 'Abductors', 'Calves', 'Shins',
]

// Icon key + color per muscle group, used for the SVG body-pictogram badges
// in the exercise list (see components/MuscleIcon.jsx). Color aids scanning.
const MUSCLE_META = {
  Chest: { key: 'chest', color: '#FF5A7A' },
  Back: { key: 'back', color: '#4F86FF' },
  Shoulders: { key: 'shoulders', color: '#F5B432' },
  Trapezius: { key: 'traps', color: '#E8913C' },
  Biceps: { key: 'arms', color: '#12B5A6' },
  Triceps: { key: 'arms', color: '#17A2B8' },
  Forearms: { key: 'forearms', color: '#1FB39A' },
  Abdominals: { key: 'abs', color: '#FF8A3D' },
  Quadriceps: { key: 'legs', color: '#9B7BFF' },
  Hamstrings: { key: 'legs', color: '#7B5BE0' },
  Glutes: { key: 'legs', color: '#B06BE0' },
  'Hip Flexors': { key: 'legs', color: '#8A6BE0' },
  Adductors: { key: 'legs', color: '#9B7BFF' },
  Abductors: { key: 'legs', color: '#9B7BFF' },
  Calves: { key: 'calves', color: '#5BC0EB' },
  Shins: { key: 'calves', color: '#5BC0EB' },
  Custom: { key: 'custom', color: '#DA2A24' },
}
export function muscleMeta(muscle) {
  return MUSCLE_META[muscle] || { key: 'body', color: '#DA2A24' }
}

export function searchExercises(list, query) {
  const q = query.trim().toLowerCase()
  if (!q) return list
  const terms = q.split(/\s+/)
  return list.filter((e) => {
    const hay = `${e.name} ${e.muscle} ${e.equipment} ${e.difficulty}`.toLowerCase()
    return terms.every((t) => hay.includes(t))
  })
}
