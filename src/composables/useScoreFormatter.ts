import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MATE_SCORE_BASE } from '@/utils/constants'

export interface ScoreInfo {
  scoreType?: string
  scoreValue?: string | number
}

export function useScoreFormatter(
  isPondering: Ref<boolean>,
  isInfinitePondering: Ref<boolean>,
  analysisUiFen: Ref<string>,
  isBoardFlipped: Ref<boolean>
) {
  const { t } = useI18n()

  const shouldFlipScore = computed(() => {
    let flip = false
    if (isPondering.value && !isInfinitePondering.value) flip = !flip
    if (analysisUiFen.value.includes(' b ')) flip = !flip
    if (isBoardFlipped.value) flip = !flip
    return flip
  })

  const normalizeScore = (info: ScoreInfo) => {
    let scoreValue = 0
    let isMate = false
    if (info.scoreType && info.scoreValue !== undefined) {
      scoreValue =
        typeof info.scoreValue === 'string'
          ? parseInt(info.scoreValue, 10)
          : (info.scoreValue as number)
      isMate = info.scoreType === 'mate'
    }

    if (shouldFlipScore.value) {
      scoreValue = -scoreValue
    }

    return { scoreValue, isMate }
  }

  const getScoreClass = (scoreValue: number, isMate: boolean) => {
    if (isMate) {
      return scoreValue > 0 ? 'score-mate-positive' : 'score-mate-negative'
    }
    if (scoreValue > 50) return 'score-positive'
    if (scoreValue < -50) return 'score-negative'
    return 'score-neutral'
  }

  const formatScoreText = (scoreValue: number, isMate: boolean) => {
    if (isMate) {
      const sign = scoreValue > 0 ? '+' : '-'
      return `${sign}M${Math.abs(scoreValue)}`
    }
    if (scoreValue === 0) return '0'
    return scoreValue > 0 ? `+${scoreValue}` : `${scoreValue}`
  }

  const formatScoreHtml = (info: ScoreInfo) => {
    const { scoreValue, isMate } = normalizeScore(info)
    const className = getScoreClass(scoreValue, isMate)
    const text = formatScoreText(scoreValue, isMate)

    if (isMate) {
      return `<span class="${className}">${t('uci.mate')}: ${text}</span>`
    }
    return `<span class="${className}">${t('uci.score')}: ${text}</span>`
  }

  // For history entries where score is a raw number (mate is MATE_SCORE_BASE - ply)
  const getScoreClassFromRaw = (score: number) => {
    if (score >= MATE_SCORE_BASE - 999) return 'score-mate-positive'
    if (score <= -(MATE_SCORE_BASE - 999)) return 'score-mate-negative'
    if (score > 50) return 'score-positive'
    if (score < -50) return 'score-negative'
    return 'score-neutral'
  }

  const formatScoreFromRaw = (score: number) => {
    if (Math.abs(score) >= MATE_SCORE_BASE - 999) {
      const sign = score > 0 ? '+' : '-'
      const ply = Math.max(
        0,
        MATE_SCORE_BASE - Math.min(MATE_SCORE_BASE - 1, Math.abs(score))
      )
      return `${sign}M${ply}`
    }
    return score.toString()
  }

  return {
    shouldFlipScore,
    normalizeScore,
    getScoreClass,
    formatScoreText,
    formatScoreHtml,
    getScoreClassFromRaw,
    formatScoreFromRaw,
  }
}
