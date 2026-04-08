<catalog lang="json">
{
  "title": "Malformed Catalog",
  "category": "display",
  "domain": 7,
  "tags": "broken",
  "purpose": "Exercises malformed catalog validation.",
  "useWhen": "Never.",
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
