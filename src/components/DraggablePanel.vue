<template>
  <div
    ref="dockingTarget"
    class="docking-target"
    :data-panel-id="panelId"
    :style="{ order: panelOrder }"
  >
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
      :initW="localWidth"
      :initH="localHeight"
      v-model:x="localX"
      v-model:y="localY"
      v-model:w="localWidth"
      v-model:h="localHeight"
      :active="isActive"
      @update:active="isActive = $event"
      :draggable="true"
      :resizable="true"
      :parent="false"
      @drag-end="onDragEnd"
      @resize-end="onResizeEnd"
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
  import { ref, watch, computed, onUnmounted } from 'vue'
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

  // Handle potential undefined order (migration path)
  const panelOrder = computed(() => {
    return panelState.order?.value ?? 0
  })

  const isDocked = computed(() => panelState.isDocked.value)

  const localX = ref(panelState.x.value)
  const localY = ref(panelState.y.value)
  const localWidth = ref(panelState.width.value)
  const localHeight = ref(panelState.height.value)

  // Sync local state when panelState changes (e.g. from external updates or initial load)
  watch(
    () => [
      panelState.x.value,
      panelState.y.value,
      panelState.width.value,
      panelState.height.value,
    ],
    ([x, y, width, height]) => {
      // Only update if not currently active to avoid fighting with drag/resize
      if (!isActive.value) {
        localX.value = x
        localY.value = y
        localWidth.value = width
        localHeight.value = height
      }
    }
  )

  const dockingTarget = ref<HTMLElement | null>(null)
  const isActive = ref(false)

  // Track dragging state to hide non-active panels during drag
  watch(isActive, active => {
    if (active) {
      document.body.classList.add('panel-dragging')
    } else {
      // Use setTimeout to ensure all panels have updated their active state
      setTimeout(() => {
        // Check if any panel is still active
        const hasActivePanel = document.querySelector('.undocked-panel.active')
        if (!hasActivePanel) {
          document.body.classList.remove('panel-dragging')
        }
      }, 0)
    }
  })

  // Clean up on unmount
  onUnmounted(() => {
    if (!isActive.value) {
      const hasActivePanel = document.querySelector('.undocked-panel.active')
      if (!hasActivePanel) {
        document.body.classList.remove('panel-dragging')
      }
    }
  })

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

  const onResizeEnd = (payload: {
    x: number
    y: number
    w: number
    h: number
  }) => {
    updatePanelState(props.panelId, {
      x: payload.x,
      y: payload.y,
      width: payload.w,
      height: payload.h,
    })
  }

  const onDragEnd = (payload: { x: number; y: number }) => {
    // Update position on drag end
    updatePanelState(props.panelId, {
      x: payload.x,
      y: payload.y,
    })

    const sidebar = document.querySelector('.sidebar')
    if (sidebar) {
      const sidebarRect = sidebar.getBoundingClientRect()
      const panelCenterX = payload.x + panelState.width.value / 2
      const panelCenterY = payload.y + panelState.height.value / 2

      // Check if panel center is inside the sidebar
      if (
        panelCenterX >= sidebarRect.left &&
        panelCenterX <= sidebarRect.right &&
        panelCenterY >= sidebarRect.top &&
        panelCenterY <= sidebarRect.bottom
      ) {
        // Calculate insertion index based on Y position relative to other docked panels
        const dockedPanels = Array.from(
          sidebar.querySelectorAll('.docking-target')
        ).filter(el => {
          // Exclude the current panel (it might be undocked but the div exists)
          // Also ensure it has height (is visible)
          return (
            el.getAttribute('data-panel-id') !== props.panelId &&
            el.getBoundingClientRect().height > 0
          )
        })

        let insertIndex = 0

        // Sort panels by visual position (top coordinate)
        const sortedDockedPanels = dockedPanels.sort((a, b) => {
          return a.getBoundingClientRect().top - b.getBoundingClientRect().top
        })

        for (const panelEl of sortedDockedPanels) {
          const rect = panelEl.getBoundingClientRect()
          const dockedPanelCenterY = rect.top + rect.height / 2

          if (panelCenterY < dockedPanelCenterY) {
            break
          }
          insertIndex++
        }

        // Reconstruct the full desired order of IDs based on visual sort
        const newOrderIds = sortedDockedPanels.map(el =>
          el.getAttribute('data-panel-id')
        )
        // Insert our panel ID at the right spot
        if (props.panelId) {
          newOrderIds.splice(insertIndex, 0, props.panelId)
        }

        // Now update all orders
        newOrderIds.forEach((id, idx) => {
          if (id) updatePanelState(id, { order: idx })
        })

        handleDock()
      }
    }
  }
</script>

<style>
  .undocked-panel {
    z-index: 1000;
  }
  /* Hide undocked panel when not active only during dragging to prevent ghost/duplicate panels */
  body.panel-dragging .undocked-panel:not(.active) {
    display: none !important;
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
