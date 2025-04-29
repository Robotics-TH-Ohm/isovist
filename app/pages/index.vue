<script setup lang="ts">
import type { FeatureConfig, FeatureKey, Point } from '~/isovist/types'
import { cosine, euclidean, manhattan } from '~/isovist/diff'
import { computeFeatures, features } from '~/isovist/features'
import { orthogonalGrid, randomGrid } from '~/isovist/grid'
import { map } from '~/isovist/map'
import { useRobot } from '~/isovist/robot'
import { cast } from '~/isovist/utils'

interface GlobalConfig {
  features: FeatureConfig
  distance: 'euclidean' | 'manhattan' | 'cosine'
  grid: {
    show: boolean
    type: 'orthogonal' | 'random'
  }
  robot: {
    rays: boolean
  }
}

const obstacles = map.obstacles
const lines = obstacles.flatMap(o => o.type === 'line' ? o.line : o.lines)

const config = useSessionStorage<GlobalConfig>(
  'isovist_config',
  () => ({
    features: {},
    distance: 'euclidean',
    grid: {
      show: true,
      type: 'orthogonal',
    },
    robot: {
      rays: false,
    },
  }),
)

const featureKeys = ref<FeatureKey[]>([
  'area',
  'perimeter',
  'compactness',
  // 'occlusivity',
  'radialMomentMean',
  'radialMomentVariance',
  'radialMomentSkewness',
])
watch(featureKeys, (keys) => {
  config.value.features = {}
  for (const k of keys) {
    config.value.features[k] = true
  }
}, { immediate: true, deep: true })

const grid = computed(() => {
  const fn = config.value.grid.type === 'orthogonal' ? orthogonalGrid : randomGrid
  return fn({ map: map.config, obstacles })
})

const featureEntries = computed(() => grid.value.map(([x, y]) => {
  const viewpoint = { x, y }
  const points = cast(viewpoint, lines)
  const features = computeFeatures(viewpoint, points, config.value.features)
  return { point: viewpoint, features }
}))

const robot = useRobot({ x: 300, y: 90, speed: 1 })
const found = shallowRef<{ position: Point | undefined, d: number }>()
const hover = shallowRef<Point>()

function find() {
  const point = { x: robot.x.value, y: robot.y.value }
  const points = cast(point, lines)
  const features = computeFeatures(point, points, config.value.features)
  if (!features)
    return { position: undefined, d: Number.POSITIVE_INFINITY }

  let minD = Number.POSITIVE_INFINITY
  let nearest: Point | undefined

  const distanceFn = (() => {
    switch (config.value.distance) {
      case 'euclidean': return euclidean
      case 'manhattan': return manhattan
      case 'cosine': return cosine
    }
  })()

  for (const entry of featureEntries.value) {
    if (!entry.features)
      continue

    const d = distanceFn(features, entry.features)
    if (d < minD) {
      minD = d
      nearest = entry.point
    }
  }

  return { position: nearest, d: minD }
}

const canvasEl = useTemplateRef('canvas')

function draw() {
  const canvas = canvasEl.value
  const ctx = canvas?.getContext('2d')
  if (!ctx || !canvas)
    return

  const style = getComputedStyle(document.documentElement)
  const bgClr = style.getPropertyValue('--background-color-default')
  const warningClr = style.getPropertyValue('--ui-warning')
  const errorClr = style.getPropertyValue('--ui-error')
  const successClr = style.getPropertyValue('--ui-success')
  const infoClr = style.getPropertyValue('--ui-info')
  const textClr = style.getPropertyValue('--ui-text')
  const textMutedClr = style.getPropertyValue('--ui-text-muted')

  // Draw background
  ctx.fillStyle = bgClr
  ctx.fillRect(0, 0, map.config.width, map.config.height)

  // Draw dots
  if (config.value.grid.show) {
    for (const g of grid.value) {
      const [x, y] = g

      ctx.fillStyle = textMutedClr
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  // Draw obstacles
  ctx.strokeStyle = textClr
  ctx.lineWidth = map.config.lineWidth
  obstacles.forEach((o) => {
    if ('border' in o && o.border) {
      ctx.lineWidth = map.config.lineWidth * 1.5
      o.lines.forEach((l) => {
        ctx.beginPath()
        ctx.moveTo(l.x1, l.y1)
        ctx.lineTo(l.x2, l.y2)
        ctx.stroke()
      })
      ctx.lineWidth = map.config.lineWidth
      return
    }

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
      // ctx.fillStyle = textClr
      // ctx.fill()
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
  if (config.value.robot.rays) {
    const points = cast({ x: robot.x.value, y: robot.y.value }, lines)
    ctx.lineWidth = 1
    ctx.strokeStyle = successClr
    ctx.globalAlpha = 0.5
    points.forEach((p) => {
      ctx.beginPath()
      ctx.moveTo(robot.x.value, robot.y.value)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    })
    ctx.globalAlpha = 1.0
  }

  if (found.value?.position) {
    ctx.fillStyle = warningClr
    ctx.beginPath()
    ctx.arc(found.value.position.x, found.value.position.y, 6, 0, 2 * Math.PI)
    ctx.fill()
  }
  if (hover.value) {
    ctx.fillStyle = infoClr
    ctx.beginPath()
    ctx.arc(hover.value.x, hover.value.y, 6, 0, 2 * Math.PI)
    ctx.fill()
  }

  // Draw robot
  ctx.fillStyle = errorClr
  ctx.beginPath()
  ctx.arc(robot.x.value, robot.y.value, 10, 0, 2 * Math.PI)
  ctx.fill()
}

useEventListener(canvasEl, 'mousemove', useThrottleFn((event: MouseEvent) => {
  const canvas = canvasEl.value!
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const threshold = map.config.lineWidth * 2

  const entry = featureEntries.value.find((e) => {
    return ((x - threshold) <= e.point.x && e.point.x <= (x + threshold))
      && ((y - threshold) <= e.point.y && e.point.y <= (y + threshold))
  },
  )
  if (entry) {
    hover.value = entry.point
  }
}))

useEventListener(canvasEl, 'mouseout', () => {
  hover.value = undefined
})

const keys = new Set<string>()

useEventListener('keydown', (e) => {
  keys.add(e.key.toLowerCase())
})

useEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase())
})

useEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'f')
    found.value = find()
})

function input() {
  if (keys.has('w') && robot.y.value > 0) {
    robot.down()
  }
  if (keys.has('s') && robot.y.value < map.config.height) {
    robot.up()
  }
  if (keys.has('a') && robot.x.value > 0) {
    robot.right()
  }
  if (keys.has('d') && robot.x.value < map.config.width) {
    robot.left()
  }
}

function animate() {
  draw()
  input()
  requestAnimationFrame(animate)
}
onMounted(animate)
</script>

<template>
  <div class="p-6 mx-auto font-mono @container">
    <div class="grid grid-cols-1 gap-6 @min-[1200px]:grid-cols-2">
      <div class="relative flex flex-col gap-3 items-center justify-center">
        <ColorMode class="absolute top-0 right-0" />
        <h1 class="font-extrabold text-xl">
          Isovist
        </h1>
        <canvas
          ref="canvas"
          :width="map.config.width"
          :height="map.config.height"
          class="my-3"
        />
        <UCard>
          <div class="grid gap-1">
            <p>
              <span class="font-extrabold text-success">W/A/S/D</span> to move
            </p>
            <p>
              <span class="font-extrabold text-success">F</span> to find grid position.
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="grid gap-3">
            <p class="font-extrabold">
              TODO
            </p>
            <p> - Features (Normalization before Diff, Handle error)</p>
            <p> - Found </p>
          </div>
        </UCard>
      </div>

      <div class="grid gap-3">
        <UCard>
          <div class="grid gap-3">
            <p class="font-extrabold">
              Grid
            </p>

            <USwitch
              v-model="config.grid.show"
              label="Show"
            />

            <URadioGroup
              v-model="config.grid.type"
              orientation="horizontal"
              :items="[
                { label: 'Orthogonal', value: 'orthogonal' },
                { label: 'Random', value: 'random' },
              ]"
              :ui="{ fieldset: 'gap-x-6' }"
            />
            <p>
              Found: {{ found?.position?.x }}x | {{ found?.position?.y }}y | {{ found?.d }}d
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="grid gap-3">
            <p class="font-extrabold">
              Features
            </p>
            <UCheckboxGroup
              v-model="featureKeys"
              :items="features.checkboxes"
            />
          </div>
        </UCard>

        <UCard>
          <div class="grid gap-3">
            <p class="mb-2 font-extrabold">
              Distances
            </p>
            <URadioGroup
              v-model="config.distance"
              orientation="horizontal"
              :items="[
                { label: 'Euclidean', value: 'euclidean' },
                { label: 'Manhattan', value: 'manhattan' },
                { label: 'Cosine', value: 'consine' },
              ]"
              :ui="{ fieldset: 'gap-x-6' }"
            />
          </div>
        </UCard>

        <UCard>
          <div class="grid gap-3">
            <p class="mb-2 font-extrabold">
              Robot
            </p>
            <USwitch
              v-model="config.robot.rays"
              label="Rays"
            />
            <label>
              <span>Speed: </span>
              <UInputNumber
                v-model="robot.speed.value"
                :min="1"
                :step="1"
                orientation="vertical"
                class="w-20"
              />
            </label>
            <p>Robot: {{ robot.x }}x | {{ robot.y }}y</p>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
