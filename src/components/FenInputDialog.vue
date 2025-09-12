<template>
  <v-dialog v-model="dialogVisible" persistent max-width="600px">
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ $t('fenInput.title') }}</span>
      </v-card-title>
      <v-card-text>
        <v-textarea
          :label="$t('fenInput.placeholder')"
          v-model="fenInput"
          rows="3"
          variant="outlined"
          auto-grow
          clearable
          :error-messages="errorMessage"
        ></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-darken-1" variant="text" @click="closeDialog">
          {{ $t('fenInput.cancel') }}
        </v-btn>
        <v-btn
          color="blue-darken-1"
          variant="text"
          @click="confirm"
          :disabled="!!errorMessage"
        >
          {{ $t('fenInput.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref, inject, watch, computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { validateJieqiFen } from '@/utils/fenValidator'

  const { t } = useI18n()

  // Define props and emits
  interface Props {
    modelValue: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm', fen: string): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Inject properties and methods from the main game state composable.
  const { generateFen }: any = inject('game-state')

  const fenInput = ref('')
  const errorMessage = ref('')

  // Computed property for v-model binding
  const dialogVisible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  // Watch for FEN input changes to validate in real-time
  watch(fenInput, newValue => {
    if (newValue && newValue.trim()) {
      if (validateJieqiFen(newValue)) {
        errorMessage.value = ''
      } else {
        errorMessage.value = t('errors.invalidFenFormat')
      }
    } else {
      errorMessage.value = ''
    }
  })

  // Watch for the dialog's visibility state changes.
  watch(dialogVisible, newValue => {
    // When the dialog becomes visible, populate the textarea with the current game's FEN string.
    if (newValue) {
      fenInput.value = generateFen()
      errorMessage.value = '' // Clear error message when dialog opens
    }
  })

  // Function to close the dialog
  function closeDialog() {
    // Close the dialog directly without processing FEN
    dialogVisible.value = false
  }

  // Function to confirm FEN input
  function confirm() {
    // Validate FEN before emitting
    if (fenInput.value && fenInput.value.trim()) {
      if (!validateJieqiFen(fenInput.value)) {
        errorMessage.value = t('errors.invalidFenFormat')
        return
      }
    }

    // Emit confirm event with FEN string
    emit('confirm', fenInput.value)
    // Close the dialog
    dialogVisible.value = false
  }
</script>
