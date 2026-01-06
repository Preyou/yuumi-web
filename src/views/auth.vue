<template>
  <Atom base-class="flex size-full">
    <UiTaijiClock class="bg-secondary flex-1" />
    <Atom as-child class="w-auto flex-none">
      <RouterView />
    </Atom>
  </Atom>
</template>
