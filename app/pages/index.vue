<script setup lang="ts">
interface Wall {
  x1: number
  y1: number
  x2: number
  y2: number
}
interface Point {
  x: number
  y: number
}
interface Features {
  area: number
  perimeter: number
  occlusivity: number
  m1: number
  m2: number
}
interface Fingerprint {
  pos: Point
  features: Features
}

const canvasEl = useTemplateRef('canvas')
const logs = ref<string[]>([])

function genCircularWall(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): Wall[] {
  const segments = 96
  const result: Wall[] = []
  const step = (endAngle - startAngle) / segments
  for (let i = 0; i < segments; i++) {
    const a1 = startAngle + i * step
    const a2 = a1 + step
    result.push({
      x1: cx + Math.cos(a1) * radius,
      y1: cy + Math.sin(a1) * radius,
      x2: cx + Math.cos(a2) * radius,
      y2: cy + Math.sin(a2) * radius,
    })
  }
  return result
}

const walls: Wall[] = [
  // outline
  { x1: 0, y1: 0, x2: 600, y2: 0 },
  { x1: 600, y1: 0, x2: 600, y2: 600 },
  { x1: 600, y1: 600, x2: 0, y2: 600 },
  { x1: 0, y1: 600, x2: 0, y2: 0 },

  // top left
  { x1: 0, y1: 200, x2: 50, y2: 200 },
  { x1: 150, y1: 200, x2: 150, y2: 300 },
  { x1: 150, y1: 300, x2: 300, y2: 300 },
  { x1: 300, y1: 300, x2: 300, y2: 200 },
  { x1: 300, y1: 0, x2: 300, y2: 100 },

  // top right
  { x1: 300, y1: 300, x2: 400, y2: 300 },
  { x1: 500, y1: 300, x2: 600, y2: 300 },
  { x1: 500, y1: 100, x2: 600, y2: 100 },

  // bottom right
  { x1: 350, y1: 500, x2: 350, y2: 600 },
  { x1: 350, y1: 450, x2: 600, y2: 450 },

  // bottom left
  ...genCircularWall(165, 450, 80, 0, Math.PI * 2),

]

const robot = { x: 75, y: 75, angle: 0, radius: 10 }
const rayCount = 360
const rayLength = 100
const speed = 3
const turnSpeed = 0.1

const fingerprints: Fingerprint[] = []

function getIntersection(rx: number, ry: number, dx: number, dy: number, wall: Wall) {
  const { x1, y1, x2, y2 } = wall
  const vx = x2 - x1; const vy = y2 - y1
  const det = dx * vy - dy * vx
  if (Math.abs(det) < 1e-6)
    return

  const t = ((x1 - rx) * vy - (y1 - ry) * vx) / det
  const u = ((x1 - rx) * dy - (y1 - ry) * dx) / det
  if (t > 0 && u >= 0 && u <= 1) {
    return { x: rx + t * dx, y: ry + t * dy } as Point
  }
}

function castRays(): Point[] {
  const points: Point[] = []
  for (let i = 0; i < rayCount; i++) {
    const theta = robot.angle + (i * 2 * Math.PI) / rayCount
    const dx = Math.cos(theta)
    const dy = Math.sin(theta)
    let closest: Point
    let minD = Infinity

    for (const w of walls) {
      const pt = getIntersection(robot.x, robot.y, dx, dy, w)
      if (pt) {
        const d = Math.hypot(pt.x - robot.x, pt.y - robot.y)
        if (d < minD) {
          minD = d
          closest = pt
        }
      }
    }
    closest ??= { x: robot.x + dx * rayLength, y: robot.y + dy * rayLength }
    points.push(closest)
  }
  return points
}

function computeArea(points: Point[]): number {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    area += a.x * b.y - b.x * a.y
  }
  return Math.abs(area) / 2
}

function computePerimeter(points: Point[]): number {
  return points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length]
    return sum + Math.hypot(q.x - p.x, q.y - p.y)
  }, 0)
}

function computeFeatures(points: Point[]): Features {
  const area = computeArea(points)
  const perimeter = computePerimeter(points)
  const ds = points.map(p => Math.hypot(p.x - robot.x, p.y - robot.y))
  const meanD = ds.reduce((s, v) => s + v, 0) / ds.length
  const maxD = Math.max(...ds)
  const occlusivity = 1 - (perimeter / (2 * Math.PI * maxD))
  const m1 = meanD
  const m2 = ds.reduce((s, d) => s + d * d, 0) / ds.length
  return { area, perimeter, occlusivity, m1, m2 }
}

function euclidean(a: Features, b: Features): number {
  return Math.sqrt(Object.keys(a)
    .reduce((sum, k) => sum + (a[k as keyof Features] - b[k as keyof Features]) ** 2, 0))
}

function distPointToSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1; const dy = y2 - y1
  const l2 = dx * dx + dy * dy
  if (l2 === 0)
    return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  const projX = x1 + t * dx
  const projY = y1 + t * dy
  return Math.hypot(px - projX, py - projY)
}

function collides(x: number, y: number): boolean {
  return walls.some(w => distPointToSeg(x, y, w.x1, w.y1, w.x2, w.y2) < robot.radius)
}

function draw() {
  const canvas = canvasEl.value
  const ctx = canvas?.getContext('2d')
  if (!ctx || !canvas)
    return

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw walls
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  walls.forEach((w) => {
    ctx.beginPath()
    ctx.moveTo(w.x1, w.y1)
    ctx.lineTo(w.x2, w.y2)
    ctx.stroke()
  })

  // Draw LIDAR rays
  const points = castRays()
  ctx.strokeStyle = 'rgba(0,255,0,0.3)'
  points.forEach((p) => {
    ctx.beginPath()
    ctx.moveTo(robot.x, robot.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  })

  // Draw robot
  ctx.fillStyle = 'red'
  ctx.beginPath()
  ctx.arc(robot.x, robot.y, robot.radius, 0, 2 * Math.PI)
  ctx.fill()

  ctx.strokeStyle = 'red'
  ctx.beginPath()
  ctx.moveTo(robot.x, robot.y)
  ctx.lineTo(
    robot.x + Math.cos(robot.angle) * 15,
    robot.y + Math.sin(robot.angle) * 15,
  )
  ctx.stroke()
}

function animate(): void {
  draw()
  requestAnimationFrame(animate)
}
animate()

function print(msg: string) {
  logs.value.unshift(msg)
}

window.addEventListener('keydown', (e: KeyboardEvent) => {
  let newX = robot.x
  let newY = robot.y
  if (e.key === 'w') { newX += Math.cos(robot.angle) * speed; newY += Math.sin(robot.angle) * speed }
  if (e.key === 's') { newX -= Math.cos(robot.angle) * speed; newY -= Math.sin(robot.angle) * speed }
  if ((e.key === 'w' || e.key === 's') && !collides(newX, newY)) {
    robot.x = newX
    robot.y = newY
  }
  if (e.key === 'a')
    robot.angle -= turnSpeed
  if (e.key === 'd')
    robot.angle += turnSpeed

  if (e.key === 'k') {
    const feat = computeFeatures(castRays())
    fingerprints.push({ pos: { x: robot.x, y: robot.y }, features: feat })
    print(`Stored fingerprint #${fingerprints.length}`)
  }
  if (e.key === 'm') {
    if (fingerprints.length === 0) { print('No fingerprints stored'); return }
    const curr = computeFeatures(castRays())
    let bestE = { i: -1, d: Infinity }
    fingerprints.forEach((fp, idx) => {
      const d = euclidean(curr, fp.features)
      if (d < bestE.d)
        bestE = { i: idx, d }
    })
    print(`Euclidean → #${bestE.i + 1} (dist=${bestE.d.toFixed(1)})`)
  }
})
</script>

<template>
  <div class="p-6 container mx-auto @container">
    <div class="grid grid-cols-1 @min-[800px]:grid-cols-2 gap-10">
      <div class="flex items-center justify-center">
        <canvas ref="canvas" width="600" height="600" />
      </div>
      <div class="font-mono border py-2 px-4">
        <p class="opacity-50">
          W/A/S/D: Move/turn robot
        </p>
        <p class="opacity-50">
          K: Store fingerprint  |  M: Match fingerprint
        </p>
        <p
          v-for="(l, i) in logs"
          :key="i"
        >
          {{ l }}
        </p>
      </div>
    </div>
  </div>
</template>
