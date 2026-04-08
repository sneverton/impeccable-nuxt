<catalog lang="json">
{
  "title": 123,
  "category": "display",
  "domain": 7,
  "tags": "broken",
  "purpose": "Exercises malformed catalog validation.",
  "useWhen": {},
  "avoidWhen": "Always.",
  "status": "invalid",
  "related": "GhostCard",
  "replaces": null,
  "usedBy": []
}
</catalog>

<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <span>{{ label }}</span>
</template>
