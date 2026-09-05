import { useLiveQuery } from 'dexie-react-hooks'
import { getRotationInfo, type RotationInfo } from '../utils/rotation'

/**
 * Live view of the rotation. Re-runs whenever a session is written, so the
 * "next up" workout updates as soon as one is finished.
 * Returns undefined while loading.
 */
export function useRotation(): RotationInfo | undefined {
  return useLiveQuery(() => getRotationInfo(), [])
}
