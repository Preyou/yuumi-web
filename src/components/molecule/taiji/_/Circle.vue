<script setup lang="ts">
const props = defineProps<{
  textList: string[]
  /** 使用css单位 */
  radius: string
  /** 当前显示文本 */
  current: string
}>()

const step = computed(() => 360 / props.textList.length)
let n = 0

watch(() => props.current, () => {
  if (props.current === props.textList[0]) {
    n++
  }
})
const angle = computed(() => props.textList.findIndex(item => item === props.current) * step.value + 360 * n)
</script>

<template>
  <Atom
    base-class="absolute left-1/2 top-1/2 duration-1000 transform"
    :style="{ transform: `rotate(${-angle}deg)` }"
  >
    <span
      v-for="(item, index) in textList"
      :key="index"
      class="left-1/2 top-1/2 inline-block text-nowrap"
      :style="{
        width: radius,
        transform: `translate(-50%, -50%) rotate(${index * (step)}deg)`,
        position: 'absolute',
        paddingLeft: radius,
        opacity: current === item ? 1 : 0.4,
      }"
    >{{ item }}</span>
  </Atom>
</template>
