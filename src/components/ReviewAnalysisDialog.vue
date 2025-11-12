<template>
  <v-dialog v-model="isVisible" width="440" persistent>
    <v-card>
      <v-card-title>{{ $t('reviewDialog.title') }}</v-card-title>
      <v-card-text>
        <div style="display: flex; gap: 12px; align-items: center">
          <v-text-field
            v-model.number="reviewMovetime"
            :label="$t('reviewDialog.movetime')"
            type="number"
            density="compact"
            variant="outlined"
            min="100"
          />
          <div v-if="isReviewing">
            {{
              $t('reviewDialog.progress', {
                current: reviewProgress,
                total: reviewTotal,
              })
            }}
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel" :disabled="isStopping">{{
          $t('common.cancel')
        }}</v-btn>
        <v-btn
          color="deep-orange"
          @click="startReview"
          :loading="isReviewing"
          :disabled="isReviewing"
          >{{ $t('common.execute') }}</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { computed, inject, nextTick, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  const props = defineProps<{ modelValue: boolean }>()
  const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
  const { t } = useI18n()

  const gameState: any = inject('game-state')
  const engineState: any = inject('engine-state')

  const isVisible = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v),
  })

  const reviewMovetime = ref<number>(1000)
  const isReviewing = ref(false)
  const isStopping = ref(false)
  const reviewProgress = ref(0)
  const reviewTotal = ref(0)
  const cancelRequested = ref(false)

  const MATE_SCORE_BASE = 30000

  const waitForEngineStop = (): Promise<void> => {
    return new Promise(resolve => {
      if (!engineState.isThinking?.value) {
        resolve()
        return
      }
      const unwatch = watch(
        () => engineState.isThinking?.value,
        thinking => {
          if (!thinking) {
            unwatch()
            resolve()
          }
        }
      )
    })
  }

  const extractScoreFromOutput = (
    startIndex = 0
  ): { score: number | null; depth?: number; nodes?: number } => {
    try {
      const out: any[] = engineState.engineOutput?.value || []
      console.log('[EXTRACT DEBUG] Engine output length:', out.length)
      console.log('[EXTRACT DEBUG] Start index (requested):', startIndex)

      // If the buffer was cleared during analysis, clamp lowerBound to 0
      const lowerBound =
        startIndex > 0 && startIndex <= out.length - 1 ? startIndex : 0
      console.log(
        '[EXTRACT DEBUG] Start index (effective lowerBound):',
        lowerBound
      )

      let lastLine = ''
      for (let i = out.length - 1; i >= lowerBound; i--) {
        const line = out[i]
        const text = line?.text || ''
        if (line?.kind === 'recv' && text.includes('score')) {
          lastLine = text
          console.log('[EXTRACT DEBUG] Found score line at index:', i, text)
          break
        }
      }

      if (!lastLine) {
        console.log('[EXTRACT DEBUG] No score line found')
        return { score: null }
      }

      const m = lastLine.match(/score\s+(cp|mate)\s+(-?\d+)/)
      if (!m) {
        console.log('[EXTRACT DEBUG] No score match in line:', lastLine)
        return { score: null }
      }

      const type = m[1]
      const val = parseInt(m[2])
      let cp: number
      if (type === 'mate') {
        const ply = Math.abs(val)
        // In UCI, mate 0 indicates side-to-move is checkmated (losing), treat as negative
        const sign = val === 0 ? -1 : val > 0 ? 1 : -1
        cp = sign * (MATE_SCORE_BASE - ply)
        console.log('[EXTRACT DEBUG] Mate score conversion:', {
          val,
          ply,
          sign,
          cp,
        })
      } else {
        cp = val
        console.log('[EXTRACT DEBUG] CP score:', cp)
      }

      const depthMatch = lastLine.match(/depth\s+(\d+)/)
      const nodesMatch = lastLine.match(/nodes\s+(\d+)/)

      const result = {
        score: cp,
        depth: depthMatch ? parseInt(depthMatch[1]) : undefined,
        nodes: nodesMatch ? parseInt(nodesMatch[1]) : undefined,
      }

      console.log('[EXTRACT DEBUG] Final result:', result)
      return result
    } catch (e) {
      console.log('[EXTRACT DEBUG] Error extracting score:', e)
      return { score: null }
    }
  }

  const analyzeOnce = async (
    fen: string,
    movetimeMs: number
  ): Promise<{
    score: number | null
    depth?: number
    nodes?: number
    timeUsed?: number
  }> => {
    console.log('[ANALYZE DEBUG] Starting analysis with FEN:', fen)
    console.log('[ANALYZE DEBUG] Movetime:', movetimeMs)

    const startLen = (engineState.engineOutput?.value || []).length
    const settings = {
      movetime: Math.max(100, Math.floor(movetimeMs)),
      maxThinkTime: 0,
      maxDepth: 0,
      maxNodes: 0,
      analysisMode: 'movetime',
    }

    console.log('[ANALYZE DEBUG] Analysis settings:', settings)
    console.log('[ANALYZE DEBUG] Engine output start length:', startLen)

    if (engineState.stopAnalysis) {
      engineState.stopAnalysis({ playBestMoveOnStop: false })
      await waitForEngineStop()
    }
    const startTs = Date.now()
    engineState.startAnalysis(settings, [], fen, [])
    await waitForEngineStop()
    const timeUsed = Date.now() - startTs

    console.log('[ANALYZE DEBUG] Analysis completed, time used:', timeUsed)

    let { score, depth, nodes } = extractScoreFromOutput(startLen)
    // Fallback if nothing found (e.g., buffer cleared during analysis)
    if (score === null) {
      console.log(
        '[ANALYZE DEBUG] No score found with startLen. Retrying full scan...'
      )
      const retry = extractScoreFromOutput(0)
      score = retry.score
      depth = retry.depth
      nodes = retry.nodes
    }

    console.log('[ANALYZE DEBUG] Extracted result:', {
      score,
      depth,
      nodes,
      timeUsed,
    })

    return { score, depth, nodes, timeUsed }
  }

  const pickAnnotation = (
    delta: number,
    sBefore: number | null,
    sAfter: number | null
  ): '!!' | '!' | '!?' | '?!' | '?' | '??' | undefined => {
    // Check if this is a mate position (before or after move)
    const isMateBefore =
      sBefore !== null && Math.abs(sBefore) > MATE_SCORE_BASE - 100
    const isMateAfter =
      sAfter !== null && Math.abs(sAfter) > MATE_SCORE_BASE - 100

    // Handle mate situations
    if (isMateBefore || isMateAfter) {
      // Case 1: Had a mate but threw it away (mate miss - 漏杀)
      if (
        isMateBefore &&
        sBefore! > MATE_SCORE_BASE - 100 &&
        (!isMateAfter || sAfter! < MATE_SCORE_BASE - 100)
      ) {
        return '??' // Threw away a winning mate - this is a blunder
      }

      // Case 2: Was losing but opponent gave mate back
      if (
        isMateBefore &&
        sBefore! < -(MATE_SCORE_BASE - 100) &&
        isMateAfter &&
        sAfter! > MATE_SCORE_BASE - 100
      ) {
        return '!!' // Opponent blundered mate back - excellent
      }

      // Case 3: Had mate, still have mate but took longer route
      if (
        isMateBefore &&
        sBefore! > MATE_SCORE_BASE - 100 &&
        isMateAfter &&
        sAfter! > MATE_SCORE_BASE - 100
      ) {
        const plyBefore = MATE_SCORE_BASE - sBefore!
        const plyAfter = MATE_SCORE_BASE - sAfter!
        if (plyAfter > plyBefore + 2) {
          // Took significantly longer mate
          return '?' // Inaccurate but not a blunder
        }
        return undefined // Still mate, reasonable path
      }

      // Case 4: Other mate situations - significant score changes
      if (delta <= -500) return '??'
      if (delta >= 500) return '!!'
      return undefined
    }

    // Normal (non-mate) position evaluation
    if (delta <= -300) return '??'
    if (delta <= -150) return '?'
    if (delta <= -60) return '?!'
    if (delta >= 300) return '!!'
    if (delta >= 150) return '!'
    if (delta >= 60) return '!?'
    return undefined
  }

  const startReview = async () => {
    if (!engineState?.isEngineLoaded?.value) {
      alert(t('analysis.noEngineLoaded'))
      return
    }
    try {
      isReviewing.value = true
      isStopping.value = false
      cancelRequested.value = false
      reviewProgress.value = 0
      const history: any[] = gameState.history?.value || []
      const total = history.filter(e => e.type === 'move').length
      reviewTotal.value = total

      for (let idx = history.length - 1; idx >= 0; idx--) {
        const entry = history[idx]
        if (!entry || entry.type !== 'move') continue

        console.log('[REVIEW DEBUG] Analyzing move at index:', idx)
        console.log('[REVIEW DEBUG] Move data:', entry.data)
        console.log('[REVIEW DEBUG] Move FEN:', entry.fen)

        // Replay UI to the position before this move for correct analysis context
        gameState.replayToMove?.(idx)
        await nextTick()

        const fenBefore =
          idx === 0 ? gameState.initialFen?.value : history[idx - 1].fen
        const fenAfter = entry.fen

        console.log('[REVIEW DEBUG] FEN before move:', fenBefore)
        console.log('[REVIEW DEBUG] FEN after move:', fenAfter)

        // Analyze position before the move (mover to play)
        console.log('[REVIEW DEBUG] Analyzing position before move...')
        const beforeRes = await analyzeOnce(fenBefore, reviewMovetime.value)
        if (cancelRequested.value) break

        console.log('[REVIEW DEBUG] Before analysis result:', {
          score: beforeRes.score,
          depth: beforeRes.depth,
          nodes: beforeRes.nodes,
          timeUsed: beforeRes.timeUsed,
        })

        // Analyze position after the move (opponent to play)
        console.log('[REVIEW DEBUG] Analyzing position after move...')
        const afterRes = await analyzeOnce(fenAfter, reviewMovetime.value)
        if (cancelRequested.value) break

        console.log('[REVIEW DEBUG] After analysis result:', {
          score: afterRes.score,
          depth: afterRes.depth,
          nodes: afterRes.nodes,
          timeUsed: afterRes.timeUsed,
        })

        const sBefore = beforeRes.score ?? 0
        const sAfter = afterRes.score ?? 0
        // Convert sAfter to mover's perspective (opponent's eval from our perspective is negated)
        const sAfterFromMoverPerspective = -sAfter
        // Change for mover: eval_after - eval_before (both from mover's perspective)
        const delta = sAfterFromMoverPerspective - sBefore

        console.log('[REVIEW DEBUG] Score calculation:', {
          sBefore,
          sAfter,
          sAfterFromMoverPerspective,
          delta,
          finalScore: sBefore,
        })

        // Record the score for the position before the move (what we analyzed)
        const updated = {
          ...entry,
          engineScore: sBefore, // Score of the position before the move
          engineTime: reviewMovetime.value,
          engineDepth: beforeRes.depth,
          engineNodes: beforeRes.nodes,
          engineRequestedMovetime: reviewMovetime.value,
        }
        gameState.history.value[idx] = updated

        console.log('[REVIEW DEBUG] Updated history entry:', {
          index: idx,
          move: entry.data,
          engineScore: updated.engineScore,
          engineTime: updated.engineTime,
          engineDepth: updated.engineDepth,
          engineNodes: updated.engineNodes,
        })

        const ann = pickAnnotation(
          delta,
          beforeRes.score,
          sAfterFromMoverPerspective
        )
        gameState.updateMoveAnnotation?.(idx, ann)

        console.log('[REVIEW DEBUG] Annotation assigned:', ann)

        reviewProgress.value++
        console.log(
          '[REVIEW DEBUG] Progress:',
          `${reviewProgress.value}/${reviewTotal.value}`
        )
      }
    } catch (e) {
      console.error('Review analysis failed:', e)
    } finally {
      isStopping.value = true
      if (engineState.stopAnalysis) {
        engineState.stopAnalysis({ playBestMoveOnStop: false })
        await waitForEngineStop()
      }
      isStopping.value = false
      isReviewing.value = false
      if (!cancelRequested.value) isVisible.value = false
    }
  }

  const handleCancel = async () => {
    if (isReviewing.value) {
      cancelRequested.value = true
      isStopping.value = true
      if (engineState.stopAnalysis) {
        engineState.stopAnalysis({ playBestMoveOnStop: false })
        await waitForEngineStop()
      }
      isStopping.value = false
      isReviewing.value = false
    }
    isVisible.value = false
  }
</script>
