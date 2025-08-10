<template>
  <v-dialog v-model="isDialogVisible" max-width="500px">
    <v-card>
      <v-card-title>{{ $t('interfaceSettings.title') }}</v-card-title>
      <v-card-text>
        <v-switch
          v-model="showCoordinates"
          :label="$t('interfaceSettings.showCoordinates')"
          color="primary"
        ></v-switch>
        <v-switch
          v-model="parseUciInfo"
          :label="$t('interfaceSettings.parseUciInfo')"
          color="primary"
        ></v-switch>
        <v-switch
          v-model="showAnimations"
          :label="$t('interfaceSettings.showAnimations')"
          color="primary"
        ></v-switch>
        <v-switch
          v-model="showPositionChart"
          :label="$t('interfaceSettings.showPositionChart')"
          color="primary"
        ></v-switch>
        <v-switch
          v-model="darkMode"
          :label="$t('interfaceSettings.darkMode')"
          color="primary"
        ></v-switch>
        <v-switch
          v-model="autosave"
          :label="$t('interfaceSettings.autosave')"
          color="primary"
        ></v-switch>
        <v-switch
          v-model="useNewFenFormat"
          :label="$t('interfaceSettings.useNewFenFormat')"
          color="primary"
        ></v-switch>
        <v-text-field
          v-model.number="engineLogLineLimit"
          :label="$t('interfaceSettings.engineLogLineLimit')"
          type="number"
          min="50"
          max="1000"
          step="50"
          color="primary"
          variant="outlined"
          density="compact"
        ></v-text-field>
        <v-switch
          v-model="showChineseNotation"
          :label="$t('interfaceSettings.showChineseNotation')"
          color="primary"
        ></v-switch>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="closeDialog">{{
          $t('common.close')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { useInterfaceSettings } from '@/composables/useInterfaceSettings'

  const isDialogVisible = defineModel<boolean>()

  // Get interface settings from shared state
  const {
    showCoordinates,
    parseUciInfo,
    showAnimations,
    showPositionChart,
    darkMode,
    autosave,
    useNewFenFormat,
    engineLogLineLimit,
    showChineseNotation,
  } = useInterfaceSettings()

  const closeDialog = () => {
    isDialogVisible.value = false
  }
</script>
