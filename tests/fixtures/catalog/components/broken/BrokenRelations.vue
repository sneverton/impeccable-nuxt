<catalog lang="json">
{
  "title": "Broken Relations",
  "category": "display",
  "domain": "projects",
  "tags": ["broken"],
  "purpose": "Provides a broken related reference for validation coverage.",
  "useWhen": "Never; this fixture exists only for tests.",
  "avoidWhen": "Always.",
  "status": "draft",
  "related": ["GhostCard"],
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
