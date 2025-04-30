<script setup lang="ts">
import type { FeatureConfig, FeatureKey, Point } from '~/isovist/types'
import { cosine, euclidean, manhattan } from '~/isovist/diff'
import { computeFeatures, features } from '~/isovist/features'
import { orthogonalGrid, randomGrid } from '~/isovist/grid'
import { map } from '~/isovist/map'
import { useRobot } from '~/isovist/robot'
import { cast, EPS } from '~/isovist/utils'

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
  'drift',
  'radialLengthMin',
  'radialLengthMean',
  'radialLengthMax',
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

const db = computed(() => {
  const entries = grid.value.map((viewpoint) => {
    const points = cast(viewpoint, lines)
    const features = computeFeatures(viewpoint, points, config.value.features)
    return { viewpoint, features }
  })

  const keys = featureKeys.value

  const lim = {} as Record<FeatureKey, { min: number, max: number }>
  for (const k of keys) {
    for (const entry of entries) {
      const features = entry.features
      if (!lim[k]) {
        lim[k] = {
          min: Number.POSITIVE_INFINITY,
          max: Number.NEGATIVE_INFINITY,
        }
      }

      if (!features[k])
        continue

      if (features[k] < lim[k].min) {
        lim[k].min = features[k]
      }

      if (features[k] > lim[k].max) {
        lim[k].max = features[k]
      }
    }
  }

  for (const k of keys) {
    const { min, max } = lim[k]
    const denom = max - min

    for (const entry of entries) {
      const features = entry.features
      if (!features[k])
        continue

      features[k] = Math.abs(denom) < EPS ? 0 : (features[k] - min) / denom
    }
  }

  return { lim, entries }
})

const robot = useRobot({ x: 300, y: 90, speed: 1 })
const found = shallowRef<Point[]>()
const hover = shallowRef<Point>()

function find(k = 5) {
  const point = { x: robot.x.value, y: robot.y.value }
  const points = cast(point, lines)
  const features = computeFeatures(point, points, config.value.features)
  if (!features)
    return

  const keys = featureKeys.value
  for (const k of keys) {
    const { min, max } = db.value.lim[k]
    const denom = max - min
    features[k] = Math.abs(denom) < EPS ? 0 : (features[k]! - min) / denom
  }

  const distanceFn = (() => {
    switch (config.value.distance) {
      case 'euclidean': return euclidean
      case 'manhattan': return manhattan
      case 'cosine': return cosine
    }
  })()

  const matches: { viewpoint: Point, d: number }[] = []
  for (const entry of db.value.entries) {
    if (!entry.features)
      continue

    const d = distanceFn(features, entry.features)
    matches.push({ viewpoint: entry.viewpoint, d })
  }

  matches.sort((a, b) => a.d - b.d)
  const topk = matches.slice(0, k)

  return topk.map(x => x.viewpoint)
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
      ctx.fillStyle = textMutedClr
      ctx.beginPath()
      ctx.arc(g.x, g.y, 3, 0, 2 * Math.PI)
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

  if (found.value) {
    ctx.fillStyle = warningClr
    let i = 0
    for (const f of found.value) {
      ctx.beginPath()
      ctx.arc(f.x, f.y, 8 - i++, 0, 2 * Math.PI)
      ctx.fill()
    }
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

  const entry = db.value.entries.find((e) => {
    const nearX = (x - threshold) <= e.viewpoint.x && e.viewpoint.x <= (x + threshold)
    const nearY = (y - threshold) <= e.viewpoint.y && e.viewpoint.y <= (y + threshold)
    return nearX && nearY
  })

  if (!entry)
    return

  hover.value = entry.viewpoint
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
              Display
            </p>
            <div class="flex gap-6">
              <USwitch
                v-model="config.grid.show"
                label="Grid points"
              />
              <USwitch
                v-model="config.robot.rays"
                label="Robot rays"
              />
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="grid gap-3">
            <p class="font-extrabold">
              Grid
            </p>

            <URadioGroup
              v-model="config.grid.type"
              orientation="horizontal"
              :items="[
                { label: 'Orthogonal', value: 'orthogonal' },
                { label: 'Restricted random', value: 'random' },
              ]"
              :ui="{ fieldset: 'gap-x-6' }"
            />
            <div
              v-if="found"
              class="flex gap-2"
            >
              <span
                v-for="f, i of found"
                :key="`${f.x}_${f.y}`"
              >
                {{ i + 1 }}. {{ f.x }}x | {{ f.y }}y
              </span>
            </div>
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
                { label: 'Cosine', value: 'cosine' },
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
