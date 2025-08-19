<template>
  <v-dialog v-model="isVisible" max-width="600px" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ $t('humanVsAi.title') }}</span>
      </v-card-title>

      <v-card-text>
        <div class="selection-section">
          <h4 class="mb-3">{{ $t('humanVsAi.selectAiSide') }}</h4>

          <v-radio-group v-model="selectedAiSide" column>
            <v-radio
              :label="$t('humanVsAi.redAiBlackHuman')"
              value="red"
              color="red"
            />
            <v-radio
              :label="$t('humanVsAi.blackAiRedHuman')"
              value="black"
              color="black"
            />
          </v-radio-group>
        </div>

        <v-divider class="my-4" />

        <div class="options-section">
          <h4 class="mb-3">{{ $t('humanVsAi.options') }}</h4>

          <v-checkbox
            v-model="showEngineAnalysisOption"
            :label="$t('humanVsAi.showEngineAnalysis')"
            color="primary"
            hide-details
          />

          <div class="mt-2">
            <small class="text-caption">
              {{ $t('humanVsAi.engineAnalysisHint') }}
            </small>
          </div>

          <div class="mt-3">
            <small class="text-caption">
              <strong>{{ $t('humanVsAi.ponderNote') }}</strong
              ><br />
              {{ $t('humanVsAi.ponderUnifiedHint') }}
            </small>
          </div>
        </div>

        <v-divider class="my-4" />

        <div class="rules-section">
          <h4 class="mb-2">{{ $t('humanVsAi.rulesTitle') }}</h4>
          <ul class="text-body-2">
            <li>{{ $t('humanVsAi.rule1') }}</li>
            <li>{{ $t('humanVsAi.rule2') }}</li>
            <li>{{ $t('humanVsAi.rule3') }}</li>
            <li>{{ $t('humanVsAi.rule4') }}</li>
          </ul>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" variant="text" @click="handleCancel">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="handleConfirm"
          :disabled="!selectedAiSide"
        >
          {{ $t('humanVsAi.startGame') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'

  interface Props {
    modelValue: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (
      e: 'confirm',
      settings: { aiSide: 'red' | 'black'; showEngineAnalysis: boolean }
    ): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Local state
  const selectedAiSide = ref<'red' | 'black'>('black')
  const showEngineAnalysisOption = ref<boolean>(false)

  // Computed visibility
  const isVisible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
  })

  // Event handlers
  const handleCancel = () => {
    emit('update:modelValue', false)
  }

  const handleConfirm = () => {
    emit('confirm', {
      aiSide: selectedAiSide.value,
      showEngineAnalysis: showEngineAnalysisOption.value,
    })
    emit('update:modelValue', false)
  }
</script>

<style scoped lang="scss">
  .selection-section {
    margin-bottom: 16px;
  }

  .options-section {
    margin-bottom: 16px;
  }

  .rules-section {
    ul {
      padding-left: 20px;

      li {
        margin-bottom: 4px;
      }
    }
  }
</style>
