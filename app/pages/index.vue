<script setup lang="ts">
import type { Point } from '~/isovist/types'
import { map } from '~/isovist/obstacle'
import { Robot } from '~/isovist/robot'
import { cast, computeFeatures, distPointToLine, euclidean } from '~/isovist/utils'

const config = map.config
const obstacles = map.obstacles
const lines = obstacles.flatMap(o => o.type === 'line' ? o.line : o.lines)
const area = config.radius ** 2
const gridThreshold = 5

const grids = (() => {
  const arr: [number, number][] = []
  for (let x = 0; x <= config.width; x += config.gridCell) {
    for (let y = 0; y <= config.height; y += config.gridCell) {
      const dx = x - config.cx
      const dy = y - config.cy
      const distSq = dx * dx + dy * dy
      if (distSq > area)
        continue

      const point = { x, y }
      const isNear = lines.some(line => distPointToLine(point, line) <= gridThreshold)
      if (isNear)
        continue

      arr.push([x, y])
    }
  }
  return arr
})()

const featuresDb = (() => grids.map(([x, y]) => {
  const point = { x, y }
  const points = cast(point, lines)
  const features = computeFeatures(point, points)
  return { point, features }
}))()

const robot = new Robot({ x: 100, y: 100 })
let found: Point | undefined

function find() {
  const point = { x: robot.x, y: robot.y }
  const points = cast(point, lines)
  const features = computeFeatures(point, points)
  let min = Number.POSITIVE_INFINITY
  let found: Point | undefined

  for (const f of featuresDb) {
    const d = euclidean(features, f.features)
    if (d < min) {
      min = d
      found = f.point
    }
  }

  return found
}

const canvasEl = useTemplateRef('canvas')

function draw() {
  const canvas = canvasEl.value
  const ctx = canvas?.getContext('2d')
  if (!ctx || !canvas)
    return

  // Draw background
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, config.width, config.height)

  // Draw dots
  for (const g of grids) {
    const [x, y] = g

    if (found && found.x === x && found.y === y) {
      ctx.fillStyle = '#0ff'
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.fill()
    }
    else {
      ctx.fillStyle = '#555'
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  // Draw obstacles
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  obstacles.forEach((o) => {
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
  // const points = cast({ x: robot.x, y: robot.y }, lines)
  // ctx.lineWidth = 1
  // ctx.strokeStyle = 'rgba(0,255,0,0.5)'
  // points.forEach((p) => {
  //   ctx.beginPath()
  //   ctx.moveTo(robot.x, robot.y)
  //   ctx.lineTo(p.x, p.y)
  //   ctx.stroke()
  // })

  // Draw robot
  ctx.fillStyle = '#f00'
  ctx.beginPath()
  ctx.arc(robot.x, robot.y, 10, 0, 2 * Math.PI)
  ctx.fill()
}

const keys = new Set<string>()

window.addEventListener('keydown', (e) => {
  keys.add(e.key.toLowerCase())
})

window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase())
})

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'f')
    found = find()
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
      <canvas ref="canvas" :width="config.width" :height="config.height" />
    </div>
  </div>
</template>
