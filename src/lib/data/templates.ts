export type Muscle =
  | 'chest'
  | 'front_delt'
  | 'side_delt'
  | 'rear_delt'
  | 'triceps'
  | 'biceps'
  | 'lats'
  | 'upper_back'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'

export const MUSCLES: Muscle[] = [
  'chest', 'front_delt', 'side_delt', 'rear_delt', 'triceps', 'biceps',
  'lats', 'upper_back', 'quads', 'hamstrings', 'glutes', 'calves', 'core',
]

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: 'Chest',
  front_delt: 'Front delts',
  side_delt: 'Side delts',
  rear_delt: 'Rear delts',
  triceps: 'Triceps',
  biceps: 'Biceps',
  lats: 'Lats',
  upper_back: 'Upper back',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
}

export interface ExerciseTemplate {
  id: string
  name: string
  targetSets: number
  targetSetsMax?: number
  targetReps: string
  supersetGroup: string | null
  supersetPosition: 'a' | 'b' | null
  equipmentType: 'dumbbell' | 'barbell' | 'cable' | 'machine' | 'bodyweight'
  isBodyweight?: boolean
  alternativeId?: string
  /** Primary muscle: counts a full set toward weekly volume. */
  muscle: Muscle
  /** Secondary movers: count half a set each. */
  secondary?: Muscle[]
}

export interface WorkoutTemplate {
  id: 'push_a' | 'push_b' | 'pull_a' | 'pull_b'
  name: string
  exercises: ExerciseTemplate[]
}

export const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'push_a',
    name: 'Push A',
    exercises: [
      { id: 'pa_incline_db_press', name: 'Incline dumbbell press', targetSets: 3, targetReps: '6-8', supersetGroup: 'SS1', supersetPosition: 'a', equipmentType: 'dumbbell', muscle: 'chest', secondary: ['front_delt', 'triceps'] },
      { id: 'pa_bulgarian_split_squat', name: 'Bulgarian split squat', targetSets: 3, targetReps: '8-12', supersetGroup: 'SS1', supersetPosition: 'b', equipmentType: 'dumbbell', muscle: 'quads', secondary: ['glutes'] },
      { id: 'pa_seated_db_ohp', name: 'Seated dumbbell OHP', targetSets: 3, targetReps: '8-10', supersetGroup: 'SS2', supersetPosition: 'a', equipmentType: 'dumbbell', muscle: 'front_delt', secondary: ['side_delt', 'triceps'] },
      { id: 'pa_leg_extension', name: 'Leg extension', targetSets: 3, targetReps: '10-15', supersetGroup: 'SS2', supersetPosition: 'b', equipmentType: 'machine', muscle: 'quads' },
      { id: 'pa_straight_bar_pushdown', name: 'Straight bar pushdown / skull crusher', targetSets: 2, targetReps: '10-12', supersetGroup: 'SS3', supersetPosition: 'a', equipmentType: 'cable', muscle: 'triceps' },
      { id: 'pa_lateral_raise', name: 'Lateral raise', targetSets: 3, targetReps: '12-15', supersetGroup: 'SS3', supersetPosition: 'b', equipmentType: 'dumbbell', muscle: 'side_delt' },
      { id: 'pa_db_fly', name: 'Dumbbell fly', targetSets: 3, targetReps: '10-12', supersetGroup: 'SS4', supersetPosition: 'a', equipmentType: 'dumbbell', muscle: 'chest', secondary: ['front_delt'] },
      { id: 'pa_rope_pushdown', name: 'Single-arm rope pushdown', targetSets: 3, targetReps: '10-12', supersetGroup: 'SS4', supersetPosition: 'b', equipmentType: 'cable', muscle: 'triceps' },
    ],
  },
  {
    id: 'push_b',
    name: 'Push B',
    exercises: [
      { id: 'pb_flat_db_press', name: 'Flat dumbbell press', targetSets: 3, targetReps: '6-8', supersetGroup: 'SS1', supersetPosition: 'a', equipmentType: 'dumbbell', alternativeId: 'pb_machine_bench_press', muscle: 'chest', secondary: ['front_delt', 'triceps'] },
      { id: 'pb_swiss_ball_squat', name: 'Swiss ball squat', targetSets: 3, targetReps: '10-12', supersetGroup: 'SS1', supersetPosition: 'b', equipmentType: 'dumbbell', muscle: 'quads', secondary: ['glutes'] },
      { id: 'pb_machine_shoulder_press', name: 'Machine shoulder press', targetSets: 3, targetReps: '8-10', supersetGroup: 'SS2', supersetPosition: 'a', equipmentType: 'machine', alternativeId: 'pb_db_shoulder_press', muscle: 'front_delt', secondary: ['side_delt', 'triceps'] },
      { id: 'pb_goblet_squat', name: 'Goblet squat', targetSets: 3, targetReps: '10-12', supersetGroup: 'SS2', supersetPosition: 'b', equipmentType: 'dumbbell', muscle: 'quads', secondary: ['glutes'] },
      { id: 'pb_dips', name: 'Dips', targetSets: 2, targetSetsMax: 3, targetReps: '8-10', supersetGroup: 'SS3', supersetPosition: 'a', equipmentType: 'bodyweight', isBodyweight: true, muscle: 'triceps', secondary: ['chest', 'front_delt'] },
      { id: 'pb_cable_lateral_raise', name: 'Cable lateral raise', targetSets: 3, targetReps: '12-15', supersetGroup: 'SS3', supersetPosition: 'b', equipmentType: 'cable', muscle: 'side_delt' },
      { id: 'pb_db_fly', name: 'Dumbbell fly', targetSets: 3, targetReps: '10-12', supersetGroup: 'SS4', supersetPosition: 'a', equipmentType: 'dumbbell', muscle: 'chest', secondary: ['front_delt'] },
      { id: 'pb_single_arm_rope_ext', name: 'Single-arm rope extension', targetSets: 3, targetReps: '10-12', supersetGroup: 'SS4', supersetPosition: 'b', equipmentType: 'cable', muscle: 'triceps' },
      { id: 'pb_straight_bar_pushdown', name: 'Straight bar pushdown / skull crusher', targetSets: 2, targetReps: '10-12', supersetGroup: null, supersetPosition: null, equipmentType: 'cable', muscle: 'triceps' },
    ],
  },
  {
    id: 'pull_a',
    name: 'Pull A',
    exercises: [
      { id: 'pla_pullups', name: 'Pull-ups / lat pulldown', targetSets: 3, targetReps: '6-10', supersetGroup: 'SS1', supersetPosition: 'a', equipmentType: 'bodyweight', isBodyweight: true, muscle: 'lats', secondary: ['biceps'] },
      { id: 'pla_swiss_ball_leg_curl', name: 'Swiss ball hamstring curl', targetSets: 3, targetReps: '10-15', supersetGroup: 'SS1', supersetPosition: 'b', equipmentType: 'bodyweight', isBodyweight: true, muscle: 'hamstrings', secondary: ['glutes'] },
      { id: 'pla_chest_supported_row', name: 'Chest supported dumbbell row', targetSets: 3, targetReps: '8-10', supersetGroup: 'SS2', supersetPosition: 'a', equipmentType: 'dumbbell', muscle: 'upper_back', secondary: ['lats', 'biceps'] },
      { id: 'pla_hanging_leg_raise', name: 'Hanging leg raise', targetSets: 3, targetReps: '12-15', supersetGroup: 'SS2', supersetPosition: 'b', equipmentType: 'bodyweight', isBodyweight: true, muscle: 'core' },
      { id: 'pla_seated_cable_row', name: 'Seated cable row', targetSets: 2, targetSetsMax: 3, targetReps: '10-12', supersetGroup: 'SS3', supersetPosition: 'a', equipmentType: 'cable', alternativeId: 'pla_hanging_row', muscle: 'upper_back', secondary: ['lats', 'biceps'] },
      { id: 'pla_standing_calf_raise', name: 'Standing calf raise', targetSets: 3, targetReps: '10-15', supersetGroup: 'SS3', supersetPosition: 'b', equipmentType: 'machine', isBodyweight: true, muscle: 'calves' },
      { id: 'pla_bb_curl', name: 'Barbell or DB curl', targetSets: 3, targetReps: '8-12', supersetGroup: 'SS4', supersetPosition: 'a', equipmentType: 'barbell', muscle: 'biceps' },
      { id: 'pla_rear_delt_fly', name: 'Rear delt fly', targetSets: 3, targetReps: '12-15', supersetGroup: 'SS4', supersetPosition: 'b', equipmentType: 'dumbbell', muscle: 'rear_delt', secondary: ['upper_back'] },
      { id: 'pla_pallof_press', name: 'Pallof press', targetSets: 3, targetReps: '10-12/side', supersetGroup: null, supersetPosition: null, equipmentType: 'cable', muscle: 'core' },
    ],
  },
  {
    id: 'pull_b',
    name: 'Pull B',
    exercises: [
      { id: 'plb_lat_pulldown', name: 'Lat pulldown', targetSets: 3, targetReps: '8-12', supersetGroup: 'SS1', supersetPosition: 'a', equipmentType: 'cable', muscle: 'lats', secondary: ['biceps'] },
      { id: 'plb_hip_thrust', name: 'Hip thrust / glute bridge', targetSets: 3, targetReps: '8-12', supersetGroup: 'SS1', supersetPosition: 'b', equipmentType: 'barbell', muscle: 'glutes', secondary: ['hamstrings'] },
      { id: 'plb_chest_supported_row', name: 'Chest supported row', targetSets: 3, targetReps: '8-10', supersetGroup: 'SS2', supersetPosition: 'a', equipmentType: 'dumbbell', muscle: 'upper_back', secondary: ['lats', 'biceps'] },
      { id: 'plb_hanging_leg_raise', name: 'Hanging leg raise', targetSets: 3, targetReps: '12-15', supersetGroup: 'SS2', supersetPosition: 'b', equipmentType: 'bodyweight', isBodyweight: true, muscle: 'core' },
      { id: 'plb_single_arm_cable_row', name: 'Single arm cable row', targetSets: 2, targetSetsMax: 3, targetReps: '10-12', supersetGroup: 'SS3', supersetPosition: 'a', equipmentType: 'cable', alternativeId: 'plb_hanging_row', muscle: 'upper_back', secondary: ['lats', 'biceps'] },
      { id: 'plb_cable_crunch', name: 'Cable crunch / weighted sit-up', targetSets: 3, targetReps: '12-15', supersetGroup: 'SS3', supersetPosition: 'b', equipmentType: 'cable', muscle: 'core' },
      { id: 'plb_ez_bar_curl', name: 'EZ bar curl', targetSets: 3, targetReps: '8-12', supersetGroup: 'SS4', supersetPosition: 'a', equipmentType: 'barbell', muscle: 'biceps' },
      { id: 'plb_face_pull', name: 'Face pull', targetSets: 3, targetReps: '12-15', supersetGroup: 'SS4', supersetPosition: 'b', equipmentType: 'cable', muscle: 'rear_delt', secondary: ['upper_back'] },
      { id: 'plb_hammer_curl', name: 'Hammer curl', targetSets: 3, targetReps: '10-12', supersetGroup: null, supersetPosition: null, equipmentType: 'dumbbell', muscle: 'biceps' },
    ],
  },
]

// Exercises usable only as swap targets (not part of the rotation).
// Each mirrors its counterpart's set/rep targets and superset slot so the
// swap is a drop-in replacement.
export const alternativeExercises: Record<string, ExerciseTemplate> = {
  pb_machine_bench_press: {
    id: 'pb_machine_bench_press',
    muscle: 'chest', secondary: ['front_delt', 'triceps'],
    name: 'Machine bench press',
    targetSets: 3,
    targetReps: '6-8',
    supersetGroup: null,
    supersetPosition: null,
    equipmentType: 'machine',
    alternativeId: 'pb_flat_db_press',
  },
  pb_db_shoulder_press: {
    id: 'pb_db_shoulder_press',
    muscle: 'front_delt', secondary: ['side_delt', 'triceps'],
    name: 'DB shoulder press',
    targetSets: 2,
    targetReps: '8-10',
    supersetGroup: 'SS2',
    supersetPosition: 'a',
    equipmentType: 'dumbbell',
    alternativeId: 'pb_machine_shoulder_press',
  },
  pla_hanging_row: {
    id: 'pla_hanging_row',
    muscle: 'upper_back', secondary: ['lats', 'biceps'],
    name: 'Hanging row',
    targetSets: 2,
    targetReps: '10-12',
    supersetGroup: null,
    supersetPosition: null,
    equipmentType: 'bodyweight',
    isBodyweight: true,
    alternativeId: 'pla_seated_cable_row',
  },
  plb_hanging_row: {
    id: 'plb_hanging_row',
    muscle: 'upper_back', secondary: ['lats', 'biceps'],
    name: 'Hanging row',
    targetSets: 2,
    targetReps: '10-12',
    supersetGroup: null,
    supersetPosition: null,
    equipmentType: 'bodyweight',
    isBodyweight: true,
    alternativeId: 'plb_single_arm_cable_row',
  },
}

export function getTemplateById(id: string): WorkoutTemplate | undefined {
  return workoutTemplates.find((t) => t.id === id)
}

export function getExerciseById(id: string): ExerciseTemplate | undefined {
  for (const t of workoutTemplates) {
    const found = t.exercises.find((e) => e.id === id)
    if (found) return found
  }
  return alternativeExercises[id]
}

export function getAllExercises(): ExerciseTemplate[] {
  return workoutTemplates.flatMap((t) => t.exercises)
}

export function applyExerciseSwaps(
  exercises: ExerciseTemplate[],
  swaps: Record<string, string> | undefined
): ExerciseTemplate[] {
  if (!swaps) return exercises
  return exercises.map((ex) => {
    const swappedId = swaps[ex.id]
    if (!swappedId || swappedId === ex.id) return ex
    return getExerciseById(swappedId) ?? ex
  })
}
