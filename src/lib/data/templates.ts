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

export type MuscleGroup = 'chest' | 'shoulders' | 'arms' | 'back' | 'legs' | 'core'

export const MUSCLE_GROUPS: Record<MuscleGroup, Muscle[]> = {
  chest: ['chest'],
  shoulders: ['front_delt', 'side_delt', 'rear_delt'],
  arms: ['biceps', 'triceps'],
  back: ['lats', 'upper_back'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  core: ['core'],
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  arms: 'Arms',
  back: 'Back',
  legs: 'Legs',
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
  equipmentType: 'dumbbell' | 'barbell' | 'cable' | 'machine' | 'bodyweight' | 'band'
  isBodyweight?: boolean
  alternativeId?: string
  /** Warm-up work: logged, but outside volume counts, progression and PRs. */
  warmup?: boolean
  /** Primary muscle: counts a full set toward weekly volume. */
  muscle: Muscle
  /** Secondary movers: count half a set each. */
  secondary?: Muscle[]
}

export interface WorkoutTemplate {
  id: 'push' | 'legs' | 'pull' | 'upper' | 'lower'
  name: string
  exercises: ExerciseTemplate[]
}

const bandWarmup = (id: string): ExerciseTemplate => ({
  id, name: 'Band external rotations', targetSets: 1, targetReps: '15-20/side', supersetGroup: null, supersetPosition: null, equipmentType: 'band', isBodyweight: true, warmup: true, muscle: 'rear_delt',
})

// Shared movements appear on two days under one id so PRs and pre-fill carry
// across; only the superset slot differs.
const hipThrust = (group: string, pos: 'a' | 'b'): ExerciseTemplate => ({
  id: 'plb_hip_thrust', name: 'Hip thrust / glute bridge', targetSets: 3, targetReps: '8-12', supersetGroup: group, supersetPosition: pos, equipmentType: 'barbell', muscle: 'glutes', secondary: ['hamstrings'],
})
const hamCurl = (group: string, pos: 'a' | 'b'): ExerciseTemplate => ({
  id: 'pla_swiss_ball_leg_curl', name: 'Swiss ball hamstring curl', targetSets: 3, targetReps: '10-15', supersetGroup: group, supersetPosition: pos, equipmentType: 'bodyweight', isBodyweight: true, muscle: 'hamstrings', secondary: ['glutes'],
})
const legExtension = (group: string, pos: 'a' | 'b'): ExerciseTemplate => ({
  id: 'pa_leg_extension', name: 'Leg extension', targetSets: 3, targetReps: '10-15', supersetGroup: group, supersetPosition: pos, equipmentType: 'machine', muscle: 'quads',
})
const standingCalf = (group: string | null, pos: 'a' | 'b' | null): ExerciseTemplate => ({
  id: 'pla_standing_calf_raise', name: 'Standing calf raise', targetSets: 3, targetReps: '10-15', supersetGroup: group, supersetPosition: pos, equipmentType: 'machine', isBodyweight: true, muscle: 'calves',
})
const seatedCalf = (group: string | null, pos: 'a' | 'b' | null): ExerciseTemplate => ({
  id: 'lo_seated_calf_raise', name: 'Seated calf raise', targetSets: 3, targetReps: '10-15', supersetGroup: group, supersetPosition: pos, equipmentType: 'machine', isBodyweight: true, muscle: 'calves',
})

// Three one-set ab movements that close Push, Pull and Upper.
const absBlock = (
  flexion: { id: string; name: 'Swiss ball jackknife' | 'Hanging leg raise'; alternativeId: string },
  crunchId: string,
  pallofId: string
): ExerciseTemplate[] => [
  { id: flexion.id, name: flexion.name, targetSets: 1, targetReps: '12-15', supersetGroup: null, supersetPosition: null, equipmentType: 'bodyweight', isBodyweight: true, alternativeId: flexion.alternativeId, muscle: 'core' },
  { id: crunchId, name: 'Cable crunch / weighted sit-up', targetSets: 1, targetReps: '12-15', supersetGroup: null, supersetPosition: null, equipmentType: 'cable', muscle: 'core' },
  { id: pallofId, name: 'Pallof press', targetSets: 1, targetReps: '10-12/side', supersetGroup: null, supersetPosition: null, equipmentType: 'cable', muscle: 'core' },
]

export const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'push',
    name: 'Push',
    exercises: [
      bandWarmup('pa_band_er'),
      { id: 'pa_incline_db_press', name: 'Incline dumbbell press', targetSets: 3, targetReps: '6-8', supersetGroup: 'SS1', supersetPosition: 'a', equipmentType: 'dumbbell', muscle: 'chest', secondary: ['front_delt', 'triceps'] },
      { id: 'pa_lateral_raise', name: 'Lateral raise', targetSets: 4, targetReps: '12-15', supersetGroup: 'SS1', supersetPosition: 'b', equipmentType: 'dumbbell', muscle: 'side_delt' },
      { id: 'pa_seated_db_ohp', name: 'Seated dumbbell OHP', targetSets: 2, targetReps: '8-10', supersetGroup: 'SS2', supersetPosition: 'a', equipmentType: 'dumbbell', muscle: 'front_delt', secondary: ['side_delt', 'triceps'] },
      { id: 'pa_db_fly', name: 'Dumbbell fly', targetSets: 3, targetReps: '10-12', supersetGroup: 'SS2', supersetPosition: 'b', equipmentType: 'dumbbell', muscle: 'chest', secondary: ['front_delt'] },
      { id: 'pb_dips', name: 'Dips', targetSets: 3, targetReps: '8-10', supersetGroup: 'SS3', supersetPosition: 'a', equipmentType: 'bodyweight', isBodyweight: true, muscle: 'triceps', secondary: ['chest', 'front_delt'] },
      { id: 'plb_ez_bar_curl', name: 'EZ bar curl', targetSets: 3, targetReps: '8-12', supersetGroup: 'SS3', supersetPosition: 'b', equipmentType: 'barbell', muscle: 'biceps' },
      ...absBlock({ id: 'pla_swiss_ball_jackknife', name: 'Swiss ball jackknife', alternativeId: 'pla_hanging_leg_raise' }, 'pla_cable_crunch', 'pla_pallof_press'),
    ],
  },
  {
    id: 'legs',
    name: 'Legs',
    exercises: [
      bandWarmup('le_band_er'),
      { id: 'pa_bulgarian_split_squat', name: 'Bulgarian split squat', targetSets: 3, targetReps: '8-12', supersetGroup: 'SS1', supersetPosition: 'a', equipmentType: 'dumbbell', muscle: 'quads', secondary: ['glutes'] },
      standingCalf('SS1', 'b'),
      { id: 'pb_goblet_squat', name: 'Goblet squat', targetSets: 3, targetReps: '10-12', supersetGroup: 'SS2', supersetPosition: 'a', equipmentType: 'dumbbell', muscle: 'quads', secondary: ['glutes'] },
      hamCurl('SS2', 'b'),
      legExtension('SS3', 'a'),
      hipThrust('SS3', 'b'),
      seatedCalf(null, null),
    ],
  },
  {
    id: 'pull',
    name: 'Pull',
    exercises: [
      bandWarmup('pla_band_er'),
      { id: 'pla_pullups', name: 'Pull-ups / lat pulldown', targetSets: 3, targetReps: '6-10', supersetGroup: 'SS1', supersetPosition: 'a', equipmentType: 'bodyweight', isBodyweight: true, muscle: 'lats', secondary: ['biceps'] },
      { id: 'plb_face_pull', name: 'Face pull', targetSets: 3, targetReps: '12-15', supersetGroup: 'SS1', supersetPosition: 'b', equipmentType: 'cable', muscle: 'rear_delt', secondary: ['upper_back'] },
      { id: 'pla_chest_supported_row', name: 'Chest supported dumbbell row', targetSets: 3, targetReps: '8-10', supersetGroup: 'SS2', supersetPosition: 'a', equipmentType: 'dumbbell', muscle: 'upper_back', secondary: ['lats', 'biceps', 'rear_delt'] },
      { id: 'pla_rear_delt_fly', name: 'Rear delt fly', targetSets: 3, targetReps: '12-15', supersetGroup: 'SS2', supersetPosition: 'b', equipmentType: 'dumbbell', muscle: 'rear_delt', secondary: ['upper_back'] },
      { id: 'pla_seated_cable_row', name: 'Seated cable row', targetSets: 3, targetReps: '10-12', supersetGroup: 'SS3', supersetPosition: 'a', equipmentType: 'cable', alternativeId: 'pla_hanging_row', muscle: 'upper_back', secondary: ['lats', 'biceps', 'rear_delt'] },
      { id: 'pla_bb_curl', name: 'Barbell or DB curl', targetSets: 3, targetReps: '8-12', supersetGroup: 'SS3', supersetPosition: 'b', equipmentType: 'barbell', muscle: 'biceps' },
      ...absBlock({ id: 'plb_hanging_leg_raise', name: 'Hanging leg raise', alternativeId: 'plb_swiss_ball_jackknife' }, 'plb_cable_crunch', 'pl_pallof_press'),
    ],
  },
  {
    id: 'upper',
    name: 'Upper',
    exercises: [
      bandWarmup('pb_band_er'),
      { id: 'pb_flat_db_press', name: 'Flat dumbbell press', targetSets: 3, targetReps: '6-8', supersetGroup: 'SS1', supersetPosition: 'a', equipmentType: 'dumbbell', alternativeId: 'pb_machine_bench_press', muscle: 'chest', secondary: ['front_delt', 'triceps'] },
      { id: 'plb_lat_pulldown', name: 'Lat pulldown', targetSets: 3, targetReps: '8-12', supersetGroup: 'SS1', supersetPosition: 'b', equipmentType: 'cable', muscle: 'lats', secondary: ['biceps'] },
      { id: 'pb_machine_shoulder_press', name: 'Machine shoulder press', targetSets: 3, targetReps: '8-10', supersetGroup: 'SS2', supersetPosition: 'a', equipmentType: 'machine', alternativeId: 'pb_db_shoulder_press', muscle: 'front_delt', secondary: ['side_delt', 'triceps'] },
      { id: 'plb_single_arm_cable_row', name: 'Single arm cable row', targetSets: 3, targetReps: '10-12', supersetGroup: 'SS2', supersetPosition: 'b', equipmentType: 'cable', alternativeId: 'plb_hanging_row', muscle: 'upper_back', secondary: ['lats', 'biceps', 'rear_delt'] },
      { id: 'pb_cable_lateral_raise', name: 'Cable lateral raise', targetSets: 4, targetReps: '12-15', supersetGroup: 'SS3', supersetPosition: 'a', equipmentType: 'cable', muscle: 'side_delt' },
      { id: 'pa_rope_pushdown', name: 'Single-arm rope pushdown', targetSets: 3, targetReps: '10-12', supersetGroup: 'SS3', supersetPosition: 'b', equipmentType: 'cable', muscle: 'triceps' },
      ...absBlock({ id: 'up_swiss_ball_jackknife', name: 'Swiss ball jackknife', alternativeId: 'up_hanging_leg_raise' }, 'up_cable_crunch', 'up_pallof_press'),
    ],
  },
  {
    id: 'lower',
    name: 'Lower',
    exercises: [
      bandWarmup('lo_band_er'),
      hipThrust('SS1', 'a'),
      seatedCalf('SS1', 'b'),
      hamCurl('SS2', 'a'),
      { id: 'pb_swiss_ball_squat', name: 'Swiss ball squat', targetSets: 3, targetReps: '10-12', supersetGroup: 'SS2', supersetPosition: 'b', equipmentType: 'dumbbell', muscle: 'quads', secondary: ['glutes'] },
      { id: 'lo_cable_pull_through', name: 'Cable pull-through', targetSets: 3, targetReps: '12-15', supersetGroup: 'SS3', supersetPosition: 'a', equipmentType: 'cable', muscle: 'glutes', secondary: ['hamstrings'] },
      legExtension('SS3', 'b'),
      standingCalf(null, null),
    ],
  },
]

/** Names for sessions logged under the retired four-day templates. */
export const LEGACY_TEMPLATE_NAMES: Record<string, string> = {
  push_a: 'Push A',
  push_b: 'Push B',
  pull_a: 'Pull A',
  pull_b: 'Pull B',
}

export function getTemplateName(id: string): string {
  return getTemplateById(id)?.name ?? LEGACY_TEMPLATE_NAMES[id] ?? id
}

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
    supersetGroup: 'SS1',
    supersetPosition: 'a',
    equipmentType: 'machine',
    alternativeId: 'pb_flat_db_press',
  },
  pb_db_shoulder_press: {
    id: 'pb_db_shoulder_press',
    muscle: 'front_delt', secondary: ['side_delt', 'triceps'],
    name: 'DB shoulder press',
    targetSets: 3,
    targetReps: '8-10',
    supersetGroup: 'SS2',
    supersetPosition: 'a',
    equipmentType: 'dumbbell',
    alternativeId: 'pb_machine_shoulder_press',
  },
  pla_hanging_leg_raise: {
    id: 'pla_hanging_leg_raise',
    muscle: 'core',
    name: 'Hanging leg raise',
    targetSets: 1,
    targetReps: '12-15',
    supersetGroup: null,
    supersetPosition: null,
    equipmentType: 'bodyweight',
    isBodyweight: true,
    alternativeId: 'pla_swiss_ball_jackknife',
  },
  plb_swiss_ball_jackknife: {
    id: 'plb_swiss_ball_jackknife',
    muscle: 'core',
    name: 'Swiss ball jackknife',
    targetSets: 1,
    targetReps: '12-15',
    supersetGroup: null,
    supersetPosition: null,
    equipmentType: 'bodyweight',
    isBodyweight: true,
    alternativeId: 'plb_hanging_leg_raise',
  },
  up_hanging_leg_raise: {
    id: 'up_hanging_leg_raise',
    muscle: 'core',
    name: 'Hanging leg raise',
    targetSets: 1,
    targetReps: '12-15',
    supersetGroup: null,
    supersetPosition: null,
    equipmentType: 'bodyweight',
    isBodyweight: true,
    alternativeId: 'up_swiss_ball_jackknife',
  },
  pla_hanging_row: {
    id: 'pla_hanging_row',
    muscle: 'upper_back', secondary: ['lats', 'biceps', 'rear_delt'],
    name: 'Hanging row',
    targetSets: 3,
    targetReps: '10-12',
    supersetGroup: 'SS3',
    supersetPosition: 'a',
    equipmentType: 'bodyweight',
    isBodyweight: true,
    alternativeId: 'pla_seated_cable_row',
  },
  plb_hanging_row: {
    id: 'plb_hanging_row',
    muscle: 'upper_back', secondary: ['lats', 'biceps', 'rear_delt'],
    name: 'Hanging row',
    targetSets: 3,
    targetReps: '10-12',
    supersetGroup: 'SS2',
    supersetPosition: 'b',
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

/** Every rotation exercise once, in program order (shared movements dedupe). */
export function getAllExercises(): ExerciseTemplate[] {
  const seen = new Set<string>()
  return workoutTemplates
    .flatMap((t) => t.exercises)
    .filter((e) => !seen.has(e.id) && seen.add(e.id))
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
