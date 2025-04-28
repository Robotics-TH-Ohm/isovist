import type { Line, Point } from './types'

export const EPS = 1e-10

export function cast(viewpoint: Point, lines: Line[], RAY_COUNT = 360, RAY_LENGTH = 1_000) {
  const points: Point[] = []

  for (let i = 0; i < RAY_COUNT; i++) {
    const theta = (i / RAY_COUNT) * 2 * Math.PI
    const dx = Math.cos(theta)
    const dy = Math.sin(theta)

    let closet = {
      x: viewpoint.x + dx * RAY_LENGTH,
      y: viewpoint.y + dy * RAY_LENGTH,
    }
    let minD = Number.POSITIVE_INFINITY

    for (const line of lines) {
      const point = intersect(viewpoint, dx, dy, line)
      if (!point)
        continue

      const d = Math.hypot(point.x - viewpoint.x, point.y - viewpoint.y)
      if (d < minD) {
        minD = d
        closet = point
      }
    }

    points.push(closet)
  }

  return points
}

function intersect(viewpoint: Point, dx: number, dy: number, line: Line) {
  const vx = line.x2 - line.x1
  const vy = line.y2 - line.y1

  const det = dx * vy - dy * vx
  if (Math.abs(det) < EPS)
    return

  const t = ((line.x1 - viewpoint.x) * vy - (line.y1 - viewpoint.y) * vx) / det
  const u = ((line.x1 - viewpoint.x) * dy - (line.y1 - viewpoint.y) * dx) / det
  if (t > EPS && (u >= -EPS && u <= 1 + EPS)) {
    return { x: viewpoint.x + t * dx, y: viewpoint.y + t * dy }
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

export function distPointToPoint(a: Point, b: Point) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx ** 2 + dy ** 2)
}

export function centroid(points: Point[], area: number) {
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

export function isPointInCircle(point: Point, cx: number, cy: number, r: number) {
  return distPointToPoint(point, { x: cx, y: cy }) < r
}

export function isPointInPolygon(viewpoint: Point, lines: Line[]) {
  const count = lines.reduce(
    (acc, line) => acc + (intersect(viewpoint, 1, 1, line) ? 1 : 0),
    0,
  )
  return count % 2 === 1
}
