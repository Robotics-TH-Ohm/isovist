import type { Features, Line, Point } from './types'

export function cast(position: Point, lines: Line[], RAY_COUNT = 360, RAY_LENGTH = 1_000) {
  const points: Point[] = []

  for (let i = 0; i < RAY_COUNT; i++) {
    const theta = (i / RAY_COUNT) * 2 * Math.PI
    const dx = Math.cos(theta)
    const dy = Math.sin(theta)

    let closet = {
      x: position.x + dx * RAY_LENGTH,
      y: position.y + dy * RAY_LENGTH,
    }
    let minD = Number.POSITIVE_INFINITY

    for (const line of lines) {
      const point = getIntersection(position, dx, dy, line)
      if (!point)
        continue

      const d = Math.hypot(point.x - position.x, point.y - position.y)
      if (d < minD) {
        minD = d
        closet = point
      }
    }

    points.push(closet)
  }

  return points
}

function getIntersection(position: Point, dx: number, dy: number, line: Line) {
  const vx = line.x2 - line.x1
  const vy = line.y2 - line.y1

  const det = dx * vy - dy * vx
  if (det === 0)
    return

  const t = ((line.x1 - position.x) * vy - (line.y1 - position.y) * vx) / det
  const u = ((line.x1 - position.x) * dy - (line.y1 - position.y) * dx) / det
  if (t > 0 && (u >= 0 && u <= 1)) {
    return { x: position.x + t * dx, y: position.y + t * dy }
  }
}

export function distPointToLine(point: Point, line: Line): number {
  const dx = line.x2 - line.x1
  const dy = line.y2 - line.y1
  const lengthSq = dx * dx + dy * dy

  if (lengthSq === 0)
    return Math.hypot(point.x - line.x1, point.y - line.y1)

  const _t = ((point.x - line.x1) * dx + (point.y - line.y1) * dy) / lengthSq
  const t = Math.max(0, Math.min(1, _t))
  const projX = line.x1 + t * dx
  const projY = line.y1 + t * dy
  return Math.hypot(point.x - projX, point.y - projY)
}

export function computeFeatures(point: Point, points: Point[]): Features | undefined {
  if (!points.length) {
    return
  }
  const area = computeArea(points)
  const perimeter = computePerimeter(points)
  const ds = points.map(p => Math.hypot(p.x - point.x, p.y - point.y))
  const meanD = ds.reduce((s, v) => s + v, 0) / ds.length
  const maxD = Math.max(...ds)
  const occlusivity = 1 - (perimeter / (2 * Math.PI * maxD))
  const m1 = meanD
  const m2 = ds.reduce((s, d) => s + d * d, 0) / ds.length
  return { area, perimeter, occlusivity, m1, m2 }
}

function computeArea(points: Point[]) {
  let area = 0
  const n = points.length
  if (n < 3) {
    return 0
  }
  for (let i = 0; i < n; i++) {
    const a = points[i]
    const b = points[(i + 1) % n] // Use modulo for wrap-around
    area += a.x * b.y - b.x * a.y
  }
  return Math.abs(area) / 2
}

function computePerimeter(points: Point[]) {
  return points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length]
    return sum + Math.hypot(q.x - p.x, q.y - p.y)
  }, 0)
}

export function euclidean(a: Features, b: Features): number {
  const keys = Object.keys(a) as (keyof Features)[]
  const sum = keys.reduce((sum, k) => sum + (a[k] - b[k]) ** 2, 0)
  return Math.sqrt(sum)
}
