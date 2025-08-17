<template>
  <div ref="dockingTarget" class="docking-target">
    <template v-if="isDocked">
      <div class="panel-content section">
        <div class="panel-header">
          <slot name="header"></slot>
          <v-btn
            icon="mdi-arrow-expand"
            size="x-small"
            variant="text"
            @click="handleUndock"
            :title="$t('analysis.undockPanel')"
          />
        </div>
        <slot></slot>
      </div>
    </template>
  </div>

  <!-- Teleport the draggable component to body when undocked -->
  <Teleport to="body" v-if="!isDocked">
    <Vue3DraggableResizable
      :initW="panelState.width.value"
      :initH="panelState.height.value"
      v-model:x="panelState.x.value"
      v-model:y="panelState.y.value"
      v-model:w="panelState.width.value"
      v-model:h="panelState.height.value"
      :active="isActive"
      @update:active="isActive = $event"
      :draggable="true"
      :resizable="true"
      :parent="false"
      @drag-end="onDragEnd"
      classNameHandle="drag-handle"
      class="undocked-panel"
    >
      <div class="undocked-panel-wrapper">
        <div class="panel-header drag-handle">
          <slot name="header"></slot>
          <v-btn
            icon="mdi-dock-window"
            size="x-small"
            variant="text"
            @click="handleDock"
            :title="$t('analysis.dockPanel')"
          />
        </div>
        <div class="undocked-panel-content">
          <slot></slot>
        </div>
      </div>
    </Vue3DraggableResizable>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import Vue3DraggableResizable from 'vue3-draggable-resizable'
  import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css'
  import { usePanelManager } from '@/composables/usePanelManager'

  const props = defineProps({
    panelId: {
      type: String,
      required: true,
    },
  })

  const { getPanelState, updatePanelState, dockPanel, undockPanel } =
    usePanelManager()

  const panelRefs = getPanelState(props.panelId)
  if (!panelRefs) {
    throw new Error(`Panel with id ${props.panelId} not found`)
  }
  const panelState = panelRefs

  const isDocked = computed(() => panelState.isDocked.value)

  const dockingTarget = ref<HTMLElement | null>(null)
  const isActive = ref(false)

  const handleUndock = () => {
    if (dockingTarget.value) {
      const rect = dockingTarget.value.getBoundingClientRect()
      undockPanel(props.panelId, {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height < 100 ? 200 : rect.height, // Set a min height on undock
      })
    }
  }

  const handleDock = () => {
    dockPanel(props.panelId)
  }

  const onDragEnd = (payload: { x: number; y: number }) => {
    const sidebar = document.querySelector('.sidebar')
    if (sidebar) {
      const sidebarRect = sidebar.getBoundingClientRect()
      const proximity = 60

      if (
        payload.x + panelState.width.value > sidebarRect.left - proximity &&
        payload.x < sidebarRect.right + proximity &&
        payload.y + panelState.height.value > sidebarRect.top - proximity &&
        payload.y < sidebarRect.bottom + proximity
      ) {
        handleDock()
      }
    }
  }

  watch(
    () => [
      panelState.x.value,
      panelState.y.value,
      panelState.width.value,
      panelState.height.value,
    ],
    ([x, y, width, height]) => {
      updatePanelState(props.panelId, { x, y, width, height })
    }
  )
</script>

<style>
  .undocked-panel {
    z-index: 1000;
  }
  .docking-target {
    width: 100%;
  }

  .undocked-panel-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background-color: rgb(var(--v-theme-surface));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: arrow; /* Arrow cursor for docked state */
  }

  /* Move cursor only for undocked panel header */
  .undocked-panel-wrapper .panel-header {
    cursor: move;
  }

  .panel-header h3 {
    margin: 0;
    padding: 0 8px;
    font-size: 0.9rem;
    flex-grow: 1;
  }

  .undocked-panel-content {
    flex-grow: 1;
    overflow: auto;
    height: calc(100% - 30px);
    padding: 0 4px; /* Add padding to ensure content doesn't touch edges */
  }
  .panel-content {
    padding-bottom: 8px;
  }
</style>
