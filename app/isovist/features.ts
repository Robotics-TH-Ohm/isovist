import type { CheckboxGroupItem } from '@nuxt/ui'
import type { FeatureConfig, FeatureKey, Features, Point } from './types'

export const features = {
  fns: {
    area(viewpoint: Point, points: Point[]) {
      const cache = features.cache.area
      if (cache === 0 || cache)
        return cache

      const n = points.length
      if (n < 3)
        return 0

      let sum = 0
      for (let i = 0; i < n; i++) {
        const cur = points[i]
        const next = i + 1 === n ? points[0] : points[(i + 1)]
        sum += cur.x * next.y - next.x * cur.y
      }
      return 0.5 * Math.abs(sum)
    },
    perimeter(viewpoint: Point, points: Point[]) {
      const cache = features.cache.perimeter
      if (cache === 0 || cache)
        return cache

      const n = points.length
      if (n < 2)
        return 0

      let perimeter = 0
      for (let i = 0; i < n; i++) {
        const cur = points[i]
        const next = i + 1 === n ? points[0] : points[(i + 1)]
        perimeter += dist(cur, next)
      }
      return perimeter
    },
    areaPermeterRatio(viewpoint: Point, points: Point[]) {
      const cache = features.cache.areaPermeterRatio
      if (cache === 0 || cache)
        return cache

      return features.fns.area(viewpoint, points) / features.fns.perimeter(viewpoint, points)
    },
    circularity(viewpoint: Point, points: Point[]) {
      const cache = features.cache.circularity
      if (cache === 0 || cache)
        return cache

      const area = features.fns.area(viewpoint, points)
      const mean = features.fns.meanRadialLength(viewpoint, points)
      return (Math.PI * mean * mean) / area
    },
    dispersion(viewpoint: Point, points: Point[]) {
      const cache = features.cache.dispersion
      if (cache === 0 || cache)
        return cache

      const n = points.length
      if (n < 2)
        return 0

      const dists: number[] = []
      let distSum = 0

      for (const p of points) {
        const d = dist(viewpoint, p)
        dists.push(d)
        distSum += d
      }
      const mean = distSum / n
      const diffSum = dists.reduce((acc, d) => acc + (d - mean) ** 2, 0)
      const variance = diffSum / n
      const std = Math.sqrt(variance)
      return mean - std
    },
    dispersionAbs(viewpoint: Point, points: Point[]) {
      const cache = features.cache.dispersionAbs
      if (cache === 0 || cache)
        return cache

      return Math.abs(features.fns.dispersion(viewpoint, points))
    },
    drift(viewpoint: Point, points: Point[]) {
      const cache = features.cache.drift
      if (cache === 0 || cache)
        return cache

      const area = features.fns.area(viewpoint, points)
      const _centroid = centroid(points, area)
      return _centroid ? dist(viewpoint, _centroid) : 0
    },
    maxRadialLength(viewpoint: Point, points: Point[]) {
      const cache = features.cache.maxRadialLength
      if (cache === 0 || cache)
        return cache

      const n = points.length
      if (n === 0)
        return 0

      return Math.max(...points.map(p => dist(viewpoint, p)))
    },
    meanRadialLength(viewpoint: Point, points: Point[]) {
      const cache = features.cache.meanRadialLength
      if (cache === 0 || cache)
        return cache

      const n = points.length
      if (n === 0)
        return 0

      const sum = points.reduce((acc, p) => acc + dist(viewpoint, p), 0)
      return sum / n
    },
    minRadialLength(viewpoint: Point, points: Point[]) {
      const cache = features.cache.minRadialLength
      if (cache === 0 || cache)
        return cache

      const n = points.length
      if (n === 0)
        return 0

      return Math.min(...points.map(p => dist(viewpoint, p)))
    },
  },
  cache: {
    area: undefined as number | undefined,
    perimeter: undefined as number | undefined,
    areaPermeterRatio: undefined as number | undefined,
    circularity: undefined as number | undefined,
    dispersion: undefined as number | undefined,
    dispersionAbs: undefined as number | undefined,
    drift: undefined as number | undefined,
    maxRadialLength: undefined as number | undefined,
    meanRadialLength: undefined as number | undefined,
    minRadialLength: undefined as number | undefined,
  },
} as const

export const featureCheckboxes: (CheckboxGroupItem & { value: FeatureKey })[] = [
  {
    label: 'Area',
    description: 'This is the description.',
    value: 'area',
  },
  {
    label: 'Perimeter',
    description: 'This is the description.',
    value: 'perimeter',
  },
  {
    label: 'Area Perimeter Ratio',
    description: 'This is the description.',
    value: 'areaPermeterRatio',
  },
  {
    label: 'Circularity',
    description: 'This is the description.',
    value: 'circularity',
  },
  {
    label: 'Dispersion',
    description: 'This is the description.',
    value: 'dispersion',
  },
  {
    label: 'Absolute Dispersion',
    description: 'This is the description.',
    value: 'dispersionAbs',
  },
  {
    label: 'Drift',
    description: 'This is the description.',
    value: 'drift',
  },
  {
    label: 'Maximum Radial Length',
    description: 'This is the description.',
    value: 'maxRadialLength',
  },
  {
    label: 'Mean Radial Length',
    description: 'This is the description.',
    value: 'meanRadialLength',
  },
  {
    label: 'Minimum Radial Length',
    description: 'This is the description.',
    value: 'minRadialLength',
  },
]

function dist(a: Point, b: Point) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx ** 2 + dy ** 2)
}

function centroid(points: Point[], area: number) {
  const n = points.length

  if (area === 0 || n < 3) {
    return
  }

  let sumCx = 0
  let sumCy = 0

  for (let i = 0; i < n; i++) {
    const cur = points[i]
    const next = i + 1 === n ? points[0] : points[(i + 1)]
    const product = cur.x * next.y - next.x * cur.y

    sumCx += (cur.x + next.x) * product
    sumCy += (cur.y + next.y) * product
  }

  const x = sumCx / (6 * area)
  const y = sumCy / (6 * area)
  return { x, y }
}

export function computeFeatures(viewpoint: Point, points: Point[], config: FeatureConfig) {
  const result: Partial<Features> = {}
  for (const k in config) {
    const key = k as FeatureKey
    result[key] = features.fns[key](viewpoint, points)
  }
  return result
}
