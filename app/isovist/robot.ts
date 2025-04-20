import type { Fingerprint, Line, Obstacle, Point } from './types'

interface Config {
  x?: number
  y?: number
  obstacles?: Obstacle[]
}

const RAY_COUNT = 360
const RAY_LENGTH = 600
const SPEED = 1

export class Robot {
  x: number
  y: number
  obstacles: Obstacle[]
  lines: Line[]
  fingerprints: Fingerprint[]

  constructor(c: Config = {}) {
    const {
      x = 0,
      y = 0,
      obstacles = [],
    } = c

    this.x = x
    this.y = y
    this.obstacles = obstacles
    this.lines = obstacles.flatMap(o => o.type === 'line' ? o.line : o.lines)
    this.fingerprints = []
  }

  cast() {
    const points: Point[] = []
    for (let i = 0; i < RAY_COUNT; i++) {
      const theta = (i / RAY_COUNT) * 2 * Math.PI
      const dx = Math.cos(theta)
      const dy = Math.sin(theta)

      let closestPoint = {
        x: this.x + dx * RAY_LENGTH,
        y: this.y + dy * RAY_LENGTH,
      }
      let minD = Number.POSITIVE_INFINITY

      for (const l of this.lines) {
        const point = this.#getIntersection(this.x, this.y, dx, dy, l)
        if (!point)
          continue

        const d = Math.hypot(point.x - this.x, point.y - this.y)
        if (d < minD) {
          minD = d
          closestPoint = point
        }
      }

      points.push(closestPoint)
    }

    return points
  }

  #getIntersection(rx: number, ry: number, dx: number, dy: number, line: Line) {
    const { x1, y1, x2, y2 } = line
    const vx = x2 - x1
    const vy = y2 - y1
    const det = dx * vy - dy * vx
    if (Math.abs(det) === 0)
      return

    const t = ((x1 - rx) * vy - (y1 - ry) * vx) / det
    const u = ((x1 - rx) * dy - (y1 - ry) * dx) / det
    if (t > 0 && u >= 0 && u <= 1) {
      return {
        x: rx + t * dx,
        y: ry + t * dy,
      } as Point
    }
  }

  up() {
    this.y += SPEED
  }

  down() {
    this.y -= SPEED
  }

  left() {
    this.x += SPEED
  }

  right() {
    this.x -= SPEED
  }
}
