<template>
  <div v-if="visible" class="dialog-mask">
    <div class="dialog-container">
      <div class="dialog-icon">
        <v-icon
          :icon="
            gameResult === 'human_wins' ? 'mdi-trophy' : 'mdi-emoticon-sad'
          "
          :color="gameResult === 'human_wins' ? 'success' : 'error'"
          size="48"
        ></v-icon>
      </div>
      <div class="dialog-title">
        {{
          gameResult === 'human_wins'
            ? t('gameEnd.humanWins')
            : t('gameEnd.aiWins')
        }}
      </div>
      <div class="dialog-message">
        {{
          gameResult === 'human_wins'
            ? t('gameEnd.humanWinsMessage')
            : t('gameEnd.aiWinsMessage')
        }}
      </div>
      <div class="dialog-actions">
        <button class="btn confirm" @click="onClose">
          {{ t('gameEnd.ok') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'

  const props = defineProps({
    visible: Boolean,
    gameResult: {
      type: String,
      validator: value => ['human_wins', 'ai_wins'].includes(value),
    },
    onClose: Function,
  })

  const { t } = useI18n()
</script>

<style lang="scss" scoped>
  .dialog-mask {
    position: fixed;
    z-index: 2000;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dialog-container {
    background: rgb(var(--v-theme-surface));
    color: rgb(var(--v-theme-on-surface));
    border-radius: 12px;
    min-width: 320px;
    max-width: 90vw;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    padding: 32px 24px 24px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .dialog-icon {
    margin-bottom: 16px;
  }

  .dialog-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 12px;
    color: rgb(var(--v-theme-on-surface));
  }

  .dialog-message {
    font-size: 16px;
    margin-bottom: 24px;
    line-height: 1.5;
    color: rgb(var(--v-theme-on-surface));
  }

  .dialog-actions {
    display: flex;
    gap: 16px;
  }

  .btn {
    min-width: 88px;
    padding: 10px 24px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn.confirm {
    background: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-on-primary));
  }

  .btn.confirm:hover {
    background: rgb(var(--v-theme-primary-darken-1));
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
</style>
