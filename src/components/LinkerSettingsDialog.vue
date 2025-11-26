<template>
  <v-dialog v-model="dialogVisible" max-width="450">
    <v-card>
      <v-card-title class="headline">
        {{ $t('linker.settingsTitle') }}
      </v-card-title>

      <v-card-text>
        <!-- Mouse Click Delay -->
        <v-text-field
          v-model.number="localSettings.mouseClickDelay"
          :label="$t('linker.settingsForm.mouseClickDelay')"
          :hint="$t('linker.settingsForm.mouseClickDelayHint')"
          type="number"
          min="0"
          max="1000"
          suffix="ms"
          variant="outlined"
          density="compact"
          class="mb-4"
        />

        <!-- Mouse Move Delay -->
        <v-text-field
          v-model.number="localSettings.mouseMoveDelay"
          :label="$t('linker.settingsForm.mouseMoveDelay')"
          :hint="$t('linker.settingsForm.mouseMoveDelayHint')"
          type="number"
          min="0"
          max="2000"
          suffix="ms"
          variant="outlined"
          density="compact"
          class="mb-4"
        />

        <!-- Scan Interval -->
        <v-text-field
          v-model.number="localSettings.scanInterval"
          :label="$t('linker.settingsForm.scanInterval')"
          :hint="$t('linker.settingsForm.scanIntervalHint')"
          type="number"
          min="100"
          max="5000"
          suffix="ms"
          variant="outlined"
          density="compact"
          class="mb-4"
        />

        <!-- Animation Confirm -->
        <v-switch
          v-model="localSettings.animationConfirm"
          :label="$t('linker.settingsForm.animationConfirm')"
          color="primary"
          density="compact"
        />
        <p class="text-caption text-medium-emphasis mb-4">
          {{ $t('linker.settingsForm.animationConfirmHint') }}
        </p>
      </v-card-text>

      <v-card-actions>
        <v-btn variant="text" color="error" @click="handleReset">
          {{ $t('linker.settingsForm.reset') }}
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="close">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn color="primary" @click="handleSave">
          {{ $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { LinkerSettings } from '../composables/useLinker'

const props = defineProps<{
  modelValue: boolean
  settings: LinkerSettings
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:settings', settings: Partial<LinkerSettings>): void
  (e: 'reset'): void
}>()

const localSettings = ref<LinkerSettings>({ ...props.settings })

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

// Sync local settings when props change
watch(
  () => props.settings,
  newSettings => {
    localSettings.value = { ...newSettings }
  },
  { deep: true }
)

// Reset local settings when dialog opens
watch(dialogVisible, newValue => {
  if (newValue) {
    localSettings.value = { ...props.settings }
  }
})

const handleSave = () => {
  emit('update:settings', localSettings.value)
  dialogVisible.value = false
}

const handleReset = () => {
  emit('reset')
  dialogVisible.value = false
}

const close = () => {
  dialogVisible.value = false
}
</script>
