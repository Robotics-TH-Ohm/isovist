import type { CheckboxGroupItem } from '@nuxt/ui'
import type { FeatureConfig, FeatureKey, Features, Point } from './types'
import { centroid, distPointToPoint } from './utils'

export const features = {
  fns: {
    area(viewpoint: Point, points: Point[]) {
      const cache = features.cache.area.get(JSON.stringify(viewpoint))
      if (cache === 0 || cache)
        return cache

      const n = points.length
      if (n < 3) {
        features.cache.area.set(JSON.stringify(viewpoint), 0)
        return 0
      }

      let sum = 0
      for (let i = 0; i < n; i++) {
        const cur = points[i]
        const next = i + 1 === n ? points[0] : points[(i + 1)]
        sum += cur.x * next.y - next.x * cur.y
      }

      const area = 0.5 * Math.abs(sum)
      features.cache.area.set(JSON.stringify(viewpoint), area)
      return area
    },
    perimeter(viewpoint: Point, points: Point[]) {
      const cache = features.cache.perimeter.get(JSON.stringify(viewpoint))
      if (cache === 0 || cache)
        return cache

      const n = points.length
      if (n < 2) {
        features.cache.perimeter.set(JSON.stringify(viewpoint), 0)
        return 0
      }

      let perimeter = 0
      for (let i = 0; i < n; i++) {
        const cur = points[i]
        const next = i + 1 === n ? points[0] : points[(i + 1)]
        perimeter += distPointToPoint(cur, next)
      }

      features.cache.perimeter.set(JSON.stringify(viewpoint), perimeter)
      return perimeter
    },
    areaPermeterRatio(viewpoint: Point, points: Point[]) {
      const cache = features.cache.areaPermeterRatio.get(JSON.stringify(viewpoint))
      if (cache === 0 || cache)
        return cache

      const area = features.fns.area(viewpoint, points)
      const perimeter = features.fns.perimeter(viewpoint, points)
      if (perimeter === 0) {
        features.cache.areaPermeterRatio.set(JSON.stringify(viewpoint), 0)
        return 0
      }

      const ratio = area / perimeter
      features.cache.areaPermeterRatio.set(JSON.stringify(viewpoint), ratio)
      return ratio
    },
    circularity(viewpoint: Point, points: Point[]) {
      const cache = features.cache.circularity.get(JSON.stringify(viewpoint))
      if (cache === 0 || cache)
        return cache

      const area = features.fns.area(viewpoint, points)
      if (area === 0) {
        features.cache.circularity.set(JSON.stringify(viewpoint), 0)
        return 0
      }

      const mean = features.fns.meanRadialLength(viewpoint, points)
      const circularity = (Math.PI * mean * mean) / area
      features.cache.circularity.set(JSON.stringify(viewpoint), circularity)
      return circularity
    },
    dispersion(viewpoint: Point, points: Point[]) {
      const cache = features.cache.dispersion.get(JSON.stringify(viewpoint))
      if (cache === 0 || cache)
        return cache

      const n = points.length
      if (n < 2) {
        features.cache.dispersion.set(JSON.stringify(viewpoint), 0)
        return 0
      }

      const { dists, sum: distSum } = points.reduce((acc, point) => {
        const d = distPointToPoint(viewpoint, point)
        acc.dists.push(d)
        acc.sum += d
        return acc
      }, { dists: [] as number[], sum: 0 })

      const mean = distSum / n
      const diffSum = dists.reduce((acc, d) => acc + (d - mean) ** 2, 0)
      const variance = diffSum / n
      const std = Math.sqrt(variance)

      const dispersion = mean - std
      features.cache.dispersion.set(JSON.stringify(viewpoint), dispersion)
      return dispersion
    },
    dispersionAbs(viewpoint: Point, points: Point[]) {
      const cache = features.cache.dispersionAbs.get(JSON.stringify(viewpoint))
      if (cache === 0 || cache)
        return cache

      const dispersionAbs = Math.abs(features.fns.dispersion(viewpoint, points))
      features.cache.dispersionAbs.set(JSON.stringify(viewpoint), dispersionAbs)
      return dispersionAbs
    },
    drift(viewpoint: Point, points: Point[]) {
      const cache = features.cache.drift.get(JSON.stringify(viewpoint))
      if (cache === 0 || cache)
        return cache

      const area = features.fns.area(viewpoint, points)
      const _centroid = centroid(points, area)

      const drift = _centroid ? distPointToPoint(viewpoint, _centroid) : 0
      features.cache.drift.set(JSON.stringify(viewpoint), drift)
      return drift
    },
    maxRadialLength(viewpoint: Point, points: Point[]) {
      const cache = features.cache.maxRadialLength.get(JSON.stringify(viewpoint))
      if (cache === 0 || cache)
        return cache

      const n = points.length
      if (n === 0) {
        features.cache.maxRadialLength.set(JSON.stringify(viewpoint), 0)
        return 0
      }

      const maxRadialLength = Math.max(...points.map(p => distPointToPoint(viewpoint, p)))
      features.cache.maxRadialLength.set(JSON.stringify(viewpoint), maxRadialLength)
      return maxRadialLength
    },
    meanRadialLength(viewpoint: Point, points: Point[]) {
      const cache = features.cache.meanRadialLength.get(JSON.stringify(viewpoint))
      if (cache === 0 || cache)
        return cache

      const n = points.length
      if (n === 0) {
        features.cache.meanRadialLength.set(JSON.stringify(viewpoint), 0)
        return 0
      }

      const sum = points.reduce((acc, p) => acc + distPointToPoint(viewpoint, p), 0)

      const meanRadialLength = sum / n
      features.cache.meanRadialLength.set(JSON.stringify(viewpoint), meanRadialLength)
      return meanRadialLength
    },
    minRadialLength(viewpoint: Point, points: Point[]) {
      const cache = features.cache.minRadialLength.get(JSON.stringify(viewpoint))
      if (cache === 0 || cache)
        return cache

      const n = points.length
      if (n === 0) {
        features.cache.minRadialLength.set(JSON.stringify(viewpoint), 0)
        return 0
      }

      const minRadialLength = Math.min(...points.map(p => distPointToPoint(viewpoint, p)))
      features.cache.minRadialLength.set(JSON.stringify(viewpoint), minRadialLength)
      return minRadialLength
    },
  },

  cache: {
    area: new Map<string, number>(),
    perimeter: new Map<string, number>(),
    areaPermeterRatio: new Map<string, number>(),
    circularity: new Map<string, number>(),
    dispersion: new Map<string, number>(),
    dispersionAbs: new Map<string, number>(),
    drift: new Map<string, number>(),
    maxRadialLength: new Map<string, number>(),
    meanRadialLength: new Map<string, number>(),
    minRadialLength: new Map<string, number>(),
  },

  checkboxes: [
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
  ] satisfies (CheckboxGroupItem)[],
} as const

export function computeFeatures(viewpoint: Point, points: Point[], config: FeatureConfig) {
  const result: Partial<Features> = {}
  for (const k in config) {
    const key = k as FeatureKey
    result[key] = features.fns[key](viewpoint, points)
  }
  return result
}
