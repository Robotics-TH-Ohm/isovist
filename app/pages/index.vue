<script setup lang="ts">
import type { Obstacle } from '~/isovist/types'
import { createCircleObstacle } from '~/isovist/obstacle'
import { Robot } from '~/isovist/robot'

const canvasEl = useTemplateRef('canvas')
const logs = ref<string[]>([])

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

const robot = new Robot(75, 75, obstacles)

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
  const points = robot.castRays()
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
    robot.x + Math.cos(robot.angle) * 30,
    robot.y + Math.sin(robot.angle) * 30,
  )
  ctx.stroke()
}

function animate() {
  draw()
  requestAnimationFrame(animate)
}
onMounted(animate)
</script>

<template>
  <div class="p-6 container mx-auto @container">
    <div class="grid grid-cols-1 @min-[800px]:grid-cols-2 gap-10">
      <div class="flex items-center justify-center">
        <canvas ref="canvas" width="600" height="600" />
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
