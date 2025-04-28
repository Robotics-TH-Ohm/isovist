import type { FeatureKey, Features } from './types'

export function euclidean(f1: Partial<Features>, f2: Partial<Features>) {
  let sum = 0
  const keys = Object.keys(f1) as FeatureKey[]

  for (const key of keys) {
    const v1 = f1[key]
    const v2 = f2[key]

    if (v1 && v2) {
      const diff = v1 - v2
      sum += diff * diff
    }
    else if (v1 && !v2) {
      sum += v1 * v1
    }
    else if (!v1 && v2) {
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

    if (v1 && v2) {
      sum += Math.abs(v1 - v2)
    }
    else if (v1 && !v2) {
      sum += Math.abs(v1)
    }
    else if (!v1 && v2) {
      sum += Math.abs(v2)
    }
  }

  return sum
}

export function cosine(f1: Partial<Features>, f2: Partial<Features>) {
  let product = 0
  let magnitude1 = 0
  let magnitude2 = 0

  const keys = Object.keys(f1) as FeatureKey[]
  for (const key of keys) {
    const v1 = f1[key]
    const v2 = f2[key]

    if (v1 && v2) {
      product += v1 * v2
      magnitude1 += v1 * v1
      magnitude2 += v2 * v2
    }
  }

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0
  }

  return 1 - product / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2))
}
