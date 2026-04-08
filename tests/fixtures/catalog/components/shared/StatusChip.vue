<catalog lang="json">
{
  "title": "Status Chip",
  "category": "display",
  "domain": null,
  "tags": ["status", "chip"],
  "purpose": "Displays a generic status label.",
  "useWhen": "Use for base status output that is not domain-specific.",
  "avoidWhen": "Avoid for project lifecycle badges; use ProjectStatusBadge instead.",
  "status": "experimental",
  "related": ["ProjectStatusBadge"],
  "replaces": null,
  "usedBy": ["ProjectStatusBadge"]
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
