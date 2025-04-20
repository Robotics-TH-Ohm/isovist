<script setup lang="ts">
import { map2 } from '~/isovist/obstacle'
import { Robot } from '~/isovist/robot'

const width = 600
const height = 600
const cell = 30

const canvasEl = useTemplateRef('canvas')
const logs = ref<string[]>([])

const obstacles = map2

const robot = new Robot(100, 100, obstacles)
// const grids: [number, number][] = []

function draw() {
  const canvas = canvasEl.value
  const ctx = canvas?.getContext('2d')
  if (!ctx || !canvas)
    return

  // Draw background
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  // Draw dots
  ctx.fillStyle = '#555'
  const range = 5
  const cx = 300
  const cy = 300
  const radius = 297

  for (let x = 0; x <= width; x += cell) {
    for (let y = 0; y <= height; y += cell) {
      const dx = x - cx
      const dy = y - cy
      const distSq = dx * dx + dy * dy
      if (distSq > radius * radius)
        continue
      const hidden = obstacles.some((o) => {
        const d = pointToSegmentDist(x, y, o.x1, o.y1, o.x2, o.y2)
        return d <= range
      })
      if (hidden)
        continue
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  // Draw obstacles
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 5
  obstacles.forEach((o) => {
    ctx.beginPath()
    ctx.moveTo(o.x1, o.y1)
    ctx.lineTo(o.x2, o.y2)
    ctx.stroke()
  })

  // Draw rays
  const points = robot.cast()
  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(0,255,0,0.5)'
  points.forEach((p) => {
    ctx.beginPath()
    ctx.moveTo(robot.x, robot.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  })

  // Draw robot
  ctx.fillStyle = '#f00'
  ctx.beginPath()
  ctx.arc(robot.x, robot.y, 10, 0, 2 * Math.PI)
  ctx.fill()
}

function pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSq = dx * dx + dy * dy

  if (lengthSq === 0)
    return Math.hypot(px - x1, py - y1)

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq))
  const projX = x1 + t * dx
  const projY = y1 + t * dy
  return Math.hypot(px - projX, py - projY)
}

const keys = new Set<string>()

window.addEventListener('keydown', (e) => {
  keys.add(e.key.toLowerCase())
})

window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase())
})

function input() {
  if (keys.has('w'))
    robot.down()
  if (keys.has('s'))
    robot.up()
  if (keys.has('a'))
    robot.right()
  if (keys.has('d'))
    robot.left()
}

function animate() {
  draw()
  input()
  requestAnimationFrame(animate)
}
onMounted(animate)
</script>

<template>
  <div class="p-6 container mx-auto @container">
    <div class="grid grid-cols-1 @min-[800px]:grid-cols-2 gap-10">
      <div class="flex items-center justify-center">
        <canvas ref="canvas" :width="width" :height="height" />
      </div>
      <div class="hidden font-mono border py-2 px-4">
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
