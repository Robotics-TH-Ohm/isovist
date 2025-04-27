import type { FeatureKey, Features } from './types'

export function euclidean(f1: Partial<Features>, f2: Partial<Features>) {
  let sum = 0
  const keys = Object.keys(f1) as FeatureKey[]

  for (const key of keys) {
    const v1 = f1[key]
    const v2 = f2[key]

    if (typeof v1 === 'number' && typeof v2 === 'number') {
      const diff = v1 - v2
      sum += diff * diff
    }
    else if (typeof v1 === 'number' && v2 === undefined) {
      sum += v1 * v1
    }
    else if (v1 === undefined && typeof v2 === 'number') {
      sum += v2 * v2
    }
  }

  return Math.sqrt(sum)
}

export function manhattan(f1: Partial<Features>, f2: Partial<Features>) {
  let sum = 0
  const keys = Object.keys(f1) as FeatureKey[]

  for (const key of keys) {
    const v1 = f1[key]
    const v2 = f2[key]

    if (typeof v1 === 'number' && typeof v2 === 'number') {
      sum += Math.abs(v1 - v2)
    }
    else if (typeof v1 === 'number' && v2 === undefined) {
      sum += Math.abs(v1)
    }
    else if (v1 === undefined && typeof v2 === 'number') {
      sum += Math.abs(v2)
    }
  }

  return sum
}
