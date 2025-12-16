<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">
        <v-icon icon="mdi-information" class="mr-2"></v-icon>
        {{ $t('about.title') }}
      </v-card-title>

      <v-card-text>
        <div class="about-content">
          <div class="app-info">
            <h3>JieqiBox</h3>
            <p class="version">{{ $t('about.version') }} {{ version }}</p>
            <div class="mt-2">
              <v-btn
                size="small"
                variant="tonal"
                color="primary"
                :loading="checkingUpdate"
                @click="checkUpdate"
              >
                {{ $t('about.checkUpdate') }}
              </v-btn>
            </div>
            <p
              v-if="updateStatus"
              class="update-status mt-2"
              :class="updateStatusClass"
            >
              {{ updateStatus }}
            </p>
            <p class="description">
              {{ $t('about.description') }}
            </p>
          </div>

          <v-divider class="my-4"></v-divider>

          <div class="author-info">
            <h4>{{ $t('about.author') }}</h4>
            <p><strong>Velithia</strong></p>
          </div>

          <v-divider class="my-4"></v-divider>

          <div class="links">
            <h4>{{ $t('about.github') }}</h4>
            <div class="link-item">
              <v-icon icon="mdi-github" class="mr-2"></v-icon>
              <v-btn
                variant="text"
                color="primary"
                @click="
                  openExternalLink('https://github.com/Velithia/JieqiBox')
                "
                class="link-btn"
              >
                {{ $t('about.github') }}
              </v-btn>
            </div>
            <div class="link-item">
              <v-icon icon="mdi-download" class="mr-2"></v-icon>
              <v-btn
                variant="text"
                color="primary"
                @click="
                  openExternalLink(
                    'https://github.com/Velithia/JieqiBox/releases'
                  )
                "
                class="link-btn"
              >
                {{ $t('about.downloadLatest') }}
              </v-btn>
            </div>
          </div>

          <v-divider class="my-4"></v-divider>

          <div class="credits-info">
            <h4>{{ $t('about.credits') }}</h4>
            <p>{{ $t('about.piecesCredit') }}</p>
            <v-btn
              variant="text"
              color="primary"
              @click="
                openExternalLink(
                  'https://github.com/CouchTomato87/InternationalizedPieces'
                )
              "
              class="link-btn"
            >
              Internationalized Pieces
            </v-btn>
          </div>

          <v-divider class="my-4"></v-divider>

          <div class="license-info">
            <h4>{{ $t('about.license') }}</h4>
            <p>MIT License</p>
            <v-btn
              variant="text"
              color="primary"
              @click="openExternalLink('https://opensource.org/licenses/MIT')"
              class="link-btn"
            >
              {{ $t('about.viewLicense') }}
            </v-btn>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="dialog = false">
          {{ $t('common.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { invoke } from '@tauri-apps/api/core'
  import { listen } from '@tauri-apps/api/event'

  // Import version from package.json
  import packageJson from '../../package.json'

  // Dialog visibility state
  const dialog = ref(false)

  // Get version from package.json
  const version = packageJson.version

  const { t } = useI18n()

  // Update check state
  const checkingUpdate = ref(false)
  const updateStatus = ref('')
  const updateStatusClass = ref('')

  const compareVersions = (v1: string, v2: string) => {
    const p1 = v1.split('.').map(Number)
    const p2 = v2.split('.').map(Number)
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const n1 = p1[i] || 0
      const n2 = p2[i] || 0
      if (n1 > n2) return 1
      if (n1 < n2) return -1
    }
    return 0
  }

  const checkUpdate = async () => {
    checkingUpdate.value = true
    updateStatus.value = t('about.checkingUpdate')
    updateStatusClass.value = 'status-info'

    try {
      const response = await fetch(
        `https://cdn.jsdelivr.net/gh/Velithia/JieqiBox/?t=${Date.now()}`,
        { cache: 'no-store' }
      )
      const text = await response.text()
      const match = text.match(/Velithia\/JieqiBox@(\d+\.\d+\.\d+)/)

      if (match) {
        const latestVersion = match[1]
        if (compareVersions(latestVersion, version) > 0) {
          updateStatus.value = t('about.updateAvailable', {
            version: latestVersion,
          })
          updateStatusClass.value = 'status-success'
        } else {
          updateStatus.value = t('about.upToDate')
          updateStatusClass.value = 'status-success'
        }
      } else {
        updateStatus.value = t('about.updateError')
        updateStatusClass.value = 'status-error'
      }
    } catch (error) {
      console.error('Update check failed:', error)
      updateStatus.value = t('about.updateError')
      updateStatusClass.value = 'status-error'
    } finally {
      checkingUpdate.value = false
    }
  }

  // Method to open the dialog
  const openDialog = () => {
    dialog.value = true
  }

  // Method to open an external link using Tauri's API
  const openExternalLink = async (url: string) => {
    try {
      // Check if running on Android platform
      if (window.ExternalUrlInterface) {
        // Use Android JavaScript interface to open external browser
        window.ExternalUrlInterface.openExternalUrl(url)
      } else {
        // Use Tauri's API for other platforms
        await invoke('open_external_url', { url })
      }
    } catch (error) {
      console.error('Failed to open external link:', error)
    }
  }

  // Event listener for Android external URL opening
  let unlistenExternalUrl: (() => void) | null = null

  onMounted(async () => {
    try {
      // Listen for external URL events from Tauri (Android platform)
      unlistenExternalUrl = await listen('open-external-url', event => {
        const url = event.payload as string
        if (window.ExternalUrlInterface) {
          window.ExternalUrlInterface.openExternalUrl(url)
        }
      })
    } catch (error) {
      console.error('Failed to set up external URL listener:', error)
    }
  })

  onUnmounted(() => {
    // Clean up event listener
    if (unlistenExternalUrl) {
      unlistenExternalUrl()
    }
  })

  // Expose the openDialog method to the parent component
  defineExpose({
    openDialog,
  })
</script>

<style lang="scss" scoped>
  .about-content {
    .app-info {
      text-align: center;
      margin-bottom: 16px;

      h3 {
        color: #1976d2;
        margin-bottom: 8px;
        font-size: 1.5rem;
      }

      .version {
        color: #666;
        font-size: 0.9rem;
        margin: 0 0 8px 0;
        font-weight: 500;
      }

      .update-status {
        font-size: 0.9rem;
        font-weight: 500;
        &.status-success {
          color: #4caf50;
        }
        &.status-error {
          color: #f44336;
        }
        &.status-info {
          color: #2196f3;
        }
      }

      .description {
        color: #666;
        line-height: 1.5;
        margin: 0;
      }
    }

    h4 {
      color: #333;
      margin-bottom: 8px;
      font-size: 1.1rem;
    }

    .author-info {
      p {
        margin: 0;
        font-size: 1rem;
      }
    }

    .links {
      .link-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;

        .link-btn {
          text-transform: none;
          font-weight: 500;
          padding: 0;
          min-width: auto;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    .credits-info {
      p {
        margin: 0 0 8px 0;
        font-weight: 500;
      }

      .link-btn {
        text-transform: none;
        font-weight: 500;
        padding: 0;
        min-width: auto;
        font-size: 0.9rem;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .license-info {
      p {
        margin: 0 0 8px 0;
        font-weight: 500;
      }

      .link-btn {
        text-transform: none;
        font-weight: 500;
        padding: 0;
        min-width: auto;
        font-size: 0.9rem;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
</style>
