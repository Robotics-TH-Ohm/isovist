<script setup lang="ts">
import type { Features, Obstacle } from '~/robot'
import { Robot } from '~/robot'

const canvasEl = useTemplateRef('canvas')
const logs = ref<string[]>([])

function createCircleObstacle(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): Obstacle[] {
  const segments = 96
  const result: Obstacle[] = []
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

const obstacles: Obstacle[] = [
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
  ...createCircleObstacle(165, 450, 80, 0, Math.PI * 2),
]

const robot = new Robot(75, 75)

function euclidean(a: Features, b: Features): number {
  const keys = Object.keys(a) as (keyof Features)[]
  const sum = keys.reduce((sum, k) => sum + (a[k] - b[k]) ** 2, 0)
  return Math.sqrt(sum)
}

function distPointToSeg(px: number, py: number, obstacle: Obstacle) {
  const { x1, x2, y1, y2 } = obstacle
  const dx = x2 - x1
  const dy = y2 - y1
  const l2 = dx * dx + dy * dy
  if (l2 === 0)
    return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  const projX = x1 + t * dx
  const projY = y1 + t * dy
  return Math.hypot(px - projX, py - projY)
}

function collides(x: number, y: number) {
  return obstacles.some(w => distPointToSeg(x, y, w) < robot.radius)
}

function draw() {
  const canvas = canvasEl.value
  const ctx = canvas?.getContext('2d')
  if (!ctx || !canvas)
    return

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw obstacles
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  obstacles.forEach((o) => {
    ctx.beginPath()
    ctx.moveTo(o.x1, o.y1)
    ctx.lineTo(o.x2, o.y2)
    ctx.stroke()
  })

  // Draw LIDAR rays
  const points = robot.castRays(obstacles)
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

function animate() {
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

  if (e.key === 'w') {
    newX += Math.cos(robot.angle) * robot.speed
    newY += Math.sin(robot.angle) * robot.speed
  }
  if (e.key === 's') {
    newX -= Math.cos(robot.angle) * robot.speed
    newY -= Math.sin(robot.angle) * robot.speed
  }
  if ((e.key === 'w' || e.key === 's') && !collides(newX, newY)) {
    robot.x = newX
    robot.y = newY
  }

  if (e.key === 'a')
    robot.angle -= robot.turn
  if (e.key === 'd')
    robot.angle += robot.turn

  if (e.key === 'k') {
    const feat = robot.computeFeatures(obstacles)
    robot.fingerprints.push({
      position: { x: robot.x, y: robot.y },
      features: feat,
    })
    print(`Stored fingerprint #${robot.fingerprints.length}`)
  }

  if (e.key === 'm') {
    if (robot.fingerprints.length === 0) {
      print('No fingerprints stored')
      return
    }
    const curr = robot.computeFeatures(obstacles)
    let bestE = { i: -1, d: Infinity }
    robot.fingerprints.forEach((fp, idx) => {
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
