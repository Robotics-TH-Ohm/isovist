import type { Line, Point } from './types'

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
      const point = getIntersection(viewpoint, dx, dy, line)
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
