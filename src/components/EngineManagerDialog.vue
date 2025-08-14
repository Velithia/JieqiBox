<template>
  <v-dialog v-model="isVisible" max-width="800px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">{{ $t('engineManager.title') }}</span>
      </v-card-title>

      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="engines"
          item-key="id"
          class="elevation-1"
        >
          <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="openUciOptionsEditor(item)">
              mdi-cog
            </v-icon>
            <v-icon small class="mr-2" @click="editEngine(item)">
              mdi-pencil
            </v-icon>
            <v-icon small @click="prepareToDeleteEngine(item)">
              mdi-delete
            </v-icon>
          </template>
        </v-data-table>
      </v-card-text>

      <v-card-actions>
        <v-btn
          v-if="isAndroidPlatform"
          color="blue-darken-1"
          @click="addEngineAndroid"
          >{{ $t('engineManager.addEngineAndroid') }}</v-btn
        >
        <v-btn v-else color="blue-darken-1" @click="addEngineDesktop">{{
          $t('engineManager.addEngine')
        }}</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" @click="closeDialog">{{
          $t('common.close')
        }}</v-btn>
      </v-card-actions>
    </v-card>

    <!-- Add/Edit Engine Dialog -->
    <v-dialog v-model="editDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          <span class="headline">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-text-field
              v-model="editedEngine.name"
              :label="$t('engineManager.engineName')"
              :rules="[rules.required, rules.unique]"
            ></v-text-field>
            <v-text-field
              v-model="editedEngine.path"
              :label="$t('engineManager.enginePath')"
              disabled
            ></v-text-field>
            <v-text-field
              v-model="editedEngine.args"
              :label="$t('engineManager.arguments')"
            ></v-text-field>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" @click="closeEditDialog">{{
            $t('common.cancel')
          }}</v-btn>
          <v-btn color="blue-darken-1" @click="saveEngine">{{
            $t('common.save')
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- UCI Options (Saved) Editor Dialog -->
    <v-dialog v-model="uciDialogVisible" max-width="700px" persistent>
      <v-card>
        <v-card-title>
          <span class="headline">
            {{ $t('uciEditor.title') }} -
            {{ selectedEngineForOptions?.name || '' }}
          </span>
        </v-card-title>
        <v-card-text>
          <div v-if="uciRows.length === 0" class="text-medium-emphasis mb-4">
            {{ $t('uciEditor.noSaved') }}
          </div>

          <div
            v-for="(row, idx) in uciRows"
            :key="idx"
            class="d-flex align-center mb-3 gap-2"
          >
            <v-text-field
              v-model="row.key"
              :label="$t('uciEditor.optionName')"
              density="compact"
              variant="outlined"
              hide-details
              class="mr-2"
              style="max-width: 260px"
            />

            <v-select
              v-model="row.type"
              :items="typeItems"
              item-title="label"
              item-value="value"
              :label="$t('uciEditor.type')"
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 140px"
              class="mr-2"
            />

            <v-text-field
              v-if="row.type === 'string' || row.type === 'number'"
              v-model="row.value"
              :type="row.type === 'number' ? 'number' : 'text'"
              :label="$t('uciEditor.optionValue')"
              density="compact"
              variant="outlined"
              hide-details
              class="flex-grow-1 mr-2"
            />
            <v-select
              v-else-if="row.type === 'combo'"
              v-model="row.value"
              :items="row.vars && row.vars.length ? row.vars : []"
              :label="$t('uciEditor.optionValue')"
              density="compact"
              variant="outlined"
              hide-details
              class="flex-grow-1 mr-2"
            />
            <v-switch
              v-else-if="row.type === 'boolean'"
              v-model="row.value"
              color="primary"
              hide-details
              class="mr-2"
            />
            <v-btn
              v-else-if="row.type === 'button'"
              variant="outlined"
              color="primary"
              class="mr-2"
              @click="toggleButtonFlag(row)"
            >
              {{
                row.value
                  ? $t('uciEditor.willExecute')
                  : $t('uciEditor.noExecute')
              }}
            </v-btn>

            <v-btn icon variant="text" color="red" @click="removeUciRow(idx)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>

          <v-btn color="primary" variant="outlined" @click="addUciRow">
            <v-icon start>mdi-plus</v-icon>
            {{ $t('uciEditor.addOption') }}
          </v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="onClearUciOptions">
            {{ $t('uciOptions.clearSettings') }}
          </v-btn>
          <v-btn color="grey-darken-1" @click="closeUciDialog">{{
            $t('common.cancel')
          }}</v-btn>
          <v-btn color="blue-darken-1" @click="saveUciOptions">{{
            $t('common.save')
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Deletion Confirmation Dialog -->
    <v-dialog v-model="confirmDeleteDialog" max-width="450px">
      <v-card>
        <v-card-title class="text-h5">{{
          $t('engineManager.confirmDeleteTitle')
        }}</v-card-title>
        <v-card-text>
          {{
            $t('engineManager.confirmDeleteMessage', {
              name: engineToDelete?.name,
            })
          }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" text @click="cancelDelete">{{
            $t('common.cancel')
          }}</v-btn>
          <v-btn color="red-darken-1" text @click="confirmDelete">{{
            $t('common.delete')
          }}</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import {
    useConfigManager,
    type ManagedEngine,
  } from '../composables/useConfigManager'
  import { open } from '@tauri-apps/plugin-dialog'
  import { invoke } from '@tauri-apps/api/core'
  import type { UnlistenFn } from '@tauri-apps/api/event'
  import { isAndroidPlatform as checkAndroidPlatform } from '../utils/platform'

  // Props and Emits
  const props = defineProps<{ modelValue: boolean }>()
  const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

  // Composables
  const { t } = useI18n()
  const configManager = useConfigManager()

  // State
  const engines = ref<ManagedEngine[]>([])
  const editDialog = ref(false)
  const isEditing = ref(false)
  const editedEngine = ref<ManagedEngine>({
    id: '',
    name: '',
    path: '',
    args: '',
  })
  const defaultEngine: ManagedEngine = {
    id: '',
    name: '',
    path: '',
    args: '',
  }
  let unlistenAndroidAdd: Promise<UnlistenFn> | null = null
  let unlistenNnueRequest: Promise<UnlistenFn> | null = null

  // --- NEW State for Deletion Flow ---
  const confirmDeleteDialog = ref(false)
  const engineToDelete = ref<ManagedEngine | null>(null)

  // UCI options editor state
  const uciDialogVisible = ref(false)
  const selectedEngineForOptions = ref<ManagedEngine | null>(null)
  type RowType = 'string' | 'number' | 'boolean' | 'combo' | 'button'
  interface UciRow {
    key: string
    value: any
    type: RowType
    vars?: string[] // for combo choices (optional, not persisted)
    varsCsv?: string // UI helper for editing choices
  }
  const uciRows = ref<UciRow[]>([])
  const typeItems = [
    { label: t('uciEditor.typeString'), value: 'string' },
    { label: t('uciEditor.typeNumber'), value: 'number' },
    { label: t('uciEditor.typeSwitch'), value: 'boolean' },
    { label: t('uciEditor.typeCombo'), value: 'combo' },
    { label: t('uciEditor.typeButton'), value: 'button' },
  ]

  // Computed properties
  const isVisible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  const formTitle = computed(() => {
    return isEditing.value
      ? t('engineManager.editEngine')
      : t('engineManager.addEngine')
  })

  const isAndroidPlatform = computed(() => checkAndroidPlatform())

  // Table headers
  const headers = computed(() => [
    { title: t('engineManager.engineName'), key: 'name', minWidth: '150px' },
    { title: t('engineManager.enginePath'), key: 'path', minWidth: '250px' },
    { title: t('engineManager.arguments'), key: 'args', minWidth: '150px' },
    {
      title: t('engineManager.actions'),
      key: 'actions',
      sortable: false,
      align: 'end' as const,
    },
  ])

  // Validation Rules
  const rules = {
    required: (value: string) => !!value || t('common.required'),
    unique: (value: string) => {
      if (isEditing.value) {
        // When editing, check uniqueness against other engines (excluding current one)
        return (
          !engines.value.some(
            (e: ManagedEngine) =>
              e.name === value && e.id !== editedEngine.value.id
          ) || t('engineManager.nameExists')
        )
      }
      // When adding new engine, check against all engines
      return (
        !engines.value.some((e: ManagedEngine) => e.name === value) ||
        t('engineManager.nameExists')
      )
    },
  }

  // Methods
  const loadEnginesFromConfig = async () => {
    await configManager.loadConfig()
    engines.value = configManager.getEngines()
  }

  const saveEnginesToConfig = async () => {
    await configManager.saveEngines(engines.value)
  }

  const addEngineDesktop = async () => {
    const selectedPath = await open({
      multiple: false,
      title: 'Select UCI Engine',
    })

    if (typeof selectedPath === 'string' && selectedPath) {
      const newId = `engine_${Date.now()}`
      editedEngine.value = {
        id: newId,
        name: `Engine ${engines.value.length + 1}`, // Default name
        path: selectedPath,
        args: '',
      }
      isEditing.value = false
      editDialog.value = true
    }
  }

  const addEngineAndroid = () => {
    const name = prompt(t('engineManager.promptEngineName'))
    if (!name) return
    if (engines.value.some((e: ManagedEngine) => e.name === name)) {
      alert(t('engineManager.nameExists'))
      return
    }

    const args = prompt(t('engineManager.promptEngineArgs'), '') ?? ''

    // Ask if the engine uses NNUE files
    const hasNnue =
      prompt(t('engineManager.promptHasNnue'), 'n')?.toLowerCase() === 'y'

    // Store the engine data for when the file is selected
    const engineData = { name, args, hasNnue }

    // Use the JavaScript interface approach that the Android MainActivity expects
    if (typeof window !== 'undefined' && (window as any).SafFileInterface) {
      // Call the JavaScript interface directly
      ;(window as any).SafFileInterface.startFileSelection()

      // Listen for the result
      const handleSafResult = (event: Event) => {
        const customEvent = event as CustomEvent
        const { filename, result } = customEvent.detail

        if (
          result &&
          result !== 'File selection cancelled' &&
          result !== 'No URI returned' &&
          result !== 'No data returned'
        ) {
          // Success - the file was copied to internal storage
          // Now we need to call the Rust backend to handle the SAF file result
          console.log('[DEBUG] Calling handle_saf_file_result with:', {
            tempFilePath: result,
            filename: filename,
            name: engineData.name,
            args: engineData.args,
            hasNnue: engineData.hasNnue,
          })

          invoke('handle_saf_file_result', {
            tempFilePath: result,
            filename: filename,
            name: engineData.name,
            args: engineData.args,
            hasNnue: engineData.hasNnue,
          }).catch(err => {
            console.error('Failed to handle SAF file result:', err)
            alert(t('errors.failedToProcessEngine') + ': ' + err)
          })
        } else {
          // User cancelled or there was an error
          console.log('SAF file selection cancelled or failed:', result)
        }

        // Remove the event listener
        window.removeEventListener('saf-file-result', handleSafResult)
      }

      window.addEventListener('saf-file-result', handleSafResult)
    } else {
      // Fallback to the Tauri invoke approach
      invoke('request_saf_file_selection', { name, args, hasNnue }).catch(
        err => {
          console.error('SAF request failed:', err)
          alert(t('errors.failedToOpenFileSelector'))
        }
      )
    }
  }

  const editEngine = (engine: ManagedEngine) => {
    isEditing.value = true
    editedEngine.value = { ...engine }
    editDialog.value = true
  }

  const openUciOptionsEditor = async (engine: ManagedEngine) => {
    await configManager.loadConfig()
    selectedEngineForOptions.value = engine
    const saved = configManager.getUciOptions(engine.id)
    uciRows.value = Object.entries(saved).map(([key, value]) => {
      let type: RowType = 'string'
      if (typeof value === 'boolean') type = 'boolean'
      else if (typeof value === 'number') type = 'number'
      else if (value === '__button__') type = 'button'
      return { key, value, type }
    })
    uciDialogVisible.value = true
  }

  const addUciRow = () => {
    uciRows.value.push({
      key: '',
      value: '',
      type: 'string',
      vars: [],
      varsCsv: '',
    })
  }

  const removeUciRow = (index: number) => {
    uciRows.value.splice(index, 1)
  }

  const closeUciDialog = () => {
    uciDialogVisible.value = false
    selectedEngineForOptions.value = null
    uciRows.value = []
  }

  const saveUciOptions = async () => {
    if (!selectedEngineForOptions.value) return
    const obj: Record<string, any> = {}
    for (const row of uciRows.value) {
      if (!row.key) continue
      let v: any = row.value
      if (row.type === 'number') {
        const n = Number(v)
        v = isNaN(n) ? 0 : n
      } else if (row.type === 'boolean') {
        v = Boolean(v)
      } else if (row.type === 'button') {
        // Sentinel value to indicate a button should be executed on load
        v = v ? '__button__' : undefined
        if (v === undefined) continue
      } else if (row.type === 'combo') {
        v = String(v ?? '')
      } else {
        v = String(v ?? '')
      }
      obj[row.key] = v
    }
    await configManager.updateUciOptions(selectedEngineForOptions.value.id, obj)
    closeUciDialog()
  }

  const onClearUciOptions = async () => {
    if (!selectedEngineForOptions.value) return
    if (confirm(t('uciOptions.confirmClearSettings'))) {
      await configManager.clearUciOptions(selectedEngineForOptions.value.id)
      uciRows.value = []
      alert(t('uciOptions.settingsCleared'))
    }
  }

  const toggleButtonFlag = (row: UciRow) => {
    row.value = !row.value
  }

  // --- UPDATED Deletion Flow ---
  const prepareToDeleteEngine = (engine: ManagedEngine) => {
    // 1. Store the engine to be deleted
    engineToDelete.value = engine
    // 2. Open the non-blocking confirmation dialog
    confirmDeleteDialog.value = true
  }

  const confirmDelete = () => {
    // 3. If the user confirms in the dialog, proceed with deletion
    if (!engineToDelete.value) return
    console.log(
      `[DEBUG] EngineManager: Deleting engine: ${engineToDelete.value.name}`
    )
    engines.value = engines.value.filter(e => e.id !== engineToDelete.value!.id)
    console.log(
      `[DEBUG] EngineManager: Engines remaining: ${engines.value.length}`
    )
    saveEnginesToConfig()
    // Clear last selected engine ID if the deleted engine was the last selected one
    const lastSelectedId = configManager.getLastSelectedEngineId()
    if (lastSelectedId === engineToDelete.value.id) {
      console.log(
        `[DEBUG] EngineManager: Deleted engine was the last selected one, clearing last selected engine ID`
      )
      configManager.clearLastSelectedEngineId()
    }
    // 4. Close the dialog
    cancelDelete()
  }

  const cancelDelete = () => {
    // 5. If the user cancels, just close the dialog and clear the state
    confirmDeleteDialog.value = false
    engineToDelete.value = null
  }
  // --- END of Deletion Flow ---

  const saveEngine = () => {
    if (isEditing.value) {
      const index = engines.value.findIndex(
        (e: ManagedEngine) => e.id === editedEngine.value.id
      )
      if (index > -1) {
        const oldEngine = engines.value[index]
        engines.value.splice(index, 1, { ...editedEngine.value })

        // Check if the engine name changed and clear last selected engine ID if needed
        if (oldEngine.name !== editedEngine.value.name) {
          console.log(
            `[DEBUG] EngineManager: Engine name changed from "${oldEngine.name}" to "${editedEngine.value.name}", clearing last selected engine ID`
          )
          configManager.clearLastSelectedEngineId()
        }
      }
    } else {
      if (
        engines.value.some(
          (e: ManagedEngine) => e.name === editedEngine.value.name
        )
      ) {
        alert(t('engineManager.nameExists'))
        return
      }
      engines.value.push({ ...editedEngine.value })
    }
    saveEnginesToConfig()
    closeEditDialog()
  }

  const closeDialog = () => {
    isVisible.value = false
  }

  const closeEditDialog = () => {
    editDialog.value = false
    editedEngine.value = { ...defaultEngine }
    isEditing.value = false
  }

  // Lifecycle Hooks
  onMounted(async () => {
    loadEnginesFromConfig()

    // Clear last selected engine ID if the engine list is empty
    if (engines.value.length === 0) {
      console.log(
        `[DEBUG] EngineManager: Engine list is empty on mount, clearing last selected engine ID`
      )
      configManager.clearLastSelectedEngineId()
    }

    if (isAndroidPlatform.value) {
      const { listen } = await import('@tauri-apps/api/event')
      unlistenAndroidAdd = listen('android-engine-added', event => {
        const payload = event.payload as ManagedEngine
        engines.value.push(payload)
        saveEnginesToConfig()
        alert(t('engineManager.engineAddedSuccess', { name: payload.name }))
      })

      // Listen for NNUE file requests
      unlistenNnueRequest = listen('request-nnue-file', event => {
        const payload = event.payload as any
        console.log('[DEBUG] Received NNUE file request:', payload)

        // Show prompt for NNUE file selection
        if (confirm(t('engineManager.promptNnueFile'))) {
          // Use the JavaScript interface approach for NNUE file selection
          if (
            typeof window !== 'undefined' &&
            (window as any).SafFileInterface
          ) {
            // Call the JavaScript interface directly
            ;(window as any).SafFileInterface.startFileSelection()

            // Listen for the NNUE file result
            const handleNnueSafResult = (event: Event) => {
              const customEvent = event as CustomEvent
              const { filename, result } = customEvent.detail

              if (
                result &&
                result !== 'File selection cancelled' &&
                result !== 'No URI returned' &&
                result !== 'No data returned'
              ) {
                // Success - the NNUE file was copied to internal storage
                console.log('[DEBUG] Calling handle_nnue_file_result with:', {
                  tempFilePath: result,
                  filename: filename,
                  engineName: payload.engine_name,
                  enginePath: payload.engine_path,
                  args: payload.args,
                  engineInstanceId: payload.engine_instance_id,
                })

                invoke('handle_nnue_file_result', {
                  tempFilePath: result,
                  filename: filename,
                  engineName: payload.engine_name,
                  enginePath: payload.engine_path,
                  args: payload.args,
                  engineInstanceId: payload.engine_instance_id,
                }).catch(err => {
                  console.error('Failed to handle NNUE SAF file result:', err)
                  alert(t('errors.failedToProcessEngine') + ': ' + err)
                })
              } else {
                // User cancelled or there was an error
                console.log(
                  'NNUE SAF file selection cancelled or failed:',
                  result
                )
                // Still add the engine without NNUE file
                const newEngineData = {
                  id: `engine_${Date.now()}`,
                  name: payload.engine_name,
                  path: payload.engine_path,
                  args: payload.args,
                }
                engines.value.push(newEngineData)
                saveEnginesToConfig()
                alert(
                  t('engineManager.engineAddedSuccess', {
                    name: payload.engine_name,
                  })
                )
              }

              // Remove the event listener
              window.removeEventListener('saf-file-result', handleNnueSafResult)
            }

            window.addEventListener('saf-file-result', handleNnueSafResult)
          } else {
            // Fallback - add engine without NNUE file
            const newEngineData = {
              id: `engine_${Date.now()}`,
              name: payload.engine_name,
              path: payload.engine_path,
              args: payload.args,
            }
            engines.value.push(newEngineData)
            saveEnginesToConfig()
            alert(
              t('engineManager.engineAddedSuccess', {
                name: payload.engine_name,
              })
            )
          }
        } else {
          // User cancelled NNUE file selection, add engine without NNUE
          const newEngineData = {
            id: `engine_${Date.now()}`,
            name: payload.engine_name,
            path: payload.engine_path,
            args: payload.args,
          }
          engines.value.push(newEngineData)
          saveEnginesToConfig()
          alert(
            t('engineManager.engineAddedSuccess', { name: payload.engine_name })
          )
        }
      })
    }
  })

  onUnmounted(async () => {
    if (unlistenAndroidAdd) {
      const unlisten = await unlistenAndroidAdd
      unlisten()
    }
    if (unlistenNnueRequest) {
      const unlisten = await unlistenNnueRequest
      unlisten()
    }
  })

  watch(isVisible, newValue => {
    if (newValue) {
      loadEnginesFromConfig()
      // Clear last selected engine ID if the engine list is empty
      if (engines.value.length === 0) {
        console.log(
          `[DEBUG] EngineManager: Engine list is empty when dialog opened, clearing last selected engine ID`
        )
        configManager.clearLastSelectedEngineId()
      }
    }
  })
</script>
