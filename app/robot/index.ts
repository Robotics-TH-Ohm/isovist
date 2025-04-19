export interface Point {
  x: number
  y: number
}

export interface Features {
  area: number
  perimeter: number
  occlusivity: number
  m1: number
  m2: number
}

export interface Fingerprint {
  position: Point
  features: Features
}

export interface Obstacle {
  x1: number
  y1: number
  x2: number
  y2: number
}

export class Robot {
  constructor(
    public x = 0,
    public y = 0,
    public angle = 0,
    public radius = 10,
    public speed = 3,
    public turn = 0.1,
    public rayCount = 360,
    public rayLength = 100,
    public fingerprints = [] as Fingerprint[],
  ) {}

  castRays(obstacles: Obstacle[]) {
    const points: Point[] = []
    for (let i = 0; i < this.rayCount; i++) {
      const theta = this.angle + (i * 2 * Math.PI) / this.rayCount
      const dx = Math.cos(theta)
      const dy = Math.sin(theta)
      let closest: Point
      let minD = Number.POSITIVE_INFINITY

      for (const o of obstacles) {
        const point = this.#getIntersection(this.x, this.y, dx, dy, o)
        if (!point)
          continue

        const d = Math.hypot(point.x - this.x, point.y - this.y)
        if (d < minD) {
          minD = d
          closest = point
        }
      }

      closest ??= { x: this.x + dx * this.rayLength, y: this.y + dy * this.rayLength }
      points.push(closest)
    }

    return points
  }

  #getIntersection(rx: number, ry: number, dx: number, dy: number, obstacle: Obstacle) {
    const { x1, y1, x2, y2 } = obstacle
    const vx = x2 - x1
    const vy = y2 - y1
    const det = dx * vy - dy * vx
    if (Math.abs(det) < 1e-6)
      return

    const t = ((x1 - rx) * vy - (y1 - ry) * vx) / det
    const u = ((x1 - rx) * dy - (y1 - ry) * dx) / det
    if (t > 0 && u >= 0 && u <= 1) {
      return { x: rx + t * dx, y: ry + t * dy } as Point
    }
  }

  #computeArea(points: Point[]) {
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const a = points[i]
      const b = points[(i + 1)]
      area += a.x * b.y - b.x * a.y
    }
    return Math.abs(area) / 2
  }

  #computePerimeter(points: Point[]) {
    return points.reduce((sum, p, i) => {
      const q = points[(i + 1) % points.length]
      return sum + Math.hypot(q.x - p.x, q.y - p.y)
    }, 0)
  }

  computeFeatures(obstacles: Obstacle[]) {
    const points = this.castRays(obstacles)
    const area = this.#computeArea(points)
    const perimeter = this.#computePerimeter(points)
    const ds = points.map(p => Math.hypot(p.x - this.x, p.y - this.y))
    const meanD = ds.reduce((s, v) => s + v, 0) / ds.length
    const maxD = Math.max(...ds)
    const occlusivity = 1 - (perimeter / (2 * Math.PI * maxD))
    const m1 = meanD
    const m2 = ds.reduce((s, d) => s + d * d, 0) / ds.length
    return { area, perimeter, occlusivity, m1, m2 }
  }
}
