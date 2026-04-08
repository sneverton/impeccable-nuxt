<catalog lang="json">
{
  "title": "Project Status Badge",
  "category": "display",
  "domain": "projects",
  "tags": ["project", "status", "badge"],
  "purpose": "Displays the lifecycle status of a project.",
  "useWhen": "Use in project lists, cards, and headers.",
  "avoidWhen": "Avoid for generic statuses; use StatusChip instead.",
  "status": "stable",
  "related": ["StatusChip"],
  "replaces": null,
  "usedBy": ["ProjectDetailsPage"]
}
</catalog>

<script setup lang="ts">
defineProps<{
  status: 'draft' | 'active' | 'archived'
  size?: 'small' | 'default'
}>()
</script>

<template>
  <span><slot>{{ status }}</slot></span>
</template>
