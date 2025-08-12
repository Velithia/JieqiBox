<template>
  <v-dialog
    v-model="dialogVisible"
    persistent
    max-width="800px"
    :fullscreen="$vuetify.display.smAndDown"
  >
    <v-card>
      <v-card-title>
        <span class="text-h6">{{ $t('notationTextDialog.title') }}</span>
      </v-card-title>

      <v-card-text>
        <v-textarea
          v-model="notationText"
          :label="$t('notationTextDialog.placeholder')"
          variant="outlined"
          rows="10"
          auto-grow
          clearable
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="blue-grey"
          variant="text"
          @click="copyToClipboard"
          :loading="isCopying"
        >
          {{ $t('notationTextDialog.copy') }}
        </v-btn>
        <v-btn color="error" variant="text" @click="closeDialog">
          {{ $t('common.close') }}
        </v-btn>
        <v-btn color="primary" variant="text" @click="apply">
          {{ $t('notationTextDialog.apply') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, inject, watch } from 'vue'

  interface Props {
    modelValue: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'apply', text: string): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Inject game state to get current notation
  const gameState: any = inject('game-state')

  const notationText = ref('')
  const isCopying = ref(false)

  const dialogVisible = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v),
  })

  // Populate on open with current notation JSON string
  watch(
    () => dialogVisible.value,
    opened => {
      if (opened && gameState?.generateGameNotation) {
        try {
          const notationObj = gameState.generateGameNotation()
          notationText.value = JSON.stringify(notationObj, null, 2)
        } catch (e) {
          // Fallback to empty text on error
          notationText.value = ''
        }
      }
    }
  )

  const closeDialog = () => {
    dialogVisible.value = false
  }

  const copyToClipboard = async () => {
    try {
      isCopying.value = true
      await navigator.clipboard.writeText(notationText.value || '')
    } catch (e) {
      console.error('Failed to copy notation JSON:', e)
      alert('Failed to copy to clipboard')
    } finally {
      isCopying.value = false
    }
  }

  const apply = () => {
    emit('apply', notationText.value || '')
  }
</script>

<style scoped></style>
