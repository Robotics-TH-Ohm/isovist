<script setup lang="ts">
import type { Obstacle } from '~/isovist/types'
import { createCircleObstacle } from '~/isovist/obstacle'
import { Robot } from '~/isovist/robot'

const width = 600
const height = 600
const cell = 20

const canvasEl = useTemplateRef('canvas')
const logs = ref<string[]>([])

const obstacles: Obstacle[] = [
  // outline
  { x1: 0, y1: 0, x2: width, y2: 0 },
  { x1: width, y1: 0, x2: width, y2: height },
  { x1: width, y1: width, x2: 0, y2: height },
  { x1: 0, y1: height, x2: 0, y2: 0 },

  // top left
  { x1: 0, y1: 200, x2: 60, y2: 200 },
  { x1: 160, y1: 200, x2: 160, y2: 300 },
  { x1: 160, y1: 300, x2: 300, y2: 300 },
  { x1: 300, y1: 300, x2: 300, y2: 200 },
  { x1: 300, y1: 0, x2: 300, y2: 100 },

  // top right
  { x1: 300, y1: 300, x2: 400, y2: 300 },
  { x1: 500, y1: 300, x2: 600, y2: 300 },
  { x1: 500, y1: 100, x2: 600, y2: 100 },

  // bottom right
  { x1: 360, y1: 500, x2: 360, y2: 600 },
  { x1: 360, y1: 440, x2: 600, y2: 440 },

  // bottom left
  ...createCircleObstacle(160, 460, 80, 0, Math.PI * 2),
]

const robot = new Robot(80, 80, obstacles)
const grids: [number, number][] = []

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
      const hidden = obstacles.find(o => o.x1 === x && o.y1 === y || o.x2 === x && o.y2 === y)
      if (hidden)
        continue
      grids.push([x, y])
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, 2 * Math.PI)
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

  const points = robot.castRays()
  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(0,255,0,0.5)'
  points.forEach((p) => {
    ctx.beginPath()
    ctx.moveTo(robot.x, robot.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  })

  // Draw robot
  ctx.fillStyle = 'red'
  ctx.beginPath()
  ctx.arc(robot.x, robot.y, 5, 0, 2 * Math.PI)
  ctx.fill()
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
