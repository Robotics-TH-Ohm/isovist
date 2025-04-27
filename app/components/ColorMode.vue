<script setup lang="ts">
const colorMode = useColorMode()
if (colorMode.preference === 'system') {
  colorMode.preference = 'dark'
}
</script>

<template>
  <UButton
    :icon="colorMode.preference === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
    variant="soft"
    square
    @click="colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'"
  />
</template>
