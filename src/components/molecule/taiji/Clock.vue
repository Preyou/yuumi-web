<script setup lang="ts">
import nzh from 'nzh/cn'
import Circle from './_/Circle.vue'

// const now = ref(new Date(0))
// function run() {
//   now.value = new Date()
//   requestIdleCallback(run)
// }
// nextTick(run)

const time = useDateFormat(useNow(), 'YYYY-MMMM-D-dddd-H-m-s', { locales: 'zh-CN' })

const date = computed(() => time.value.split('-') as [string, string, string, string, string, string, string])

function num2Han(num: string) {
  return Array.from(num).map(n => ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'][+n]).join('')
}

const year = ref(num2Han(date.value[0]))

onMounted(() => {
  // countTo(0, +date.value[0], 700, (n) => {
  //   year.value = num2Han(n.toFixed(0).padStart(4, '0'))
  // })
})

const day = ref(30)
watch(() => date.value[1], () => {
  day.value = new Date(+date.value[0], new Date().getMonth() + 1, 0).getDate()
})

function expandNum(num: number, offset = 0, unit = '') {
  return Array.from({ length: num }).fill(0).map((_, i) => nzh.encodeS(`${i + offset}`) + unit)
}
</script>

<template>
  <Atom base-class="relative h-full w-full overflow-hidden">
    <Circle :text-list="expandNum(60, 0, '秒')" radius="53em" :current="`${nzh.encodeS(date[6])}秒`.replace(/^一十/, '十')" />
    <Circle :text-list="expandNum(60, 0, '分')" radius="43em" :current="`${nzh.encodeS(date[5])}分`.replace(/^一十/, '十')" />
    <Circle :text-list="expandNum(24, 0, '时')" radius="33em" :current="`${nzh.encodeS(date[4])}时`.replace(/^一十/, '十')" />
    <Circle :text-list="['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']" radius="25em" :current="date[3]" />
    <Circle :text-list="expandNum(day, 1, '日')" radius="15em" :current="`${nzh.encodeS(date[2])}日`.replace(/^一十/, '十')" />
    <Circle :text-list="expandNum(12, 1, '月')" radius="7em" :current="date[1]" />
    <div class="absolute left-1/2 top-1/2 transform -translate-1/2">
      {{ `${year}年` }}
    </div>
  </Atom>
</template>
