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

const robot = ref(new Robot({ x: 100, y: 100 }))
const found = shallowRef<{ position: Point | undefined, d: number }>()

function find() {
  const point = { x: robot.value.x, y: robot.value.y }
  const points = cast(point, lines)
  const features = computeFeatures(point, points)
  if (!features)
    return

  let min = Number.POSITIVE_INFINITY
  let position: Point | undefined

  for (const f of featuresDb) {
    if (!f.features)
      continue

    const d = euclidean(features, f.features)
    if (d < min) {
      min = d
      position = f.point
    }
  }

  return { position, d: min }
}

const canvasEl = useTemplateRef('canvas')
const drawConfig = ref({
  grid: true,
  robotRays: true,
})

function draw() {
  const canvas = canvasEl.value
  const ctx = canvas?.getContext('2d')
  if (!ctx || !canvas)
    return

  // Draw background
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, config.width, config.height)

  // Draw dots
  if (drawConfig.value.grid) {
    for (const g of grids) {
      const [x, y] = g

      if (found.value?.position?.x === x && found.value?.position?.y === y) {
        ctx.fillStyle = '#FFFF00'
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
  if (drawConfig.value.robotRays) {
    const points = cast({ x: robot.value.x, y: robot.value.y }, lines)
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(0,255,0,0.5)'
    points.forEach((p) => {
      ctx.beginPath()
      ctx.moveTo(robot.value.x, robot.value.y)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    })
  }

  // Draw robot
  ctx.fillStyle = '#f00'
  ctx.beginPath()
  ctx.arc(robot.value.x, robot.value.y, 10, 0, 2 * Math.PI)
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
    found.value = find()
})

function input() {
  if (keys.has('w'))
    robot.value.down()
  if (keys.has('s'))
    robot.value.up()
  if (keys.has('a'))
    robot.value.right()
  if (keys.has('d'))
    robot.value.left()
}

function animate() {
  draw()
  input()
  requestAnimationFrame(animate)
}
onMounted(animate)
</script>

<template>
  <div class="p-6 container mx-auto">
    <div class="flex flex-col items-center justify-center gap-6">
      <canvas ref="canvas" :width="config.width" :height="config.height" />

      <div class="flex items-center gap-6">
        <UCard>
          <div class="grid gap-3">
            <USwitch v-model="drawConfig.grid" label="Grid" />
            <USwitch v-model="drawConfig.robotRays" label="Robot rays" />
          </div>
        </UCard>

        <UCard>
          <div class="font-mono grid gap-1">
            <p><span class="font-extrabold text-success">W/A/S/D</span> to move</p>
            <p><span class="font-extrabold text-success">F</span> to find grid position.</p>
          </div>
        </UCard>
      </div>

      <div>
        <div class="font-mono">
          <p>Robot: {{ robot.x }}x | {{ robot.y }}y</p>
          <p>
            Found: {{ found?.position?.x }}x | {{ found?.position?.y }}y | {{ found?.d }}d
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
