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
      { id: 'pa_incline_db_press', name: 'Incline dumbbell press', targetSets: 3, targetReps: '6-8', supersetGroup: null, supersetPosition: null, equipmentType: 'dumbbell' },
      { id: 'pa_dips', name: 'Dips', targetSets: 2, targetSetsMax: 3, targetReps: '8-10', supersetGroup: 'SS1', supersetPosition: 'a', equipmentType: 'bodyweight', isBodyweight: true },
      { id: 'pa_bulgarian_split_squat', name: 'Bulgarian split squat', targetSets: 3, targetReps: '8-12', supersetGroup: 'SS1', supersetPosition: 'b', equipmentType: 'dumbbell' },
      { id: 'pa_seated_db_ohp', name: 'Seated dumbbell OHP', targetSets: 2, targetReps: '8-10', supersetGroup: 'SS2', supersetPosition: 'a', equipmentType: 'dumbbell' },
      { id: 'pa_standing_calf_raise', name: 'Standing calf raise', targetSets: 3, targetReps: '10-15', supersetGroup: 'SS2', supersetPosition: 'b', equipmentType: 'machine', isBodyweight: true },
      { id: 'pa_db_fly', name: 'Dumbbell fly', targetSets: 2, targetReps: '10-12', supersetGroup: 'SS3', supersetPosition: 'a', equipmentType: 'dumbbell' },
      { id: 'pa_cable_crunch', name: 'Cable crunch / weighted sit-up', targetSets: 3, targetReps: '12-15', supersetGroup: 'SS3', supersetPosition: 'b', equipmentType: 'cable' },
      { id: 'pa_lateral_raise', name: 'Lateral raise', targetSets: 3, targetReps: '12-15', supersetGroup: null, supersetPosition: null, equipmentType: 'dumbbell' },
      { id: 'pa_rope_pushdown', name: 'Rope pushdown', targetSets: 2, targetReps: '10-12', supersetGroup: null, supersetPosition: null, equipmentType: 'cable' },
      { id: 'pa_skull_crusher', name: 'Barbell skull crusher', targetSets: 2, targetReps: '10-12', supersetGroup: null, supersetPosition: null, equipmentType: 'barbell' },
    ],
  },
  {
    id: 'push_b',
    name: 'Push B',
    exercises: [
      { id: 'pb_flat_db_press', name: 'Flat dumbbell press', targetSets: 3, targetReps: '6-8', supersetGroup: null, supersetPosition: null, equipmentType: 'dumbbell', alternativeId: 'pb_machine_bench_press' },
      { id: 'pb_dips', name: 'Dips', targetSets: 2, targetReps: '8-10', supersetGroup: 'SS1', supersetPosition: 'a', equipmentType: 'bodyweight', isBodyweight: true },
      { id: 'pb_swiss_ball_squat', name: 'Swiss ball squat', targetSets: 3, targetReps: '10-12', supersetGroup: 'SS1', supersetPosition: 'b', equipmentType: 'dumbbell' },
      { id: 'pb_machine_shoulder_press', name: 'Machine shoulder press', targetSets: 2, targetReps: '8-10', supersetGroup: 'SS2', supersetPosition: 'a', equipmentType: 'machine', alternativeId: 'pb_db_shoulder_press' },
      { id: 'pb_seated_calf_raise', name: 'Seated calf raise', targetSets: 3, targetReps: '10-15', supersetGroup: 'SS2', supersetPosition: 'b', equipmentType: 'machine', isBodyweight: true },
      { id: 'pb_db_fly', name: 'Dumbbell fly', targetSets: 2, targetReps: '10-12', supersetGroup: 'SS3', supersetPosition: 'a', equipmentType: 'dumbbell' },
      { id: 'pb_cable_crunch', name: 'Cable crunch / weighted sit-up', targetSets: 3, targetReps: '12-15', supersetGroup: 'SS3', supersetPosition: 'b', equipmentType: 'cable' },
      { id: 'pb_cable_lateral_raise', name: 'Cable lateral raise', targetSets: 3, targetReps: '12-15', supersetGroup: null, supersetPosition: null, equipmentType: 'cable' },
      { id: 'pb_straight_bar_pushdown', name: 'Straight bar pushdown', targetSets: 2, targetSetsMax: 3, targetReps: '10-12', supersetGroup: null, supersetPosition: null, equipmentType: 'cable' },
      { id: 'pb_overhead_cable_ext', name: 'Overhead cable extension', targetSets: 2, targetReps: '10-12', supersetGroup: null, supersetPosition: null, equipmentType: 'cable' },
    ],
  },
  {
    id: 'pull_a',
    name: 'Pull A',
    exercises: [
      { id: 'pla_pullups', name: 'Pull-ups / lat pulldown', targetSets: 3, targetReps: '6-10', supersetGroup: null, supersetPosition: null, equipmentType: 'bodyweight', isBodyweight: true },
      { id: 'pla_bent_over_row', name: 'Bent over row', targetSets: 3, targetReps: '8-10', supersetGroup: 'SS1', supersetPosition: 'a', equipmentType: 'barbell' },
      { id: 'pla_romanian_deadlift', name: 'Romanian deadlift', targetSets: 3, targetReps: '8-10', supersetGroup: 'SS1', supersetPosition: 'b', equipmentType: 'barbell' },
      { id: 'pla_seated_cable_row', name: 'Seated cable row', targetSets: 2, targetReps: '10-12', supersetGroup: null, supersetPosition: null, equipmentType: 'cable', alternativeId: 'pla_hanging_row' },
      { id: 'pla_face_pull', name: 'Face pull', targetSets: 2, targetReps: '12-15', supersetGroup: null, supersetPosition: null, equipmentType: 'cable' },
      { id: 'pla_rear_delt_fly', name: 'Rear delt fly', targetSets: 2, targetReps: '12-15', supersetGroup: null, supersetPosition: null, equipmentType: 'dumbbell' },
      { id: 'pla_bb_curl', name: 'Barbell or DB curl', targetSets: 3, targetReps: '8-12', supersetGroup: null, supersetPosition: null, equipmentType: 'barbell' },
      { id: 'pla_hammer_curl', name: 'Hammer curl', targetSets: 2, targetReps: '10-12', supersetGroup: null, supersetPosition: null, equipmentType: 'dumbbell' },
      { id: 'pla_hanging_leg_raise', name: 'Hanging leg raise / cable crunch', targetSets: 3, targetReps: '12-15', supersetGroup: null, supersetPosition: null, equipmentType: 'bodyweight' },
    ],
  },
  {
    id: 'pull_b',
    name: 'Pull B',
    exercises: [
      { id: 'plb_lat_pulldown', name: 'Lat pulldown', targetSets: 3, targetReps: '8-12', supersetGroup: null, supersetPosition: null, equipmentType: 'cable' },
      { id: 'plb_chest_supported_row', name: 'Chest supported row', targetSets: 3, targetReps: '8-10', supersetGroup: 'SS1', supersetPosition: 'a', equipmentType: 'dumbbell' },
      { id: 'plb_hip_thrust', name: 'Hip thrust / glute bridge', targetSets: 3, targetReps: '8-12', supersetGroup: 'SS1', supersetPosition: 'b', equipmentType: 'barbell' },
      { id: 'plb_single_arm_cable_row', name: 'Single arm cable row', targetSets: 2, targetReps: '10-12', supersetGroup: null, supersetPosition: null, equipmentType: 'cable', alternativeId: 'plb_hanging_row' },
      { id: 'plb_rear_delt_fly', name: 'Rear delt fly', targetSets: 2, targetReps: '12-15', supersetGroup: null, supersetPosition: null, equipmentType: 'dumbbell' },
      { id: 'plb_face_pull', name: 'Face pull', targetSets: 2, targetReps: '12-15', supersetGroup: null, supersetPosition: null, equipmentType: 'cable' },
      { id: 'plb_ez_bar_curl', name: 'EZ bar curl', targetSets: 3, targetReps: '8-12', supersetGroup: null, supersetPosition: null, equipmentType: 'barbell' },
      { id: 'plb_incline_db_curl', name: 'Incline DB curl', targetSets: 2, targetReps: '10-12', supersetGroup: null, supersetPosition: null, equipmentType: 'dumbbell' },
      { id: 'plb_hanging_leg_raise', name: 'Hanging leg raise / cable crunch', targetSets: 3, targetReps: '12-15', supersetGroup: null, supersetPosition: null, equipmentType: 'bodyweight' },
    ],
  },
]

// Exercises usable only as swap targets (not part of the rotation).
// Each mirrors its counterpart's set/rep targets and superset slot so the
// swap is a drop-in replacement.
export const alternativeExercises: Record<string, ExerciseTemplate> = {
  pb_machine_bench_press: {
    id: 'pb_machine_bench_press',
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
