import type { Fingerprint, Obstacle, Point } from './types'

export class Robot {
  constructor(
    public x = 0,
    public y = 0,
    public obstacles = [] as Obstacle[],
    public speed = 1,
    public rayCount = 360,
    public rayLength = 10,
    public fingerprints = [] as Fingerprint[],
  ) {}

  castRays() {
    const points: Point[] = []
    for (let i = 0; i < this.rayCount; i++) {
      const theta = (i / this.rayCount) * 2 * Math.PI
      const dx = Math.cos(theta)
      const dy = Math.sin(theta)

      let closestPoint = {
        x: this.x + dx * this.rayLength,
        y: this.y + dy * this.rayLength,
      }
      let minD = Number.POSITIVE_INFINITY

      for (const o of this.obstacles) {
        const point = this.#getIntersection(this.x, this.y, dx, dy, o)
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

  #getIntersection(rx: number, ry: number, dx: number, dy: number, obstacle: Obstacle) {
    const { x1, y1, x2, y2 } = obstacle
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
    this.y += this.speed
  }

  down() {
    this.y -= this.speed
  }

  left() {
    this.x += this.speed
  }

  right() {
    this.x -= this.speed
  }
}
