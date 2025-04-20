<script setup lang="ts">
import { map } from '~/isovist/obstacle'
import { Robot } from '~/isovist/robot'

const width = 600
const height = 600
const cell = 30
const colisionRange = 5

const canvasEl = useTemplateRef('canvas')
const robot = new Robot({
  x: 100,
  y: 100,
  obstacles: map.obstacles,
})

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

  for (let x = 0; x <= width; x += cell) {
    for (let y = 0; y <= height; y += cell) {
      const dx = x - map.config.cx
      const dy = y - map.config.cy
      const distSq = dx * dx + dy * dy
      if (distSq > map.config.radius * map.config.radius)
        continue
      const hidden = robot.lines.some((l) => {
        const d = pointToSegmentDist(x, y, l.x1, l.y1, l.x2, l.y2)
        return d <= colisionRange
      })
      if (hidden)
        continue
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  // Draw obstacles
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  robot.obstacles.forEach((o) => {
    if (o.type === 'line') {
      ctx.beginPath()
      ctx.moveTo(o.line.x1, o.line.y1)
      ctx.lineTo(o.line.x2, o.line.y2)
      ctx.stroke()
      return
    }

    if (o.fill) {
      ctx.beginPath()
      ctx.moveTo(o.lines[0].x1, o.lines[0].y1)
      o.lines.forEach((l) => {
        ctx.lineTo(l.x2, l.y2)
      })
      ctx.closePath()
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.stroke()
      return
    }

    o.lines.forEach((l) => {
      ctx.beginPath()
      ctx.moveTo(l.x1, l.y1)
      ctx.lineTo(l.x2, l.y2)
      ctx.stroke()
    })
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
    <div class="flex items-center justify-center">
      <canvas ref="canvas" :width="width" :height="height" />
    </div>
  </div>
</template>
