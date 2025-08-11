<template>
  <v-dialog v-model="dialogVisible" max-width="600px">
    <v-card>
      <v-card-title class="text-h6">
        {{ $t('eloCalculator.title') }}
      </v-card-title>

      <v-card-text>
        <div class="elo-calculator">
          <!-- Input Section (Common for all modes) -->
          <div class="input-section">
            <h4>{{ $t('eloCalculator.inputSection') }}</h4>

            <!-- Results format selector -->
            <v-radio-group
              v-model="resultsFormat"
              inline
              hide-details
              class="mb-2"
            >
              <template #label>
                <div class="mb-1 font-weight-bold">
                  {{ $t('eloCalculator.resultsFormat') }}
                </div>
              </template>
              <v-radio
                :label="$t('eloCalculator.formatWDL')"
                value="wdl"
              ></v-radio>
              <v-radio
                :label="$t('eloCalculator.formatPTNML')"
                value="ptnml"
              ></v-radio>
            </v-radio-group>

            <!-- WDL inputs -->
            <div v-if="resultsFormat === 'wdl'" class="input-row">
              <v-text-field
                v-model.number="wins"
                :label="$t('eloCalculator.wins')"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                hide-details
                class="input-field"
              />
              <v-text-field
                v-model.number="losses"
                :label="$t('eloCalculator.losses')"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                hide-details
                class="input-field"
              />
              <v-text-field
                v-model.number="draws"
                :label="$t('eloCalculator.draws')"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                hide-details
                class="input-field"
              />
            </div>

            <!-- PTNML inputs: [LL, LD+DL, LW+DD+WL, DW+WD, WW] -->
            <div v-else class="input-row ptnml-row">
              <v-text-field
                v-model.number="pt_ll"
                :label="$t('eloCalculator.ptnml.ll')"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                hide-details
                class="input-field"
              />
              <v-text-field
                v-model.number="pt_lddl"
                :label="$t('eloCalculator.ptnml.lddl')"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                hide-details
                class="input-field"
              />
              <v-text-field
                v-model.number="pt_center"
                :label="$t('eloCalculator.ptnml.center')"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                hide-details
                class="input-field"
              />
              <v-text-field
                v-model.number="pt_dwwd"
                :label="$t('eloCalculator.ptnml.dwwd')"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                hide-details
                class="input-field"
              />
              <v-text-field
                v-model.number="pt_ww"
                :label="$t('eloCalculator.ptnml.ww')"
                type="number"
                min="0"
                density="compact"
                variant="outlined"
                hide-details
                class="input-field"
              />
            </div>

            <div class="total-games">
              {{ $t('eloCalculator.totalGames') }}: {{ totalGames }}
            </div>
          </div>

          <!-- Basic Mode -->
          <div class="tab-item">
            <div v-if="eloResult" class="results-section">
              <h4>{{ $t('eloCalculator.resultsSection') }}</h4>
              <div class="result-item">
                <span class="label"
                  >{{ $t('eloCalculator.performance') }}:</span
                >
                <span class="value performance">{{ mergedEloDisplay }}</span>
              </div>
              <div class="result-item">
                <span class="label">{{ $t('eloCalculator.scoreRate') }}:</span>
                <span class="value">{{ scoreRateIntervalDisplay }}</span>
              </div>
              <div class="result-item">
                <span class="label">{{ $t('eloCalculator.los') }}:</span>
                <span class="value">{{ losDisplay }}</span>
              </div>
              <div class="result-item">
                <span class="label">{{ $t('eloCalculator.drawRatio') }}:</span>
                <span class="value">{{ drawRatioDisplay }}</span>
              </div>
            </div>
            <div v-else-if="totalGames > 0" class="no-results">
              {{ $t('eloCalculator.noResults') }}
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog" color="primary" variant="text">
          {{ $t('eloCalculator.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import {
    calculateEloRating,
    formatEloRating,
    formatErrorMargin,
    EloRatingResult,
    calculateEloRatingFromPTNML,
    computeLOSFromMeanAndSE,
    drawRatioBoundsFromPTNML,
  } from '@/utils/eloCalculator'

  // Props
  interface Props {
    modelValue: boolean
    initialWins?: number
    initialLosses?: number
    initialDraws?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    initialWins: 0,
    initialLosses: 0,
    initialDraws: 0,
  })

  // Emits
  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
  }>()

  // Reactive data
  const wins = ref(props.initialWins)
  const losses = ref(props.initialLosses)
  const draws = ref(props.initialDraws)

  // Results format: WDL or PTNML
  const resultsFormat = ref<'wdl' | 'ptnml'>('wdl')
  // PTNML inputs: [LL, LD+DL, LW+DD+WL, DW+WD, WW]
  const pt_ll = ref<number>(0)
  const pt_lddl = ref<number>(0)
  const pt_center = ref<number>(0)
  const pt_dwwd = ref<number>(0)
  const pt_ww = ref<number>(0)

  // Computed properties
  const dialogVisible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  const totalGames = computed(() => {
    if (resultsFormat.value === 'wdl') {
      const w = Number(wins.value) || 0
      const l = Number(losses.value) || 0
      const d = Number(draws.value) || 0
      return w + l + d
    } else {
      const ll = Number(pt_ll.value) || 0
      const lddl = Number(pt_lddl.value) || 0
      const center = Number(pt_center.value) || 0
      const dwwd = Number(pt_dwwd.value) || 0
      const ww = Number(pt_ww.value) || 0
      return 2 * (ll + lddl + center + dwwd + ww)
    }
  })

  // Basic mode result
  const eloResult = computed<EloRatingResult | null>(() => {
    if (totalGames.value === 0) return null
    if (resultsFormat.value === 'wdl') {
      const w = Number(wins.value) || 0
      const l = Number(losses.value) || 0
      const d = Number(draws.value) || 0
      return calculateEloRating(w, l, d)
    } else {
      const ll = Number(pt_ll.value) || 0
      const lddl = Number(pt_lddl.value) || 0
      const center = Number(pt_center.value) || 0
      const dwwd = Number(pt_dwwd.value) || 0
      const ww = Number(pt_ww.value) || 0
      return calculateEloRatingFromPTNML(ll, lddl, center, dwwd, ww)
    }
  })

  // Derived display values: merged Elo and nElo with 95% error margins
  const mergedEloDisplay = computed<string | null>(() => {
    if (!eloResult.value) return null
    const perf = formatEloRating(eloResult.value)
    const err = formatErrorMargin(eloResult.value)
    return `${perf} ${err}`.trim()
  })

  // LOS display
  const losDisplay = computed<string | null>(() => {
    if (!eloResult.value) return null
    const mu = eloResult.value.scoreRate
    const se = eloResult.value.standardError
    const los = computeLOSFromMeanAndSE(mu, se)
    if (!isFinite(los)) return null
    return `${(los * 100).toFixed(2)}%`
  })

  // Score rate display: point estimate with 95% CI [lower, upper]
  const scoreRateIntervalDisplay = computed<string | null>(() => {
    if (!eloResult.value) return null
    const mu = eloResult.value.scoreRate
    const se = eloResult.value.standardError
    if (!isFinite(mu) || !isFinite(se)) return null
    const z = 1.959963984540054
    const muMin = Math.max(0, Math.min(1, mu - z * se))
    const muMax = Math.max(0, Math.min(1, mu + z * se))
    return `${(mu * 100).toFixed(2)}% [${(muMin * 100).toFixed(2)}%, ${(muMax * 100).toFixed(2)}%]`
  })

  // Draw ratio display: point estimate with interval
  const drawRatioDisplay = computed<string | null>(() => {
    if (totalGames.value === 0) return null
    if (resultsFormat.value === 'wdl') {
      const w = Number(wins.value) || 0
      const l = Number(losses.value) || 0
      const d = Number(draws.value) || 0
      const N = w + l + d
      if (N <= 0) return null
      const p = d / N
      const z = 1.959963984540054
      const se = Math.sqrt(Math.max((p * (1 - p)) / N, 0))
      const pMin = Math.max(0, Math.min(1, p - z * se))
      const pMax = Math.max(0, Math.min(1, p + z * se))
      return `${(p * 100).toFixed(2)}% [${(pMin * 100).toFixed(2)}%, ${(pMax * 100).toFixed(2)}%]`
    } else {
      const ll = Number(pt_ll.value) || 0
      const lddl = Number(pt_lddl.value) || 0
      const center = Number(pt_center.value) || 0
      const dwwd = Number(pt_dwwd.value) || 0
      const ww = Number(pt_ww.value) || 0
      const [minR, maxR] = drawRatioBoundsFromPTNML(ll, lddl, center, dwwd, ww)
      const P = ll + lddl + center + dwwd + ww
      if (P <= 0) return null
      // Point estimate uses the midpoint of bounds, which equals assuming 1 draw in each center pair
      const point = (lddl + dwwd + center) / (2 * P)
      return `${(point * 100).toFixed(2)}% [${(minR * 100).toFixed(2)}%, ${(maxR * 100).toFixed(2)}%]`
    }
  })

  // Methods
  const closeDialog = () => {
    dialogVisible.value = false
  }

  // Watch for prop changes and update local values
  watch(
    () => props.initialWins,
    newValue => {
      wins.value = newValue
    }
  )
  watch(
    () => props.initialLosses,
    newValue => {
      losses.value = newValue
    }
  )
  watch(
    () => props.initialDraws,
    newValue => {
      draws.value = newValue
    }
  )
</script>

<style lang="scss" scoped>
  .elo-calculator {
    .input-section {
      margin-bottom: 24px;
      h4 {
        margin-bottom: 16px;
        color: rgb(var(--v-theme-primary));
      }
      .input-row {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
      }
      .input-field {
        flex: 1;
      }
      .total-games {
        font-weight: 600;
        color: rgb(var(--v-theme-primary));
      }
    }

    .tab-item {
      padding-top: 24px;
    }

    .results-section {
      h4 {
        margin-bottom: 16px;
        color: rgb(var(--v-theme-primary));
      }
      .result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        padding: 8px;
        border-radius: 4px;
        background-color: rgba(var(--v-theme-surface), 0.8);

        .label {
          font-weight: 600;
          color: rgb(var(--v-theme-on-surface));
        }
        .value {
          font-weight: 500;
          color: rgb(var(--v-theme-primary));
          // Prefer a stack close to Computer Modern and Times New Roman
          font-family:
            'Latin Modern Math', 'Latin Modern Roman', 'CMU Serif',
            'STIX Two Math', 'XITS Math', 'TeX Gyre Termes', 'Times New Roman',
            Times, serif;
          // Enable lining and tabular numerals where supported
          font-variant-numeric: lining-nums tabular-nums;
          -webkit-font-feature-settings:
            'lnum' 1,
            'tnum' 1;
          -moz-font-feature-settings:
            'lnum' 1,
            'tnum' 1;
          font-feature-settings:
            'lnum' 1,
            'tnum' 1;
          &.performance {
            font-weight: 700;
            font-size: 1.1em;
          }
        }
      }
    }

    .no-results {
      text-align: center;
      padding: 20px;
      color: rgb(var(--v-theme-on-surface));
      opacity: 0.6;
      font-style: italic;
    }
  }
</style>
