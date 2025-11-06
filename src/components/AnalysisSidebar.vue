<template>
  <div class="sidebar">
    <!-- Engine Management Section -->
    <div class="engine-management">
      <v-select
        v-model="selectedEngineId"
        :items="managedEngines"
        item-title="name"
        item-value="id"
        :label="$t('analysis.selectEngine')"
        density="compact"
        hide-details
        class="engine-select"
        variant="outlined"
      ></v-select>
      <v-btn
        @click="loadSelectedEngine"
        :loading="
          isMatchMode ? jaiEngine?.isEngineLoading?.value : isEngineLoading
        "
        :disabled="
          (isMatchMode ? jaiEngine?.isEngineLoading?.value : isEngineLoading) ||
          !selectedEngineId ||
          (isMatchMode ? jaiEngine?.isEngineLoaded?.value : isEngineLoaded)
        "
        :color="
          (isMatchMode ? jaiEngine?.isEngineLoaded?.value : isEngineLoaded)
            ? 'success'
            : 'teal'
        "
        size="x-small"
        class="action-btn"
        icon="mdi-play-circle"
        :title="$t('analysis.loadEngine')"
      >
      </v-btn>
      <v-btn
        @click="handleUnloadEngine"
        :disabled="
          !(isMatchMode ? jaiEngine?.isEngineLoaded?.value : isEngineLoaded)
        "
        color="error"
        size="x-small"
        class="action-btn"
        icon="mdi-stop-circle"
        :title="$t('analysis.unloadEngine')"
      >
      </v-btn>
      <v-btn
        @click="showEngineManager = true"
        color="blue-grey"
        size="x-small"
        class="action-btn"
        icon="mdi-cogs"
        :title="$t('analysis.manageEngines')"
      >
      </v-btn>
    </div>

    <!-- Analysis control and execution button group -->
    <div v-if="!isMatchMode && !isHumanVsAiMode" class="button-group">
      <v-btn
        @click="handleAnalysisButtonClick"
        :disabled="!isEngineLoaded"
        :color="isThinking || isPondering ? 'warning' : 'deep-purple'"
        class="grouped-btn"
        size="small"
      >
        {{
          isThinking || isPondering
            ? $t('analysis.stopAnalysis')
            : $t('analysis.startAnalysis')
        }}
      </v-btn>
    </div>

    <!-- Match mode button groups -->
    <div v-if="isMatchMode" class="match-mode-buttons">
      <!-- First row: Exit match mode | Start match -->
      <div class="button-group">
        <v-btn
          @click="toggleMatchMode"
          color="success"
          class="grouped-btn"
          size="small"
        >
          {{ $t('analysis.exitMatchMode') }}
        </v-btn>

        <v-btn
          @click="handleMatchButtonClick"
          :disabled="!jaiEngine?.isEngineLoaded?.value"
          :color="jaiEngine?.isMatchRunning?.value ? 'warning' : 'green'"
          class="grouped-btn"
          size="small"
        >
          {{
            jaiEngine?.isMatchRunning?.value
              ? $t('analysis.stopMatch')
              : $t('analysis.startMatch')
          }}
        </v-btn>
      </div>

      <!-- Second row: Settings | ELO Calculator -->
      <div class="button-group">
        <v-btn
          @click="showJaiOptionsDialog = true"
          :disabled="!jaiEngine?.isEngineLoaded?.value"
          color="purple"
          size="small"
          class="grouped-btn"
          prepend-icon="mdi-cogs"
        >
          {{ $t('analysis.jaiSettings') }}
        </v-btn>

        <v-btn
          @click="showEloCalculatorDialog = true"
          color="orange"
          size="small"
          class="grouped-btn"
          prepend-icon="mdi-calculator"
        >
          {{ $t('analysis.eloCalculator') }}
        </v-btn>
      </div>
    </div>

    <!-- Exit human vs AI mode button (when in human vs AI mode) -->
    <div v-else-if="isHumanVsAiMode" class="button-group">
      <v-btn
        @click="exitHumanVsAiMode"
        color="teal"
        class="grouped-btn"
        size="small"
      >
        {{ $t('analysis.exitHumanVsAiMode') }}
      </v-btn>
    </div>

    <!-- Enter match mode and human vs AI mode buttons (when not in any special mode) -->
    <div v-else class="button-group">
      <v-btn
        @click="toggleMatchMode"
        color="amber"
        class="grouped-btn"
        size="small"
      >
        {{ $t('analysis.enterMatchMode') }}
      </v-btn>
      <v-btn
        @click="showHumanVsAiDialog = true"
        color="teal"
        class="grouped-btn"
        size="small"
      >
        {{ $t('analysis.enterHumanVsAiMode') }}
      </v-btn>
    </div>

    <!-- Undo move and flip board button group -->
    <div class="button-group">
      <v-btn
        @click="handleUndoMove"
        :disabled="currentMoveIndex <= 0 || isMatchRunning"
        color="error"
        class="grouped-btn"
        size="small"
      >
        {{ $t('analysis.undoMove') }}
      </v-btn>
      <v-btn
        @click="toggleBoardFlip()"
        color="cyan"
        class="grouped-btn"
        size="small"
      >
        {{
          isBoardFlipped
            ? $t('analysis.flipBoardBack')
            : $t('analysis.flipBoard')
        }}
      </v-btn>
    </div>

    <!-- AI auto-play settings - Disabled when engine is not loaded or during manual analysis -->
    <div v-if="!isMatchMode && !isHumanVsAiMode" class="autoplay-settings">
      <v-btn
        @click="toggleRedAi"
        :color="isRedAi ? 'error' : 'blue-grey-darken-1'"
        class="half-btn"
        size="small"
        :disabled="isManualAnalysis || !isEngineLoaded"
      >
        {{ isRedAi ? $t('analysis.redAiOn') : $t('analysis.redAiOff') }}
      </v-btn>
      <v-btn
        @click="toggleBlackAi"
        :color="isBlackAi ? 'error' : 'blue-grey-darken-1'"
        class="half-btn"
        size="small"
        :disabled="isManualAnalysis || !isEngineLoaded"
      >
        {{ isBlackAi ? $t('analysis.blackAiOn') : $t('analysis.blackAiOff') }}
      </v-btn>
    </div>

    <!-- Panel Layout Control -->
    <div class="button-group">
      <v-btn
        @click="restoreDefaultLayout"
        color="grey"
        class="grouped-btn"
        size="small"
        prepend-icon="mdi-backup-restore"
      >
        {{ $t('analysis.restorePanels') }}
      </v-btn>
    </div>

    <div v-if="!isMatchMode && !isHumanVsAiMode" class="switch-row">
      <v-switch
        v-model="flipMode"
        :label="$t('analysis.freeFlipMode')"
        color="amber"
        true-value="free"
        false-value="random"
        hide-details
        class="compact-switch"
        density="compact"
      />

      <v-switch
        v-model="enablePonder"
        :label="$t('analysis.ponderMode')"
        color="lime"
        hide-details
        class="compact-switch"
        density="compact"
      />
    </div>

    <DraggablePanel v-if="shouldShowLuckIndex" panel-id="luck-index">
      <template #header>
        <h3 class="section-title">{{ $t('analysis.luckIndex') }}</h3>
      </template>
      <div class="luck-index-panel">
        <div class="luck-description">
          {{ $t('analysis.luckIndexBasedOnFlipSequence') }}
        </div>
        <div class="luck-row">
          <span class="label">{{ $t('analysis.currentValue') }}</span>
          <span class="luck-value" :class="luckClass">{{ luckIndex }}</span>
        </div>
        <div class="luck-axis">
          <div class="axis-track"></div>
          <div
            class="axis-tick"
            v-for="tick in axisTicks"
            :key="tick.pos"
            :style="{ left: tick.pos + '%' }"
          >
            <span class="tick-label">{{ tick.label }}</span>
          </div>
          <div class="axis-zero" :style="{ left: '50%' }"></div>
          <div class="axis-marker" :class="luckClass" :style="markerStyle">
            <span class="marker-value">{{ luckIndex }}</span>
          </div>
        </div>
        <div class="luck-legend">
          <span>{{ $t('analysis.blackFavor') }}</span>
          <span>{{ $t('analysis.redFavor') }}</span>
        </div>
      </div>
    </DraggablePanel>

    <CaptureHistoryPanel v-if="isHumanVsAiMode" />

    <DraggablePanel v-if="!isHumanVsAiMode" panel-id="dark-piece-pool">
      <template #header>
        <h3 class="section-title">
          {{ $t('analysis.darkPiecePool') }}
          <v-chip
            size="x-small"
            :color="validationStatusKey === 'normal' ? 'green' : 'red'"
            variant="flat"
          >
            {{ validationStatusMessage }}
          </v-chip>
        </h3>
      </template>
      <div class="pool-manager">
        <div
          v-for="item in unrevealedPiecesForDisplay"
          :key="item.char"
          class="pool-item"
        >
          <img
            :src="getPieceImageUrl(item.name)"
            :alt="item.name"
            class="pool-piece-img"
          />
          <div class="pool-controls">
            <div class="control-group">
              <v-btn
                density="compact"
                icon="mdi-plus"
                size="x-small"
                @click="adjustUnrevealedCount(item.char, 1)"
                :disabled="item.count >= item.max"
              />
              <v-btn
                density="compact"
                icon="mdi-minus"
                size="x-small"
                @click="adjustUnrevealedCount(item.char, -1)"
                :disabled="item.count <= 0"
              />
            </div>
            <span class="pool-count"
              >{{ item.count }}({{ item.capturedCount }})</span
            >
            <div class="control-group">
              <v-btn
                density="compact"
                icon="mdi-plus"
                size="x-small"
                @click="adjustCapturedUnrevealedCount(item.char, 1)"
                :disabled="item.count <= 0"
              />
              <v-btn
                density="compact"
                icon="mdi-minus"
                size="x-small"
                @click="adjustCapturedUnrevealedCount(item.char, -1)"
                :disabled="item.capturedCount <= 0"
              />
            </div>
          </div>
        </div>
      </div>
    </DraggablePanel>

    <DraggablePanel
      v-if="!isHumanVsAiMode || showEngineAnalysis"
      panel-id="engine-analysis"
    >
      <template #header>
        <h3>
          {{
            isMatchMode
              ? $t('analysis.matchInfo')
              : $t('analysis.engineAnalysis')
          }}
        </h3>
      </template>

      <!-- Match Mode Display -->
      <div v-if="isMatchMode" class="match-output">
        <div v-if="jaiEngine?.isEngineLoaded?.value" class="match-info">
          <div class="match-status">
            <div class="status-line">
              <span class="label">{{ $t('analysis.matchStatus') }}:</span>
              <span class="value">{{
                jaiEngine?.isMatchRunning?.value
                  ? $t('analysis.running')
                  : $t('analysis.stopped')
              }}</span>
            </div>
            <div v-if="jaiEngine?.currentGame?.value > 0" class="status-line">
              <span class="label">{{ $t('analysis.gameProgress') }}:</span>
              <span class="value"
                >{{ jaiEngine.currentGame.value }} /
                {{ jaiEngine.totalGames.value }}</span
              >
            </div>
            <div v-if="jaiEngine?.matchEngineInfo?.value" class="status-line">
              <span class="label">{{ $t('analysis.engineInfo') }}:</span>
              <span class="value">{{ jaiEngine.matchEngineInfo.value }}</span>
            </div>
            <div v-if="jaiEngine?.matchResult?.value" class="status-line">
              <span class="label">{{ $t('analysis.lastResult') }}:</span>
              <span class="value">{{ jaiEngine.matchResult.value }}</span>
            </div>
            <div
              v-if="
                jaiEngine?.matchWins?.value > 0 ||
                jaiEngine?.matchLosses?.value > 0 ||
                jaiEngine?.matchDraws?.value > 0
              "
              class="status-line"
            >
              <span class="label">{{ $t('analysis.matchWld') }}:</span>
              <span class="value"
                >{{ jaiEngine.matchWins.value }}-{{
                  jaiEngine.matchLosses.value
                }}-{{ jaiEngine.matchDraws.value }}</span
              >
            </div>
            <div v-if="matchEloDisplay" class="status-line">
              <span class="label">{{ $t('analysis.eloRating') }}:</span>
              <span class="value">{{ matchEloDisplay }}</span>
            </div>

            <div
              v-if="
                jaiEngine?.redEngine?.value || jaiEngine?.blackEngine?.value
              "
              class="status-line"
            >
              <span class="label">{{ $t('analysis.matchEngines') }}:</span>
              <span class="value"
                >{{ jaiEngine.redEngine.value || '?' }} vs
                {{ jaiEngine.blackEngine.value || '?' }}</span
              >
            </div>
          </div>

          <!-- Show analysis info from UCI engine transparently passed through -->
          <div v-if="jaiEngine?.analysisInfo?.value" class="analysis-info">
            <div class="info-header">{{ $t('analysis.engineAnalysis') }}</div>
            <div
              class="analysis-line"
              v-html="parseJaiAnalysisInfo(jaiEngine.analysisInfo.value)"
            ></div>
          </div>
        </div>
        <div v-else class="no-match-info">
          {{ $t('analysis.noMatchEngine') }}
        </div>
      </div>

      <!-- Regular UCI Analysis Mode Display -->
      <div v-else class="analysis-output">
        <div
          v-for="(ln, idx) in parsedAnalysisLines"
          :key="`an-${idx}`"
          v-html="ln"
        ></div>
      </div>
    </DraggablePanel>

    <!-- Opening Book Panel -->
    <DraggablePanel v-if="showOpeningBookPanel" panel-id="opening-book">
      <template #header>
        <h3>{{ $t('openingBook.title') }}</h3>
      </template>
      <OpeningBookPanel
        :show-panel="true"
        @open-detail-dialog="showOpeningBookDetail = true"
        @play-move="handleOpeningBookMove"
      />
    </DraggablePanel>

    <DraggablePanel panel-id="notation">
      <template #header>
        <div class="notation-header">
          <h3>{{ $t('analysis.notation') }}</h3>
          <div class="notation-controls">
            <v-btn
              @click="goToFirstMove"
              :disabled="currentMoveIndex <= 0 || isMatchRunning"
              icon="mdi-skip-backward"
              size="x-small"
              color="primary"
              variant="text"
              :title="$t('analysis.goToFirst')"
            />
            <v-btn
              @click="goToPreviousMove"
              :disabled="currentMoveIndex <= 0 || isMatchRunning"
              icon="mdi-step-backward"
              size="x-small"
              color="primary"
              variant="text"
              :title="$t('analysis.goToPrevious')"
            />
            <v-btn
              @click="togglePlayPause"
              :color="isPlaying ? 'warning' : 'success'"
              :icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
              size="x-small"
              variant="text"
              :disabled="isMatchRunning"
              :title="isPlaying ? $t('analysis.pause') : $t('analysis.play')"
            />
            <v-btn
              @click="goToNextMove"
              :disabled="currentMoveIndex >= history.length || isMatchRunning"
              icon="mdi-step-forward"
              size="x-small"
              color="primary"
              variant="text"
              :title="$t('analysis.goToNext')"
            />
            <v-btn
              @click="goToLastMove"
              :disabled="currentMoveIndex >= history.length || isMatchRunning"
              icon="mdi-skip-forward"
              size="x-small"
              color="primary"
              variant="text"
              :title="$t('analysis.goToLast')"
            />
            <!-- Annotation quick buttons for current move (apply to last move index) -->
            <v-menu location="bottom" :close-on-content-click="true">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="x-small"
                  color="indigo"
                  variant="text"
                  icon="mdi-star-circle"
                  :title="$t('analysis.annotateMove')"
                />
              </template>
              <v-list density="compact">
                <v-list-item @click="setAnnotation('!!')"
                  ><v-list-item-title
                    >!! {{ $t('analysis.brilliant') }}</v-list-item-title
                  ></v-list-item
                >
                <v-list-item @click="setAnnotation('!')"
                  ><v-list-item-title
                    >! {{ $t('analysis.good') }}</v-list-item-title
                  ></v-list-item
                >
                <v-list-item @click="setAnnotation('!?')"
                  ><v-list-item-title
                    >!? {{ $t('analysis.interesting') }}</v-list-item-title
                  ></v-list-item
                >
                <v-list-item @click="setAnnotation('?!')"
                  ><v-list-item-title
                    >?! {{ $t('analysis.dubious') }}</v-list-item-title
                  ></v-list-item
                >
                <v-list-item @click="setAnnotation('?')"
                  ><v-list-item-title
                    >? {{ $t('analysis.mistake') }}</v-list-item-title
                  ></v-list-item
                >
                <v-list-item @click="setAnnotation('??')"
                  ><v-list-item-title
                    >?? {{ $t('analysis.blunder') }}</v-list-item-title
                  ></v-list-item
                >
                <v-list-item @click="setAnnotation(undefined)"
                  ><v-list-item-title>{{
                    $t('analysis.clear')
                  }}</v-list-item-title></v-list-item
                >
              </v-list>
            </v-menu>
          </div>
        </div>
      </template>
      <div
        class="move-list"
        ref="moveListElement"
        :class="{ 'disabled-clicks': isMatchRunning }"
      >
        <div
          class="move-item"
          :class="{ 'current-move': currentMoveIndex === 0 }"
          @click="handleMoveClick(0)"
        >
          <span class="move-number">{{ $t('analysis.opening') }}</span>
        </div>
        <div
          v-for="(entry, idx) in history"
          :key="idx"
          class="move-item"
          :class="{ 'current-move': currentMoveIndex === idx + 1 }"
          @click="handleMoveClick(idx + 1)"
        >
          <template v-if="entry.type === 'move'">
            <span class="move-number">{{ getMoveNumber(idx) }}</span>
            <span class="move-uci">{{
              isHumanVsAiMode ? entry.data.slice(0, 4) : entry.data
            }}</span>
            <span
              v-if="entry.annotation"
              class="move-annot"
              :class="annotationClass(entry.annotation)"
              >{{ entry.annotation }}</span
            >
            <span v-if="showChineseNotation" class="move-chinese">
              {{ getChineseNotationForMove(idx) }}
            </span>
            <div
              v-if="
                !isHumanVsAiMode &&
                (entry.engineScore !== undefined ||
                  entry.engineTime !== undefined)
              "
              class="engine-analysis"
            >
              <span
                v-if="entry.engineScore !== undefined"
                class="engine-score"
                :class="getScoreClass(entry.engineScore)"
              >
                {{ formatScore(entry.engineScore) }}
              </span>
              <span v-if="entry.engineTime !== undefined" class="engine-time">
                {{ formatTime(entry.engineTime) }}
              </span>
            </div>
          </template>
          <template v-else-if="entry.type === 'adjust'">
            <span class="move-adjust"
              >{{ $t('analysis.adjustment') }}: {{ entry.data }}</span
            >
          </template>
        </div>
      </div>
    </DraggablePanel>

    <DraggablePanel panel-id="move-comments">
      <template #header>
        <h3>{{ $t('analysis.moveComments') }}</h3>
      </template>
      <div class="comments-list" ref="commentsListElement">
        <div
          class="comment-item"
          :class="{ 'current-comment': currentMoveIndex === 0 }"
        >
          <div class="comment-header">
            <span class="comment-number">{{ $t('analysis.opening') }}</span>
            <v-btn
              density="compact"
              icon="mdi-pencil"
              size="x-small"
              @click="editComment(0)"
              color="primary"
              variant="text"
            />
          </div>
          <div v-if="editingCommentIndex === 0" class="comment-edit">
            <div class="comment-toolbar">
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-format-bold"
                @click="surroundSelection(0, '**', '**')"
              />
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-format-italic"
                @click="surroundSelection(0, '*', '*')"
              />
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-format-underline"
                @click="surroundSelection(0, '<u>', '</u>')"
              />
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-format-strikethrough"
                @click="surroundSelection(0, '~~', '~~')"
              />
              <v-btn size="x-small" variant="text" @click="applyHeading(0, 1)"
                >H1</v-btn
              >
              <v-btn size="x-small" variant="text" @click="applyHeading(0, 2)"
                >H2</v-btn
              >
              <v-btn size="x-small" variant="text" @click="applyHeading(0, 3)"
                >H3</v-btn
              >
              <v-btn size="x-small" variant="text" @click="applyHeading(0, 4)"
                >H4</v-btn
              >
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-link-variant"
                @click="insertLink(0)"
              />
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-format-clear"
                @click="clearFormatting(0)"
              />
            </div>
            <v-textarea
              :ref="el => setCommentTextareaRef(0, el)"
              v-model="editingCommentText"
              auto-grow
              rows="2"
              density="compact"
              hide-details
              :placeholder="$t('analysis.enterComment')"
              @keyup.enter.ctrl.exact="saveComment"
              @keyup.esc="cancelEdit"
            />
            <div class="comment-edit-buttons">
              <v-btn size="x-small" @click="saveComment" color="success">{{
                $t('analysis.saveComment')
              }}</v-btn>
              <v-btn size="x-small" @click="cancelEdit" color="error">{{
                $t('analysis.cancelComment')
              }}</v-btn>
            </div>
          </div>
          <div
            v-else
            class="comment-text"
            v-html="getCommentHtmlWithFallback(0)"
          ></div>
        </div>
        <div
          v-for="(_, idx) in history"
          :key="`comment-${idx}`"
          class="comment-item"
          :class="{ 'current-comment': currentMoveIndex === idx + 1 }"
        >
          <div class="comment-header">
            <span class="comment-number">{{ getMoveNumber(idx) }}</span>
            <v-btn
              density="compact"
              icon="mdi-pencil"
              size="x-small"
              @click="editComment(idx + 1)"
              color="primary"
              variant="text"
            />
          </div>
          <div v-if="editingCommentIndex === idx + 1" class="comment-edit">
            <div class="comment-toolbar">
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-format-bold"
                @click="surroundSelection(idx + 1, '**', '**')"
              />
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-format-italic"
                @click="surroundSelection(idx + 1, '*', '*')"
              />
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-format-underline"
                @click="surroundSelection(idx + 1, '<u>', '</u>')"
              />
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-format-strikethrough"
                @click="surroundSelection(idx + 1, '~~', '~~')"
              />
              <v-btn
                size="x-small"
                variant="text"
                @click="applyHeading(idx + 1, 1)"
                >H1</v-btn
              >
              <v-btn
                size="x-small"
                variant="text"
                @click="applyHeading(idx + 1, 2)"
                >H2</v-btn
              >
              <v-btn
                size="x-small"
                variant="text"
                @click="applyHeading(idx + 1, 3)"
                >H3</v-btn
              >
              <v-btn
                size="x-small"
                variant="text"
                @click="applyHeading(idx + 1, 4)"
                >H4</v-btn
              >
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-link-variant"
                @click="insertLink(idx + 1)"
              />
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-format-clear"
                @click="clearFormatting(idx + 1)"
              />
            </div>
            <v-textarea
              :ref="el => setCommentTextareaRef(idx + 1, el)"
              v-model="editingCommentText"
              auto-grow
              rows="2"
              density="compact"
              hide-details
              :placeholder="$t('analysis.enterComment')"
              @keyup.enter.ctrl.exact="saveComment"
              @keyup.esc="cancelEdit"
            />
            <div class="comment-edit-buttons">
              <v-btn size="x-small" @click="saveComment" color="success">{{
                $t('analysis.saveComment')
              }}</v-btn>
              <v-btn size="x-small" @click="cancelEdit" color="error">{{
                $t('analysis.cancelComment')
              }}</v-btn>
            </div>
          </div>
          <div
            v-else
            class="comment-text"
            v-html="getCommentHtmlWithFallback(idx + 1)"
          ></div>
        </div>
      </div>
    </DraggablePanel>

    <DraggablePanel panel-id="engine-log">
      <template #header>
        <h3>{{ $t('analysis.engineLog') }}</h3>
      </template>
      <div class="engine-log" ref="engineLogElement">
        <div
          v-for="(ln, Idx) in currentEngineOutput"
          :key="Idx"
          :class="ln.kind === 'sent' ? 'line-sent' : 'line-recv'"
        >
          {{ ln.text }}
        </div>
      </div>
    </DraggablePanel>

    <!-- UCI Terminal Button -->
    <div class="uci-terminal-section">
      <v-btn
        @click="showUciTerminalDialog = true"
        :disabled="!isEngineLoaded"
        color="purple"
        variant="outlined"
        class="full-btn"
        size="small"
        prepend-icon="mdi-console"
      >
        {{ $t('analysis.uciTerminal') }}
      </v-btn>
    </div>

    <div class="about-section">
      <v-btn
        @click="openAboutDialog"
        color="info"
        variant="outlined"
        class="full-btn"
        size="small"
        prepend-icon="mdi-information"
      >
        {{ $t('analysis.about') }}
      </v-btn>
    </div>

    <AboutDialog ref="aboutDialogRef" />
    <EngineManagerDialog v-model="showEngineManager" />
    <UciTerminalDialog v-model="showUciTerminalDialog" />
    <JaiOptionsDialog
      v-if="isMatchMode"
      v-model="showJaiOptionsDialog"
      :engine-id="currentJaiEngineId"
    />
    <EloCalculatorDialog
      v-model="showEloCalculatorDialog"
      :initial-wins="jaiEngine?.matchWins?.value || 0"
      :initial-losses="jaiEngine?.matchLosses?.value || 0"
      :initial-draws="jaiEngine?.matchDraws?.value || 0"
    />
    <HumanVsAiModeDialog
      v-model="showHumanVsAiDialog"
      @confirm="handleHumanVsAiModeConfirm"
    />
    <OpeningBookDialog v-model="showOpeningBookDetail" />
  </div>
</template>

<script setup lang="ts">
  import {
    computed,
    inject,
    ref,
    watch,
    nextTick,
    onMounted,
    onUnmounted,
  } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { HistoryEntry } from '@/composables/useChessGame'
  import { useInterfaceSettings } from '@/composables/useInterfaceSettings'
  import { uciToChineseMoves } from '@/utils/chineseNotation'
  import { useGameSettings } from '@/composables/useGameSettings'
  import { useHumanVsAiSettings } from '@/composables/useHumanVsAiSettings'
  import AboutDialog from './AboutDialog.vue'
  // Import Engine Manager components and types
  import EngineManagerDialog from './EngineManagerDialog.vue'
  import UciTerminalDialog from './UciTerminalDialog.vue'
  import JaiOptionsDialog from './JaiOptionsDialog.vue'
  import EloCalculatorDialog from './EloCalculatorDialog.vue'
  import HumanVsAiModeDialog from './HumanVsAiModeDialog.vue'
  import CaptureHistoryPanel from './CaptureHistoryPanel.vue'
  import OpeningBookPanel from './OpeningBookPanel.vue'
  import OpeningBookDialog from './OpeningBookDialog.vue'
  import {
    useConfigManager,
    type ManagedEngine,
  } from '@/composables/useConfigManager'
  import DraggablePanel from './DraggablePanel.vue'
  import { usePanelManager } from '@/composables/usePanelManager'
  import {
    calculateEloRating,
    formatEloRating,
    formatErrorMargin,
  } from '@/utils/eloCalculator'
  import { marked } from 'marked'
  import DOMPurify from 'dompurify'
  import {
    START_FEN,
    JIEQI_MODEL_FEATURE_DIM as FEATURE_DIM,
    JIEQI_MODEL_INTERCEPT as MODEL_INTERCEPT,
    JIEQI_MODEL_WEIGHTS as MODEL_WEIGHTS,
    JIEQI_MODEL_SCALER_MEANS as SCALER_MEANS,
    JIEQI_MODEL_SCALER_SCALES as SCALER_SCALES,
    JIEQI_MODEL_PIECE_TO_INDEX as PIECE_TO_INDEX,
  } from '@/utils/constants'

  const { t } = useI18n()

  const { restoreDefaultLayout } = usePanelManager()

  // Get interface settings
  const {
    parseUciInfo,
    engineLogLineLimit,
    showChineseNotation,
    showLuckIndex,
    showBookMoves,
    useNewFenFormat,
  } = useInterfaceSettings()

  // Get persistent game settings
  const { enablePonder } = useGameSettings()

  // Get human vs AI settings
  const { isHumanVsAiMode, showEngineAnalysis } = useHumanVsAiSettings()

  /* ---------- Injected State ---------- */
  const gameState = inject('game-state') as any
  const {
    history,
    currentMoveIndex,
    replayToMove,
    playMoveFromUci,
    flipMode,
    unrevealedPieceCounts,
    capturedUnrevealedPieceCounts,
    validationStatus,
    adjustUnrevealedCount,
    adjustCapturedUnrevealedCount,
    getPieceNameFromChar,
    sideToMove,
    pendingFlip,
    toggleBoardFlip,
    isBoardFlipped,
    initialFen,
    undoLastMove,
    updateMoveAnnotation,
  } = gameState

  const engineState = inject('engine-state') as any
  const {
    engineOutput,
    isEngineLoaded,
    isEngineLoading,
    analysis,
    bestMove,
    isThinking,
    isStopping,
    loadEngine,
    unloadEngine,
    startAnalysis,
    stopAnalysis,
    currentSearchMoves,
    // Ponder related states
    isPondering,
    isInfinitePondering,
    ponderMove,
    ponderhit,
    handlePonderHit,
    stopPonder,
    isPonderMoveMatch,
    // Helper functions
    isDarkPieceMove,
    // Chinese notation setting
    setShowChineseNotation,
  } = engineState

  // Inject JAI engine state
  const jaiEngine = inject('jai-engine-state') as any

  /* ---------- Engine Management State ---------- */
  const configManager = useConfigManager()
  const showEngineManager = ref(false)
  const showHumanVsAiDialog = ref(false)
  const managedEngines = ref<ManagedEngine[]>([])
  const selectedEngineId = ref<string | null>(null)

  /* ---------- Opening Book State ---------- */
  const showOpeningBookPanel = computed(() => showBookMoves.value !== false)
  const showOpeningBookDetail = ref(false)

  /* ---------- JAI Match Mode State ---------- */
  const isMatchMode = ref(false)
  const showJaiOptionsDialog = ref(false)
  const showEloCalculatorDialog = ref(false)
  const showUciTerminalDialog = ref(false)

  // JAI engine state properties - use reactive references from JAI engine
  const isMatchRunning = computed(
    () => jaiEngine?.isMatchRunning?.value || false
  )
  const currentJaiEngineId = computed(
    () => jaiEngine?.currentEngine?.value?.id || ''
  )

  // Elo display computed from current WLD
  const matchEloDisplay = computed<string | null>(() => {
    const w = jaiEngine?.matchWins?.value || 0
    const l = jaiEngine?.matchLosses?.value || 0
    const d = jaiEngine?.matchDraws?.value || 0
    const res = calculateEloRating(w, l, d)
    if (!res) return null
    const perf = formatEloRating(res)
    const err = formatErrorMargin(res)
    return `${perf} ${err}`.trim()
  })

  /* ---------- Auto Play ---------- */
  const isRedAi = ref(false)
  const isBlackAi = ref(false)
  const isManualAnalysis = ref(false) // Track if current analysis is manual or AI auto-play

  // Persist analysis-time context to ensure stable PV-to-Chinese conversion
  const lastAnalysisFen = ref<string>('') // Jieqi/UI FEN captured at analysis start
  const lastAnalysisPrefixMoves = ref<string[]>([])

  // Computed property: ponder is only available when exactly one AI is enabled
  const isPonderAvailable = computed(() => {
    return (
      isEngineLoaded.value &&
      ((isRedAi.value && !isBlackAi.value) ||
        (!isRedAi.value && isBlackAi.value))
    )
  })

  // Expose isManualAnalysis to global state for useChessGame access
  ;(window as any).__MANUAL_ANALYSIS__ = isManualAnalysis

  // Expose ponder state to global state for useChessGame access
  ;(window as any).__PONDER_STATE__ = {
    enablePonder,
    isPonderAvailable,
    handlePonderAfterMove,
  }
  const moveListElement = ref<HTMLElement | null>(null)
  const engineLogElement = ref<HTMLElement | null>(null)
  const aboutDialogRef = ref<InstanceType<typeof AboutDialog> | null>(null)

  /* ---------- Comment Management ---------- */
  const editingCommentIndex = ref<number | null>(null)
  const editingCommentText = ref<string>('')
  const commentsListElement = ref<HTMLElement | null>(null)
  const commentTextareaRefs = ref<Record<number, any>>({})

  /* ---------- Notation Navigation State ---------- */
  const isPlaying = ref(false)
  const playInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const playSpeed = ref(1000) // Play speed in milliseconds

  // Analysis settings
  const analysisSettings = ref({
    movetime: 1000,
    maxThinkTime: 5000,
    maxDepth: 20,
    maxNodes: 1000000,
    analysisMode: 'movetime',
    advancedScript: '',
  })

  // Computed: split analysis lines by newline for display
  const analysisLines = computed(() => {
    return analysis.value
      ? analysis.value.split('\n').filter((l: string) => l.trim().length > 0)
      : []
  })

  // Computed: use appropriate engine output based on current mode
  const currentEngineOutput = computed(() => {
    if (isMatchMode.value && jaiEngine?.engineOutput?.value) {
      return jaiEngine.engineOutput.value
    }
    return engineOutput.value
  })

  // Bridge: mirror engine's analysis-time context for stable PV rendering
  watch(
    () => engineState?.analysisUiFen?.value,
    val => {
      if (val) lastAnalysisFen.value = val
    }
  )
  watch(
    () => engineState?.analysisPrefixMoves?.value,
    val => {
      if (val) lastAnalysisPrefixMoves.value = [...val]
    }
  )

  // Sync Chinese notation setting with engine
  watch(
    showChineseNotation,
    newValue => {
      setShowChineseNotation(newValue)
    },
    { immediate: true }
  )

  // Load analysis settings from config file
  const loadAnalysisSettings = async () => {
    try {
      await configManager.loadConfig()
      const settings = configManager.getAnalysisSettings()
      analysisSettings.value = {
        movetime: settings.movetime || 1000,
        maxThinkTime: settings.maxThinkTime || 5000,
        maxDepth: settings.maxDepth || 20,
        maxNodes: settings.maxNodes || 1000000,
        analysisMode: settings.analysisMode || 'movetime',
        advancedScript: settings.advancedScript || '',
      }
    } catch (error) {
      console.error('Failed to load analysis settings:', error)
    }
  }

  // Listen for config changes and update analysis settings in real-time
  let configCheckInterval: ReturnType<typeof setInterval> | null = null

  const watchConfigChanges = () => {
    // Listen for settings changes within the same page (via interval check)
    configCheckInterval = setInterval(async () => {
      try {
        const settings = configManager.getAnalysisSettings()
        const currentSettings = analysisSettings.value

        // Check if there are any changes
        if (
          settings.movetime !== currentSettings.movetime ||
          settings.maxThinkTime !== currentSettings.maxThinkTime ||
          settings.maxDepth !== currentSettings.maxDepth ||
          settings.maxNodes !== currentSettings.maxNodes ||
          settings.analysisMode !== currentSettings.analysisMode ||
          settings.advancedScript !== currentSettings.advancedScript
        ) {
          analysisSettings.value = {
            movetime: settings.movetime || 1000,
            maxThinkTime: settings.maxThinkTime || 5000,
            maxDepth: settings.maxDepth || 20,
            maxNodes: settings.maxNodes || 1000000,
            analysisMode: settings.analysisMode || 'movetime',
            advancedScript: settings.advancedScript || '',
          }
        }
      } catch (error) {
        // Ignore errors during config checking
      }
    }, 100) // Check every 100ms for better responsiveness
  }

  // Clean up the config watcher
  const cleanupConfigWatch = () => {
    if (configCheckInterval) {
      clearInterval(configCheckInterval)
      configCheckInterval = null
    }
  }

  /* ---------- Helper: Count unknown pieces in FEN ---------- */
  function countUnknownPieces(fen: string): number {
    const boardPart = fen.split(' ')[0]
    return (boardPart.match(/[xX]/g) || []).length
  }

  /* ---------- Generate FEN and moves for current position ---------- */

  // Helper function to find the last reveal index up to current move index
  const findLastRevealIndex = () => {
    if (currentMoveIndex.value === 0) {
      return -1
    }

    const h = history.value.slice(0, currentMoveIndex.value)
    for (let i = h.length - 1; i >= 0; i--) {
      const entry = h[i]
      // All adjust operations reset the engine state
      if (entry.type === 'adjust') {
        return i
      }
      const prevFen = i === 0 ? initialFen.value : h[i - 1].fen
      const prevUnknown = countUnknownPieces(prevFen)
      const currUnknown = countUnknownPieces(h[i].fen)
      if (prevUnknown !== currUnknown) {
        return i
      }
    }
    return -1
  }

  const baseFenForEngine = computed(() => {
    // If we're at the beginning (move index 0), use initial FEN
    if (currentMoveIndex.value === 0) {
      return initialFen.value
    }

    const lastRevealIdx = findLastRevealIndex()
    if (lastRevealIdx >= 0) {
      return history.value.slice(0, currentMoveIndex.value)[lastRevealIdx].fen
    }
    return initialFen.value
  })

  const engineMovesSinceLastReveal = computed(() => {
    // If we're at the beginning (move index 0), no moves
    if (currentMoveIndex.value === 0) {
      return []
    }

    const lastRevealIdx = findLastRevealIndex()
    const h = history.value.slice(0, currentMoveIndex.value)

    // Get moves from the last reveal to the current position
    const moves: string[] = []
    for (let i = lastRevealIdx + 1; i < h.length; i++) {
      const entry = h[i]
      if (entry.type === 'move') {
        moves.push(entry.data)
      }
    }
    return moves
  })

  /* ---------- UI ---------- */
  const INITIAL_PIECE_COUNTS: { [k: string]: number } = {
    R: 2,
    N: 2,
    B: 2,
    A: 2,
    C: 2,
    P: 5,
    K: 1,
    r: 2,
    n: 2,
    b: 2,
    a: 2,
    c: 2,
    p: 5,
    k: 1,
  }
  const unrevealedPiecesForDisplay = computed(() => {
    const allChars = 'RNBACP'.split('')
    return allChars.flatMap(char => [
      {
        char,
        name: getPieceNameFromChar(char),
        count: unrevealedPieceCounts?.value?.[char] || 0,
        capturedCount: capturedUnrevealedPieceCounts?.value?.[char] || 0,
        max: INITIAL_PIECE_COUNTS[char],
      },
      {
        char: char.toLowerCase(),
        name: getPieceNameFromChar(char.toLowerCase()),
        count: unrevealedPieceCounts?.value?.[char.toLowerCase()] || 0,
        capturedCount:
          capturedUnrevealedPieceCounts?.value?.[char.toLowerCase()] || 0,
        max: INITIAL_PIECE_COUNTS[char.toLowerCase()],
      },
    ])
  })
  function getPieceImageUrl(pieceName: string): string {
    return new URL(`../assets/${pieceName}.svg`, import.meta.url).href
  }
  function getMoveNumber(historyIndex: number): string {
    const moveCount = history.value
      .slice(0, historyIndex + 1)
      .filter((e: HistoryEntry) => e.type === 'move').length
    if (moveCount === 0) return ''
    const moveNumber = Math.floor((moveCount - 1) / 2) + 1
    const isSecondMove = (moveCount - 1) % 2 === 1
    return `${moveNumber}${isSecondMove ? '...' : '.'}`
  }

  /* ---------- Core Logic ---------- */
  function toggleRedAi() {
    // If turning off Red AI and it's currently Red's turn and thinking, stop the analysis
    if (isRedAi.value && isThinking.value && sideToMove.value === 'red') {
      stopAnalysis({ playBestMoveOnStop: false })
    }
    // Disable manual analysis when AI auto-play is enabled
    if (!isRedAi.value && isThinking.value && isManualAnalysis.value) {
      stopAnalysis({ playBestMoveOnStop: false })
      isManualAnalysis.value = false
    }
    isRedAi.value = !isRedAi.value
  }
  function toggleBlackAi() {
    // If turning off Black AI and it's currently Black's turn and thinking, stop the analysis
    if (isBlackAi.value && isThinking.value && sideToMove.value === 'black') {
      stopAnalysis({ playBestMoveOnStop: false })
    }
    // Disable manual analysis when AI auto-play is enabled
    if (!isBlackAi.value && isThinking.value && isManualAnalysis.value) {
      stopAnalysis({ playBestMoveOnStop: false })
      isManualAnalysis.value = false
    }
    isBlackAi.value = !isBlackAi.value
  }
  function isCurrentAiTurnNow() {
    const redTurn = sideToMove.value === 'red'
    return (redTurn && isRedAi.value) || (!redTurn && isBlackAi.value)
  }
  async function checkAndTriggerAi() {
    // Add a guard to prevent starting analysis while the engine is in the process of stopping.
    if (isStopping.value) {
      console.log(
        '[DEBUG] CHECK_AND_TRIGGER_AI: Aborted. Engine is currently stopping.'
      )
      return
    }

    // If the engine is thinking but it's not the AI's turn, stop the analysis first
    if (isThinking.value && !isCurrentAiTurnNow()) {
      // This is a "cancel" operation, not a "move now".
      stopAnalysis({ playBestMoveOnStop: false })
      return
    }

    const should =
      isEngineLoaded.value &&
      isCurrentAiTurnNow() &&
      !isThinking.value &&
      !pendingFlip.value

    console.log(
      `[DEBUG] CHECK_AND_TRIGGER_AI: Checking... isEngineLoaded=${isEngineLoaded.value}, isCurrentAiTurnNow()=${isCurrentAiTurnNow()}, isThinking=${isThinking.value}, isStopping=${isStopping.value}, pendingFlip=${pendingFlip.value}. Outcome: ${
        should ? 'STARTING ANALYSIS' : 'DOING NOTHING'
      }`
    )

    if (should) {
      // AI auto-play mode uses limited analysis settings (time, depth, nodes)
      isManualAnalysis.value = false // Mark as AI auto-play analysis
      console.log(
        '[DEBUG] CHECK_AND_TRIGGER_AI: Starting AI analysis with settings:',
        analysisSettings.value
      )
      // Record analysis-time context
      lastAnalysisFen.value = baseFenForEngine.value
      lastAnalysisPrefixMoves.value = [...engineMovesSinceLastReveal.value]

      // Opening book first: if enabled and there is a book move, play it instead of calling engine
      try {
        const enableBook = gameState?.openingBook?.config?.enableInGame
        const getBookMoveFn = gameState?.getOpeningBookMove
        if (enableBook && typeof getBookMoveFn === 'function') {
          const bookMove = await getBookMoveFn()
          if (bookMove) {
            console.log(
              '[DEBUG] CHECK_AND_TRIGGER_AI: Using opening book move:',
              bookMove
            )
            ;(window as any).__LAST_AI_MOVE__ = bookMove
            ;(window as any).__AI_MOVE_FROM_BOOK__ = true
            const ok = playMoveFromUci(bookMove)
            if (ok) {
              // When using opening book move, do not start engine analysis/pondering.
              nextTick(() => {
                checkAndTriggerAi()
              })
              return
            }
            // If not ok (illegal or none), fall back to engine below
          }
        }
      } catch (e) {
        console.error(
          '[DEBUG] CHECK_AND_TRIGGER_AI: Opening book failed, falling back to engine.',
          e
        )
      }

      startAnalysis(
        analysisSettings.value,
        engineMovesSinceLastReveal.value,
        baseFenForEngine.value,
        currentSearchMoves.value
      )
    }
  }
  function handleMoveClick(moveIndex: number) {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    replayToMove(moveIndex)
  }

  // Set annotation on last move (currentMoveIndex - 1)
  function setAnnotation(a: '!!' | '!' | '!?' | '?!' | '?' | '??' | undefined) {
    if (isMatchRunning.value) return
    const idx = currentMoveIndex.value - 1
    if (
      idx >= 0 &&
      idx < history.value.length &&
      history.value[idx].type === 'move'
    ) {
      updateMoveAnnotation(idx, a)
    }
  }

  function annotationClass(a: NonNullable<HistoryEntry['annotation']>) {
    switch (a) {
      case '!!':
        return 'annot-brilliant'
      case '!':
        return 'annot-good'
      case '!?':
        return 'annot-interesting'
      case '?!':
        return 'annot-dubious'
      case '?':
        return 'annot-mistake'
      case '??':
        return 'annot-blunder'
    }
  }

  /* ---------- Notation Navigation Functions ---------- */

  // Navigate to the first move (opening position)
  function goToFirstMove() {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    if (currentMoveIndex.value > 0) {
      replayToMove(0)
      stopPlayback()
    }
  }

  // Navigate to the previous move
  function goToPreviousMove() {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    if (currentMoveIndex.value > 0) {
      replayToMove(currentMoveIndex.value - 1)
      stopPlayback()
    }
  }

  // Navigate to the next move
  function goToNextMove() {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    if (currentMoveIndex.value < history.value.length) {
      replayToMove(currentMoveIndex.value + 1)
      stopPlayback()
    }
  }

  // Navigate to the last move
  function goToLastMove() {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    if (currentMoveIndex.value < history.value.length) {
      replayToMove(history.value.length)
      stopPlayback()
    }
  }

  // Toggle play/pause functionality
  function togglePlayPause() {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    if (isPlaying.value) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }

  // Start automatic playback
  function startPlayback() {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    if (isPlaying.value) return

    isPlaying.value = true
    playInterval.value = setInterval(() => {
      if (currentMoveIndex.value < history.value.length) {
        replayToMove(currentMoveIndex.value + 1)
      } else {
        stopPlayback()
      }
    }, playSpeed.value)
  }

  // Stop automatic playback
  function stopPlayback() {
    if (playInterval.value) {
      clearInterval(playInterval.value)
      playInterval.value = null
    }
    isPlaying.value = false
  }

  // Handle analysis button click - start analysis or stop analysis based on current state
  function handleAnalysisButtonClick() {
    if (isThinking.value || isPondering.value) {
      // If engine is thinking or pondering, stop the analysis
      handleStopAnalysis()
    } else {
      // If engine is not thinking, start manual analysis
      manualStartAnalysis()
    }
  }

  function manualStartAnalysis() {
    // Manual analysis uses infinite thinking mode without time, depth, or node limits
    // Disable AI auto-play when manual analysis is active
    isRedAi.value = false
    isBlackAi.value = false
    isManualAnalysis.value = true // Mark as manual analysis

    // Stop any ongoing ponder when starting manual analysis
    if (isPondering.value) {
      console.log(
        '[DEBUG] MANUAL_START_ANALYSIS: Stopping ponder before manual analysis'
      )
      stopPonder({ playBestMoveOnStop: false })
    }

    console.log('[DEBUG] MANUAL_START_ANALYSIS: Triggered.')

    const infiniteAnalysisSettings = {
      movetime: 0, // 0 means infinite thinking
      maxThinkTime: 0, // 0 means no time limit
      maxDepth: 0, // 0 means no depth limit
      maxNodes: 0, // 0 means no node limit
      analysisMode: 'infinite',
    }
    // Record analysis-time context
    lastAnalysisFen.value = baseFenForEngine.value
    lastAnalysisPrefixMoves.value = [...engineMovesSinceLastReveal.value]

    startAnalysis(
      infiniteAnalysisSettings,
      engineMovesSinceLastReveal.value,
      baseFenForEngine.value,
      currentSearchMoves.value
    )
  }

  // Handle stop analysis and reset manual analysis state
  function handleStopAnalysis() {
    // If pondering is active, check if it's a ponder hit scenario
    if (isPondering.value) {
      // If ponderhit is true, stop ponder with playBestMoveOnStop = true
      // This allows the engine to finish its current thinking and play the best move
      if (ponderhit.value) {
        console.log(
          '[DEBUG] HANDLE_STOP_ANALYSIS: Ponder hit detected. Stopping ponder with playBestMoveOnStop = true.'
        )
        stopPonder({ playBestMoveOnStop: true })
      } else {
        // Regular ponder stop - just stop without playing best move
        console.log(
          '[DEBUG] HANDLE_STOP_ANALYSIS: Ponder mode detected. Stopping ponder.'
        )
        stopPonder({ playBestMoveOnStop: false })
      }
      return
    }

    // If we are in auto-analysis mode, the stop button should act as a "Move Now" command.
    if (isRedAi.value || isBlackAi.value) {
      console.log(
        '[DEBUG] HANDLE_STOP_ANALYSIS: Auto-analysis mode. Stopping with playBestMoveOnStop = true.'
      )
      stopAnalysis({ playBestMoveOnStop: true })
    } else {
      // If in manual analysis mode, the stop button just cancels the analysis.
      console.log(
        '[DEBUG] HANDLE_STOP_ANALYSIS: Manual analysis mode. Stopping with playBestMoveOnStop = false.'
      )
      stopAnalysis({ playBestMoveOnStop: false })
    }
    isManualAnalysis.value = false // Reset manual analysis state regardless
  }

  // Undo the last move
  function handleUndoMove() {
    // Disable during match running
    if (isMatchRunning.value) {
      return
    }
    undoLastMove()
  }

  // Function to load engines into the dropdown
  const refreshManagedEngines = async () => {
    await configManager.loadConfig()
    managedEngines.value = configManager.getEngines()
    // Pre-select the last used engine, but only if one isn't already selected.
    // This prevents the selection from resetting when the manager dialog closes.
    if (!selectedEngineId.value) {
      selectedEngineId.value = configManager.getLastSelectedEngineId()
    }
    // Clear selected engine if the engine list is empty
    if (managedEngines.value.length === 0) {
      selectedEngineId.value = null
    } else if (selectedEngineId.value) {
      // Check if the selected engine still exists in the list
      const engineExists = managedEngines.value.some(
        e => e.id === selectedEngineId.value
      )
      if (!engineExists) {
        console.log(
          `[DEBUG] AnalysisSidebar: Selected engine (${selectedEngineId.value}) not found in engine list, clearing selection`
        )
        selectedEngineId.value = null
      }
    }
  }

  // Function to load the selected engine from the manager
  const loadSelectedEngine = () => {
    if (!selectedEngineId.value) {
      alert(t('analysis.selectEngine'))
      return
    }
    const engineToLoad = managedEngines.value.find(
      e => e.id === selectedEngineId.value
    )
    if (engineToLoad) {
      if (isMatchMode.value) {
        // In match mode, use JAI engine
        console.log('[DEBUG] AnalysisSidebar: Loading engine in JAI mode')
        jaiEngine.loadEngine(engineToLoad)
      } else {
        // In normal mode, use UCI engine
        console.log('[DEBUG] AnalysisSidebar: Loading engine in UCI mode')
        loadEngine(engineToLoad)
      }
    } else {
      console.log(
        `[DEBUG] AnalysisSidebar: Selected engine (${selectedEngineId.value}) not found in engine list`
      )
      alert(t('errors.selectedEngineNotFound'))
      // Clear the invalid selection
      selectedEngineId.value = null
      // Clear the last selected engine ID from config
      configManager.clearLastSelectedEngineId()
    }
  }

  // Auto-unload current engine when selection changes to avoid mismatch
  watch(selectedEngineId, async (newId, oldId) => {
    if (!oldId || newId === oldId) return

    try {
      if (isMatchMode.value) {
        // Stop match if running, then unload JAI engine
        if (jaiEngine?.isMatchRunning?.value) {
          await jaiEngine.stopMatch()
        }
        if (jaiEngine?.isEngineLoaded?.value) {
          await jaiEngine.unloadEngine()
          console.log(
            '[DEBUG] AnalysisSidebar: Auto-unloaded JAI engine due to selection change'
          )
        }
      } else {
        // Unload UCI engine if loaded
        if (isEngineLoaded.value) {
          await unloadEngine()
          console.log(
            '[DEBUG] AnalysisSidebar: Auto-unloaded UCI engine due to selection change'
          )
        }
      }
    } catch (error) {
      console.error(
        '[DEBUG] AnalysisSidebar: Failed to auto-unload engine on selection change:',
        error
      )
    }
  })

  // Function to unload the current engine
  const handleUnloadEngine = async () => {
    if (isMatchMode.value) {
      // In match mode, check JAI engine state
      if (!jaiEngine?.isEngineLoaded?.value) {
        alert(t('analysis.noEngineLoaded'))
        return
      }

      try {
        await jaiEngine.unloadEngine()
        console.log('[DEBUG] AnalysisSidebar: JAI engine unloaded successfully')
      } catch (error) {
        console.error(
          '[DEBUG] AnalysisSidebar: Failed to unload JAI engine:',
          error
        )
        alert(t('errors.engineUnloadFailed'))
      }
    } else {
      // In normal mode, check UCI engine state
      if (!isEngineLoaded.value) {
        alert(t('analysis.noEngineLoaded'))
        return
      }

      try {
        await unloadEngine()
        console.log('[DEBUG] AnalysisSidebar: UCI engine unloaded successfully')
      } catch (error) {
        console.error(
          '[DEBUG] AnalysisSidebar: Failed to unload UCI engine:',
          error
        )
        alert(t('errors.engineUnloadFailed'))
      }
    }
  }

  // Open the about dialog
  function openAboutDialog() {
    aboutDialogRef.value?.openDialog()
  }

  /* ---------- JAI Match Mode Functions ---------- */
  const toggleMatchMode = async () => {
    isMatchMode.value = !isMatchMode.value

    // Save match mode state to configuration
    try {
      await configManager.updateMatchSettings({
        isMatchMode: isMatchMode.value,
      })
      console.log(
        '[DEBUG] AnalysisSidebar: Saved match mode state:',
        isMatchMode.value
      )
    } catch (error) {
      console.error('Failed to save match mode settings:', error)
    }

    // Set global match mode state for useChessGame to access
    ;(window as any).__MATCH_MODE__ = isMatchMode.value

    // Trigger custom event for engine state management
    window.dispatchEvent(
      new CustomEvent('match-mode-changed', {
        detail: { isMatchMode: isMatchMode.value, isStartup: false },
      })
    )

    if (isMatchMode.value) {
      // Initialize JAI engine when entering match mode
      // Use the same engine manager but different protocol
      initializeJaiEngine()
    } else {
      // Clean up JAI engine when exiting match mode
      cleanupJaiEngine()
      ;(window as any).__MATCH_MODE__ = false
    }
  }

  const initializeJaiEngine = () => {
    // For now, use the same engine but with JAI protocol
    // This can be expanded to support dedicated JAI engines
    console.log('[DEBUG] Initializing JAI engine mode')
    // JAI engine state is managed by the JAI engine composable
  }

  const cleanupJaiEngine = () => {
    console.log('[DEBUG] Cleaning up JAI engine mode')
    // Unload JAI engine if loaded
    if (jaiEngine?.isEngineLoaded?.value) {
      jaiEngine.unloadEngine()
    }
    showJaiOptionsDialog.value = false
  }

  // Human vs AI mode handlers
  const handleHumanVsAiModeConfirm = async (settings: {
    aiSide: 'red' | 'black'
    showEngineAnalysis: boolean
  }) => {
    // Import the settings management functions
    const { toggleHumanVsAiMode, setAiSide, toggleShowEngineAnalysis } =
      useHumanVsAiSettings()

    // Enable human vs AI mode
    toggleHumanVsAiMode()

    // Set global flag for human vs AI mode
    ;(window as any).__HUMAN_VS_AI_MODE__ = true

    // Set AI side
    setAiSide(settings.aiSide)

    // Set engine analysis visibility
    if (settings.showEngineAnalysis !== showEngineAnalysis.value) {
      toggleShowEngineAnalysis()
    }

    // No need to set ponder mode - it uses unified setting

    // Force random flip mode for human vs AI mode
    if (flipMode.value !== 'random') {
      flipMode.value = 'random'
    }

    // Set AI player based on selected side
    if (settings.aiSide === 'red') {
      if (!isRedAi.value) toggleRedAi()
      if (isBlackAi.value) toggleBlackAi()
    } else {
      if (isRedAi.value) toggleRedAi()
      if (!isBlackAi.value) toggleBlackAi()
    }

    console.log('[DEBUG] Human vs AI mode enabled:', {
      aiSide: settings.aiSide,
      showEngineAnalysis: settings.showEngineAnalysis,
    })
  }

  const exitHumanVsAiMode = async () => {
    const { toggleHumanVsAiMode } = useHumanVsAiSettings()

    // Disable human vs AI mode
    toggleHumanVsAiMode()

    // Clear global flag for human vs AI mode
    ;(window as any).__HUMAN_VS_AI_MODE__ = false

    // Turn off both AI players
    if (isRedAi.value) toggleRedAi()
    if (isBlackAi.value) toggleBlackAi()

    console.log('[DEBUG] Human vs AI mode disabled')
  }

  const handleMatchButtonClick = () => {
    if (isMatchRunning.value) {
      stopMatch()
    } else {
      startMatch()
    }
  }

  const startMatch = () => {
    if (!jaiEngine?.isEngineLoaded?.value) return
    console.log('[DEBUG] Starting JAI match')
    jaiEngine.startMatch()
  }

  const stopMatch = () => {
    if (!jaiEngine?.isMatchRunning?.value) return
    console.log('[DEBUG] Stopping JAI match')
    jaiEngine.stopMatch()
  }

  /* ---------- Comment Management Functions ---------- */
  // Get comment text for a specific move index
  function getCommentText(moveIndex: number): string {
    if (moveIndex === 0) {
      return gameState.openingComment?.value || ''
    }
    const historyIndex = moveIndex - 1
    if (historyIndex >= 0 && historyIndex < history.value.length) {
      return history.value[historyIndex].comment || ''
    }
    return ''
  }

  // Set ref for v-textarea components by move index
  function setCommentTextareaRef(index: number, el: any) {
    if (index == null) return
    if (el) {
      commentTextareaRefs.value[index] = el
    }
  }

  function getTextareaElement(index: number): HTMLTextAreaElement | null {
    const comp = commentTextareaRefs.value[index]
    if (!comp || !comp.$el) return null
    const ta = comp.$el.querySelector('textarea') as HTMLTextAreaElement | null
    return ta || null
  }

  // Markdown formatting helpers
  function surroundSelection(index: number, before: string, after: string) {
    const ta = getTextareaElement(index)
    const text = editingCommentText.value || ''
    if (!ta) {
      editingCommentText.value = `${before}${text}${after}`
      return
    }
    const start = ta.selectionStart ?? 0
    const end = ta.selectionEnd ?? 0
    const selected = text.slice(start, end)
    const newText =
      text.slice(0, start) + before + selected + after + text.slice(end)
    editingCommentText.value = newText
    nextTick(() => {
      const pos = start + before.length + selected.length + after.length
      ta.focus()
      ta.selectionStart = ta.selectionEnd = pos
    })
  }

  function applyHeading(index: number, level: 1 | 2 | 3 | 4) {
    const ta = getTextareaElement(index)
    const text = editingCommentText.value || ''
    const start = ta?.selectionStart ?? 0
    const end = ta?.selectionEnd ?? 0
    const sel = text.slice(start, end)
    const target =
      sel.length > 0
        ? sel
        : (() => {
            // no selection -> current line
            const lineStart = text.lastIndexOf('\n', start - 1) + 1
            const lineEnd = text.indexOf('\n', start)
            return text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd)
          })()
    const processed = target
      .split('\n')
      .map(l => l.replace(/^\s{0,3}#{1,6}\s+/, ''))
      .map(l => `${'#'.repeat(level)} ${l}`)
      .join('\n')
    if (sel.length > 0) {
      const newText = text.slice(0, start) + processed + text.slice(end)
      editingCommentText.value = newText
      nextTick(() => {
        if (ta) {
          const pos = start + processed.length
          ta.focus()
          ta.selectionStart = ta.selectionEnd = pos
        }
      })
    } else {
      // replace current line
      const lineStart = text.lastIndexOf('\n', start - 1) + 1
      const lineEnd = text.indexOf('\n', start)
      const endPos = lineEnd === -1 ? text.length : lineEnd
      const newText = text.slice(0, lineStart) + processed + text.slice(endPos)
      editingCommentText.value = newText
      nextTick(() => {
        if (ta) {
          const pos = lineStart + processed.length
          ta.focus()
          ta.selectionStart = ta.selectionEnd = pos
        }
      })
    }
  }

  function stripMarkdownText(input: string): string {
    let out = input
    // Remove headers
    out = out.replace(/^\s{0,3}#{1,6}\s+/gm, '')
    // Bold/italic/strike
    out = out.replace(/\*\*([^*]+)\*\*/g, '$1')
    out = out.replace(/__([^_]+)__/g, '$1')
    out = out.replace(/\*([^*]+)\*/g, '$1')
    out = out.replace(/_([^_]+)_/g, '$1')
    out = out.replace(/~~([^~]+)~~/g, '$1')
    // Underline HTML
    out = out.replace(/<u>(.*?)<\/u>/g, '$1')
    // Links and images
    out = out.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    // Inline code
    out = out.replace(/`([^`]+)`/g, '$1')
    return out
  }

  function clearFormatting(index: number) {
    const ta = getTextareaElement(index)
    const text = editingCommentText.value || ''
    if (!ta) {
      editingCommentText.value = stripMarkdownText(text)
      return
    }
    const start = ta.selectionStart ?? 0
    const end = ta.selectionEnd ?? 0
    if (start === end) {
      editingCommentText.value = stripMarkdownText(text)
    } else {
      const before = text.slice(0, start)
      const selected = text.slice(start, end)
      const after = text.slice(end)
      editingCommentText.value = before + stripMarkdownText(selected) + after
      nextTick(() => {
        ta.focus()
        ta.selectionStart = start
        ta.selectionEnd = start + stripMarkdownText(selected).length
      })
    }
  }

  function insertLink(index: number) {
    const ta = getTextareaElement(index)
    const url = window.prompt('URL') || ''
    if (!url) return
    const text = editingCommentText.value || ''
    const start = ta?.selectionStart ?? 0
    const end = ta?.selectionEnd ?? 0
    const selected = text.slice(start, end) || 'link'
    const md = `[${selected}](${url})`
    const newText = text.slice(0, start) + md + text.slice(end)
    editingCommentText.value = newText
    nextTick(() => {
      if (ta) {
        const pos = start + md.length
        ta.focus()
        ta.selectionStart = ta.selectionEnd = pos
      }
    })
  }

  function renderMarkdown(text: string): string {
    if (!text) return ''
    const raw = marked.parse(text, { breaks: true }) as string
    const sanitized = DOMPurify.sanitize(raw)
    return sanitized.replace(
      /<a\s+/g,
      '<a target="_blank" rel="noopener noreferrer" '
    )
  }

  function getCommentHtml(moveIndex: number): string {
    const txt = getCommentText(moveIndex)
    if (!txt) return ''
    return renderMarkdown(txt)
  }

  function getCommentHtmlWithFallback(moveIndex: number): string {
    const html = getCommentHtml(moveIndex)
    if (html) return html
    return DOMPurify.sanitize(String(t('analysis.noComment')))
  }

  // Start editing a comment
  function editComment(moveIndex: number) {
    editingCommentIndex.value = moveIndex
    editingCommentText.value = getCommentText(moveIndex)
  }

  // Save the current comment
  function saveComment() {
    if (editingCommentIndex.value !== null) {
      if (editingCommentIndex.value === 0) {
        // Save opening comment
        if (typeof gameState.updateOpeningComment === 'function') {
          gameState.updateOpeningComment(editingCommentText.value)
        }
      } else {
        const historyIndex = editingCommentIndex.value - 1
        if (historyIndex >= 0 && historyIndex < history.value.length) {
          // Update the comment in the history
          gameState.updateMoveComment(historyIndex, editingCommentText.value)
        }
      }
    }

    editingCommentIndex.value = null
    editingCommentText.value = ''
  }

  // Cancel editing
  function cancelEdit() {
    editingCommentIndex.value = null
    editingCommentText.value = ''
  }

  // Load settings when the component is mounted
  onMounted(async () => {
    // Load managed engines for the dropdown
    refreshManagedEngines()

    // Clear last selected engine ID if the engine list is empty
    if (managedEngines.value.length === 0) {
      console.log(
        `[DEBUG] AnalysisSidebar: Engine list is empty on mount, clearing last selected engine ID`
      )
      configManager.clearLastSelectedEngineId()
    }

    loadAnalysisSettings()
    watchConfigChanges()

    // Load match mode state from configuration
    try {
      await configManager.loadConfig()
      const matchSettings = configManager.getMatchSettings()
      isMatchMode.value = matchSettings.isMatchMode || false
      console.log(
        '[DEBUG] AnalysisSidebar: Loaded match mode state:',
        isMatchMode.value
      )

      // Set global match mode state for useChessGame to access
      ;(window as any).__MATCH_MODE__ = isMatchMode.value

      // Trigger custom event for engine state management on startup
      window.dispatchEvent(
        new CustomEvent('match-mode-changed', {
          detail: { isMatchMode: isMatchMode.value, isStartup: true },
        })
      )
    } catch (error) {
      console.error('Failed to load match mode settings:', error)
    }

    // Debug: Check history entries on mount
    debugHistoryEntries()

    // Listen for force stop AI event. This is used to stop analysis in various scenarios.
    const handleForceStopAi = (event: CustomEvent) => {
      console.log(
        `[DEBUG] HANDLE_FORCE_STOP_AI: Caught event. Reason: ${event.detail?.reason}`
      )
      // For a manual move, we only stop the thinking process.
      // We don't turn off the AI toggles, allowing the AI to potentially start thinking for the next turn.
      if (event.detail?.reason === 'manual-move') {
        // If the engine is pondering, we MUST NOT send a 'stop' command here.
        // The 'handlePonderAfterMove' function will correctly handle whether it's a
        // ponder hit (sending 'ponderhit') or a miss (sending 'stop').
        // Stopping it here creates a race condition.
        if (isPondering.value) {
          console.log(
            '[DEBUG] HANDLE_FORCE_STOP_AI: Pondering detected, yielding to ponder logic.'
          )
          return
        }
        if (isThinking.value) {
          // This is a "cancel" operation.
          stopAnalysis({ playBestMoveOnStop: false })
        }
        return // Early return to avoid turning off AI states
      }

      // For undo and replay operations, preserve manual analysis state
      // so that analysis can be restarted for the new position
      const preserveManualAnalysis =
        event.detail?.reason === 'undo-move' ||
        event.detail?.reason === 'replay-move'
      const wasManualAnalysis = isManualAnalysis.value

      // For all other reasons (new game, replay, fen input etc.), perform a full stop.
      // The engine's state (isThinking) will be reset when it acknowledges the stop.
      if (isThinking.value) {
        // This is also a "cancel" operation.
        stopAnalysis({ playBestMoveOnStop: false })
      }

      // Reset AI toggles immediately.
      isRedAi.value = false
      isBlackAi.value = false

      // Preserve manual analysis state for undo/replay operations
      if (preserveManualAnalysis && wasManualAnalysis) {
        console.log(
          '[DEBUG] FORCE_STOP_AI: Preserving manual analysis state for undo/replay'
        )
        // Keep isManualAnalysis.value = true so it will be restarted when engine is ready
      } else {
        isManualAnalysis.value = false
      }

      // Stop any ongoing ponder
      if (isPondering.value) {
        console.log('[DEBUG] FORCE_STOP_AI: Stopping ponder')
        stopPonder({ playBestMoveOnStop: false })
      }

      if (engineState.bestMove) {
        engineState.bestMove.value = ''
      }
    }

    // This listener is crucial. It waits for the engine to confirm it has stopped,
    // then it checks if a new analysis should begin.
    const onEngineReady = () => {
      console.log(
        '[DEBUG] ON_ENGINE_READY: Event received. Checking what to do next.'
      )

      // If a flip prompt is active, do nothing yet.
      // The analysis will be re-triggered (if needed) by other watchers after the user makes a selection.
      if (pendingFlip.value) {
        console.log(
          '[DEBUG] ON_ENGINE_READY: A flip is pending. Deferring analysis decision.'
        )
        return
      }

      // If we were in manual analysis mode, restart it for the new position.
      if (isManualAnalysis.value) {
        console.log(
          '[DEBUG] ON_ENGINE_READY: Manual analysis mode detected. Restarting analysis.'
        )
        manualStartAnalysis()
      } else {
        // Otherwise, check if it's an AI's turn to move.
        console.log(
          '[DEBUG] ON_ENGINE_READY: Auto analysis mode detected. Checking if AI should move.'
        )
        checkAndTriggerAi()
      }
    }

    window.addEventListener('force-stop-ai', handleForceStopAi as EventListener)
    window.addEventListener('engine-stopped-and-ready', onEngineReady)

    // Clean up listeners when the component is unmounted
    onUnmounted(() => {
      window.removeEventListener(
        'force-stop-ai',
        handleForceStopAi as EventListener
      )
      window.removeEventListener('engine-stopped-and-ready', onEngineReady)
      cleanupConfigWatch()

      // Clean up play interval
      if (playInterval.value) {
        clearInterval(playInterval.value)
        playInterval.value = null
      }
    })
  })

  /* ---------- Watchers ---------- */

  // Watch for the manager dialog to close and refresh the engine list
  watch(showEngineManager, isShown => {
    if (!isShown) {
      refreshManagedEngines()
      // Clear last selected engine ID if the engine list is empty
      if (managedEngines.value.length === 0) {
        console.log(
          `[DEBUG] AnalysisSidebar: Engine list is empty after manager dialog closed, clearing last selected engine ID`
        )
        configManager.clearLastSelectedEngineId()
      }
    }
  })

  watch(
    [sideToMove, isRedAi, isBlackAi, isEngineLoaded, pendingFlip],
    () => {
      nextTick(() => checkAndTriggerAi())
    },
    { immediate: true }
  )

  // Debug: Watch engine thinking state
  watch(isThinking, thinking => {
    console.log('[DEBUG] ENGINE_THINKING_STATE: Changed to:', thinking)
  })

  // This watcher ensures that if a manual move is made while in "manual analysis" mode,
  // a new analysis is automatically started for the resulting position.
  // However, we need to be careful not to restart analysis immediately after undo/replay
  // as the engine might not be ready yet. The onEngineReady handler will take care of that.
  watch(currentMoveIndex, () => {
    // Only restart manual analysis if the engine is loaded and not currently stopping
    if (
      isManualAnalysis.value &&
      !isThinking.value &&
      isEngineLoaded.value &&
      !isStopping.value
    ) {
      console.log(
        '[DEBUG] CURRENT_MOVE_INDEX_WATCHER: Restarting manual analysis for new position'
      )
      manualStartAnalysis()
    }
  })

  watch(bestMove, move => {
    if (!move) return

    console.log(
      `[DEBUG] BESTMOVE_WATCHER: Triggered with move '${move}'. isCurrentAiTurnNow()=${isCurrentAiTurnNow()}.`
    )
    // Only execute best move when it's AI's turn.
    // The isThinking check was removed because the new isStopping flag in useUciEngine handles stale bestmove commands more reliably.
    if (isEngineLoaded.value && isCurrentAiTurnNow()) {
      console.log(`[DEBUG] BESTMOVE_WATCHER: Condition met. Playing move.`)
      // Set the AI move flag before playing the move
      ;(window as any).__LAST_AI_MOVE__ = move
      setTimeout(() => {
        const ok = playMoveFromUci(move)
        bestMove.value = ''
        if (!ok) {
          // In case of a checkmate, do not search again - use trim() to remove spaces
          const trimmedMove = move.trim()
          if (trimmedMove === '(none)' || trimmedMove === 'none') {
            return
          }
          // AI auto-play mode also uses limited analysis settings when re-searching
          isManualAnalysis.value = false // Ensure it's marked as AI analysis
          startAnalysis(
            analysisSettings.value,
            engineMovesSinceLastReveal.value,
            baseFenForEngine.value,
            currentSearchMoves.value
          )
        } else {
          // Handle ponder logic after AI move
          handlePonderAfterMove(move, true)

          nextTick(() => {
            checkAndTriggerAi()
          })
        }
      }, 50)
    }
  })

  watch(
    history,
    () => {
      nextTick(() => {
        if (moveListElement.value) {
          moveListElement.value.scrollTop = moveListElement.value.scrollHeight
        }
      })

      // Debug: Check history entries when history changes
      debugHistoryEntries()
    },
    { deep: true }
  )

  // Watch current engine output for scrolling
  watch(
    currentEngineOutput,
    () => {
      nextTick(() => {
        if (engineLogElement.value) {
          engineLogElement.value.scrollTop = engineLogElement.value.scrollHeight
        }
      })
    },
    { deep: true }
  )

  // Watch ponder availability and stop ponder if not available
  watch(isPonderAvailable, available => {
    if (!available) {
      console.log(
        '[DEBUG] PONDER_WATCH: Stopping ponder due to availability change'
      )

      // Stop any ongoing ponder
      if (isPondering.value) {
        stopPonder({ playBestMoveOnStop: false })
      }
    }
  })

  // Watch engine output and clear log when it reaches the limit
  watch(
    currentEngineOutput,
    newOutput => {
      if (newOutput.length > engineLogLineLimit.value) {
        console.log(
          `[DEBUG] ENGINE_LOG_LIMIT: Clearing log at ${newOutput.length} lines (limit: ${engineLogLineLimit.value})`
        )
        // Clear the appropriate engine output array based on current mode
        if (isMatchMode.value && jaiEngine?.engineOutput?.value) {
          jaiEngine.engineOutput.value = []
        } else {
          engineOutput.value = []
        }
      }
    },
    { deep: true }
  )

  const validationStatusKey = computed(() => {
    if (!validationStatus.value) return 'error'
    // Support "正常"/normal/Normal
    return validationStatus.value.includes('正常') ||
      validationStatus.value.toLowerCase().includes('normal')
      ? 'normal'
      : 'error'
  })

  // Get specific error message
  const validationStatusMessage = computed(() => {
    if (!validationStatus.value) return ''

    // If it's normal status, use i18n translation
    if (
      validationStatus.value.includes('正常') ||
      validationStatus.value.toLowerCase().includes('normal')
    ) {
      return t('positionEditor.validationStatus.normal')
    }

    // Parse error information
    const errorText = validationStatus.value

    // Check if it's dark pieces count mismatch error (new format with side specification)
    const redDarkPiecesMatch = errorText.match(
      /错误:\s*红方(\d+)暗子\s*>\s*(\d+)池/
    )
    if (redDarkPiecesMatch) {
      const darkCount = redDarkPiecesMatch[1]
      const poolCount = redDarkPiecesMatch[2]
      return t('errors.redDarkPiecesMismatch', { darkCount, poolCount })
    }

    const blackDarkPiecesMatch = errorText.match(
      /错误:\s*黑方(\d+)暗子\s*>\s*(\d+)池/
    )
    if (blackDarkPiecesMatch) {
      const darkCount = blackDarkPiecesMatch[1]
      const poolCount = blackDarkPiecesMatch[2]
      return t('errors.blackDarkPiecesMismatch', { darkCount, poolCount })
    }

    // Check if it's piece count exceeded error
    const pieceCountMatch = errorText.match(/错误:\s*(.+?)\s*总数超限!/)
    if (pieceCountMatch) {
      const pieceName = pieceCountMatch[1]
      return t('errors.pieceCountExceeded', { pieceName })
    }

    // If none matches, return original error message
    return errorText
  })

  // UCI info line parser: parse info line into an object
  function parseUciInfoLine(line: string) {
    // Only process lines starting with 'info '
    if (!line.startsWith('info ')) return null
    const result: Record<string, any> = {}

    // Extract common fields using regex
    const regexps = [
      { key: 'depth', re: /depth (\d+)/ },
      { key: 'seldepth', re: /seldepth (\d+)/ },
      { key: 'multipv', re: /multipv (\d+)/ },
      { key: 'score', re: /score (cp|mate) ([\-\d]+)/ },
      { key: 'wdl', re: /wdl (\d+) (\d+) (\d+)/ },
      { key: 'nodes', re: /nodes (\d+)/ },
      { key: 'nps', re: /nps (\d+)/ },
      { key: 'hashfull', re: /hashfull (\d+)/ },
      { key: 'tbhits', re: /tbhits (\d+)/ },
      { key: 'time', re: /time (\d+)/ },
    ]

    // Process all fields except PV first
    for (const { key, re } of regexps) {
      const m = line.match(re)
      if (m) {
        if (key === 'score') {
          result['scoreType'] = m[1]
          result['scoreValue'] = m[2]
        } else if (key === 'wdl') {
          result['wdlWin'] = parseInt(m[1], 10)
          result['wdlDraw'] = parseInt(m[2], 10)
          result['wdlLoss'] = parseInt(m[3], 10)
        } else {
          result[key] = m[1] || m[2]
        }
      }
    }

    // Extract PV (Principal Variation) - it should be the last field in the line
    // Look for "pv" followed by space and capture everything until the end of line
    const pvMatch = line.match(/\spv\s(.+)$/)
    if (pvMatch) {
      result['pv'] = pvMatch[1].trim()
    }

    return result
  }

  // Format UCI info object for user-friendly display, with i18n support and color coding
  function formatUciInfo(info: Record<string, any>) {
    if (!info) return ''

    let scoreValue = 0
    let isMate = false
    if (info.scoreType && info.scoreValue) {
      if (info.scoreType === 'cp') {
        scoreValue = parseInt(info.scoreValue, 10)
      } else if (info.scoreType === 'mate') {
        scoreValue = parseInt(info.scoreValue, 10)
        isMate = true
      }
    }

    // 1. Handle pondering mode adjustment
    if (isPondering.value && !isInfinitePondering.value) {
      scoreValue = -scoreValue
    }

    // 2. Normalize to Red's perspective based on current side to move
    // Check last analysis FEN for side to move indicator
    if (engineState.analysisUiFen.value.includes(' b ')) {
      scoreValue = -scoreValue
    }

    // 3. Adjust display perspective based on board flip state
    // If board is flipped, show from black perspective (invert the red-normalized score)
    if (isBoardFlipped.value) {
      scoreValue = -scoreValue
    }

    const getScoreColorClass = () => {
      if (isMate) {
        return scoreValue > 0 ? 'score-mate-positive' : 'score-mate-negative'
      } else {
        if (scoreValue > 50) return 'score-positive'
        if (scoreValue < -50) return 'score-negative'
        return 'score-neutral'
      }
    }

    // Format WDL percentages
    const formatWdl = () => {
      if (
        info.wdlWin !== undefined &&
        info.wdlDraw !== undefined &&
        info.wdlLoss !== undefined
      ) {
        const total = info.wdlWin + info.wdlDraw + info.wdlLoss
        if (total > 0) {
          const winPercent = ((info.wdlWin / total) * 100).toFixed(1)
          const drawPercent = ((info.wdlDraw / total) * 100).toFixed(1)
          const lossPercent = ((info.wdlLoss / total) * 100).toFixed(1)
          return `<span class="wdl-info">${t('uci.wdl')}: ${winPercent}%/${drawPercent}%/${lossPercent}%</span>`
        }
      }
      return null
    }

    // Format PV with Chinese notation if enabled
    const formatPv = () => {
      if (!info.pv) return null

      if (showChineseNotation.value) {
        try {
          // Use the recorded analysis-time root FEN and prefix moves so PV stays stable across navigation
          // Use the analysis-start UI FEN and convert the PV. When pondering with a known expected move,
          // prepend that move to the PV so conversion happens from the correct position.
          let rootFen = isMatchMode.value
            ? gameState.generateFen()
            : engineState.analysisUiFen.value || gameState.generateFen()

          // Convert FEN to new format if necessary (Chinese notation parser requires new format)
          if (!useNewFenFormat.value && gameState.convertFenFormat) {
            rootFen = gameState.convertFenFormat(rootFen, 'new')
          }

          let pvToConvert: string = info.pv
          if (
            isPondering.value &&
            !isInfinitePondering.value &&
            ponderMove.value &&
            !pvToConvert.startsWith(ponderMove.value)
          ) {
            pvToConvert = `${ponderMove.value} ${pvToConvert}`
          }

          console.log('[DEBUG] FORMAT_PV: Converting PV', {
            rootFen,
            pvOriginal: info.pv,
            pvWithPonder: pvToConvert,
            isPondering: isPondering.value,
            isInfinitePondering: isInfinitePondering.value,
            ponderMove: ponderMove.value,
          })

          const chineseMoves = uciToChineseMoves(rootFen, pvToConvert)
          const chinesePv = chineseMoves.join(' ')
          return `<span class="pv-line">${t('uci.pv')}: ${chinesePv}</span>`
        } catch (error) {
          console.warn('Failed to convert PV to Chinese notation:', error)
          // Fallback to raw PV if conversion fails
          return `<span class="pv-line">${t('uci.pv')}: ${info.pv}</span>`
        }
      }
      return `<span class="pv-line">${t('uci.pv')}: ${info.pv}</span>`
    }

    // Use i18n for field names
    const fields = [
      info.depth && `${t('uci.depth')}: ${info.depth}`,
      info.seldepth && `${t('uci.seldepth')}: ${info.seldepth}`,
      info.multipv && `${t('uci.multipv')}: ${info.multipv}`,
      info.scoreType &&
        info.scoreValue &&
        (() => {
          if (info.scoreType === 'cp') {
            return `<span class="${getScoreColorClass()}">${t('uci.score')}: ${scoreValue}</span>`
          }
          const sign = scoreValue > 0 ? '+' : '-'
          const ply = Math.abs(scoreValue)
          return `<span class=\"${getScoreColorClass()}\">${t('uci.mate')}: ${sign}M${ply}</span>`
        })(),
      formatWdl(),
      info.nodes && `${t('uci.nodes')}: ${info.nodes}`,
      info.nps &&
        `${t('uci.nps')}: ${(parseInt(info.nps, 10) / 1000).toFixed(1)}K`,
      info.hashfull && `${t('uci.hashfull')}: ${info.hashfull}‰`,
      info.tbhits && `${t('uci.tbhits')}: ${info.tbhits}`,
      info.time &&
        `${t('uci.time')}: ${(parseInt(info.time, 10) / 1000).toFixed(2)}s`,
      formatPv(),
    ].filter(Boolean)
    return fields.join(' | ')
  }

  // Process analysisLines: translate info lines, keep others as is
  const parsedAnalysisLines = computed(() => {
    return analysisLines.value.map((line: string) => {
      if (line.startsWith('info ')) {
        // Decide whether to parse UCI info based on parseUciInfo setting
        if (parseUciInfo.value) {
          const info = parseUciInfoLine(line)
          if (info) return formatUciInfo(info)
        }
        // If not parsing, return original line
        return line
      }
      return line // Non-info lines are returned as is
    })
  })

  // Parse JAI analysis info similar to UCI engine output
  function parseJaiAnalysisInfo(analysisInfo: string): string {
    if (!analysisInfo) return ''

    // Split by lines and process each line
    const lines = analysisInfo
      .split('\n')
      .filter(line => line.trim().length > 0)

    return lines
      .map(line => {
        if (line.startsWith('info ')) {
          // Decide whether to parse UCI info based on parseUciInfo setting
          if (parseUciInfo.value) {
            const info = parseUciInfoLine(line)
            if (info) return formatUciInfo(info)
          }
          // If not parsing, return original line
          return line
        }
        return line // Non-info lines are returned as is
      })
      .join('<br>')
  }

  // Helper functions for engine analysis display
  import { MATE_SCORE_BASE } from '@/utils/constants'
  function getScoreClass(score: number): string {
    if (score >= MATE_SCORE_BASE - 999) return 'score-mate-positive'
    if (score <= -(MATE_SCORE_BASE - 999)) return 'score-mate-negative'
    if (score > 50) return 'score-positive'
    if (score < -50) return 'score-negative'
    return 'score-neutral'
  }

  function formatScore(score: number): string {
    if (Math.abs(score) >= MATE_SCORE_BASE - 999) {
      const sign = score > 0 ? '+' : '-'
      const ply = Math.max(
        0,
        MATE_SCORE_BASE - Math.min(MATE_SCORE_BASE - 1, Math.abs(score))
      )
      return `${sign}M${ply}`
    }
    return score.toString() // Display centipawns directly
  }

  function formatTime(timeMs: number): string {
    if (timeMs < 1000) return `${timeMs}ms`
    return `${(timeMs / 1000).toFixed(1)}s`
  }

  // Debug function to check history entries
  function debugHistoryEntries() {
    console.log('[DEBUG] HISTORY_ENTRIES: Current history:', history.value)
    history.value.forEach((entry: any, idx: number) => {
      if (entry.type === 'move') {
        console.log(`[DEBUG] HISTORY_ENTRY_${idx}:`, {
          data: entry.data,
          engineScore: entry.engineScore,
          engineTime: entry.engineTime,
        })
      }
    })
  }

  /* ---------- Luck Index ---------- */

  const hasPositionEdit = computed(() => {
    const end = currentMoveIndex.value
    const h = history.value.slice(0, end)
    return h.some(
      (e: HistoryEntry) =>
        e.type === 'adjust' &&
        typeof e.data === 'string' &&
        e.data.startsWith('position_edit:')
    )
  })

  const isStandardStart = computed(() => {
    return (initialFen.value || '').trim() === START_FEN.trim()
  })

  const shouldShowLuckIndex = computed(() => {
    return (
      isStandardStart.value && !hasPositionEdit.value && showLuckIndex.value
    )
  })

  const revealSequence = computed(() => {
    if (!shouldShowLuckIndex.value) return ''
    const seqChars: string[] = []
    const limit = currentMoveIndex.value
    for (let i = 0; i < limit; i++) {
      const entry = history.value[i]
      if (!entry || entry.type !== 'move') continue
      const uci = (entry.data || '').trim()
      if (uci.length <= 4) continue
      const flipInfo = uci.substring(4)
      const moverIsRed = i % 2 === 0
      for (const ch of flipInfo) {
        const isLetter = ch.toLowerCase() !== ch.toUpperCase()
        if (!isLetter) continue
        const isUpper = ch === ch.toUpperCase()
        const isRevealed = (moverIsRed && isUpper) || (!moverIsRed && !isUpper)
        if (isRevealed) seqChars.push(ch)
      }
    }
    return seqChars.join('')
  })

  function sequenceToFeatures(sequence: string): number[] {
    const features: number[] = []
    const counts = new Array(12).fill(0)
    const timings = new Array(12).fill(0)
    for (let i = 0; i < sequence.length; i++) {
      const piece = sequence[i]
      const idx = PIECE_TO_INDEX[piece]
      if (idx == null) continue
      counts[idx] += 1
      if (timings[idx] === 0) timings[idx] = i + 1
    }
    const totalMoves = sequence.length
    features.push(...counts)
    features.push(...timings)
    features.push(totalMoves)
    return features
  }

  function sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z))
  }

  const luckWinRate = computed(() => {
    if (!shouldShowLuckIndex.value) return 0.5
    const seq = revealSequence.value
    const feats = sequenceToFeatures(seq)
    if (feats.length !== FEATURE_DIM) return 0.5
    const scaled = new Array(FEATURE_DIM)
    for (let i = 0; i < FEATURE_DIM; i++) {
      const scale = (SCALER_SCALES as readonly number[])[i]
      const mean = (SCALER_MEANS as readonly number[])[i]
      scaled[i] = scale !== 0 ? (feats[i] - mean) / scale : feats[i] - mean
    }
    let z = MODEL_INTERCEPT
    for (let i = 0; i < FEATURE_DIM; i++) {
      z += scaled[i] * (MODEL_WEIGHTS as readonly number[])[i]
    }
    return sigmoid(z)
  })

  const luckIndex = computed(() => {
    // Map win rate to [-100, 100]
    const v = Math.round((luckWinRate.value - 0.5) * 200)
    return Math.max(-100, Math.min(100, v))
  })

  const luckClass = computed(() => {
    if (luckIndex.value > 5) return 'luck-positive'
    if (luckIndex.value < -5) return 'luck-negative'
    return 'luck-neutral'
  })

  const axisTicks = computed(() => {
    // Show ticks at -100, -50, 0, +50, +100
    return [
      { pos: 0, label: '-100' },
      { pos: 25, label: '-50' },
      { pos: 50, label: '0' },
      { pos: 75, label: '50' },
      { pos: 100, label: '100' },
    ]
  })

  const markerStyle = computed(() => {
    const pos = (luckIndex.value + 100) / 2 // 0..100
    return {
      left: `calc(${pos}% )`,
    } as Record<string, string>
  })

  /* ---------- Ponder Helper Functions ---------- */

  // Handle ponder logic after a move is played
  function handlePonderAfterMove(uciMove: string, isAiMove: boolean) {
    // Skip pondering entirely if last AI move comes from opening book
    if ((window as any).__AI_MOVE_FROM_BOOK__) {
      // Clear the flag for next moves
      ;(window as any).__AI_MOVE_FROM_BOOK__ = false
      return
    }
    if (isInfinitePondering.value) {
      stopPonder({ playBestMoveOnStop: false })
      return
    }
    if (!enablePonder.value || !isPonderAvailable.value) return
    if (isAiMove) {
      // AI just moved, check if there's a pending flip dialog
      if (pendingFlip.value) {
        console.log(
          `[DEBUG] PONDER: AI move '${uciMove}' detected, but FlipPromptDialog is open. Deferring ponder until dialog closes.`
        )
        // Don't start ponder yet - it will be triggered when the flip dialog closes
        return
      }
      // AI just moved, start pondering immediately
      if (isEngineLoaded.value) {
        setTimeout(() => {
          console.log(
            `[DEBUG] PONDER: Starting ponder after AI move '${uciMove}'`
          )
          startPonderAfterAiMove()
        }, 100) // Small delay to ensure move is fully processed
      }
    } else {
      // Human just moved, check if it matches ponder expectation
      if (isPondering.value) {
        // For JieQi: if the move involves a dark piece, it's always a ponder miss
        if (isDarkPieceMove(uciMove)) {
          console.log(
            `[DEBUG] PONDER_MISS: Dark piece move detected, stopping ponder`
          )
          stopPonder({ playBestMoveOnStop: false })
        } else if (isPonderMoveMatch(uciMove)) {
          console.log(
            `[DEBUG] PONDER_HIT: Move '${uciMove}' matches expected ponder move`
          )
          handlePonderHit()
        } else {
          console.log(
            `[DEBUG] PONDER_MISS: Move '${uciMove}' does not match expected ponder move '${ponderMove.value}'`
          )
          stopPonder({ playBestMoveOnStop: false })
        }
      }
    }
  }

  // Start pondering after AI move.
  function startPonderAfterAiMove() {
    if (!isEngineLoaded.value || isPondering.value) return
    // Only start ponder if ponder is enabled and available
    if (!enablePonder.value || !isPonderAvailable.value) return

    // Use the generic startPonder function from the engine composable with analysis settings.
    engineState.startPonder(
      baseFenForEngine.value,
      engineMovesSinceLastReveal.value,
      ponderMove.value,
      analysisSettings.value
    )
  }

  /* ---------- Opening Book Functions ---------- */

  const handleOpeningBookMove = (uciMove: string) => {
    if (playMoveFromUci) {
      playMoveFromUci(uciMove)
    }
  }

  // Get Chinese notation for a specific move
  function getChineseNotationForMove(moveIndex: number): string {
    if (moveIndex < 0 || moveIndex >= history.value.length) return ''

    const entry = history.value[moveIndex]
    if (entry.type !== 'move') return ''

    try {
      // Get the FEN before this move
      const fenBeforeMove =
        moveIndex === 0 ? initialFen.value : history.value[moveIndex - 1].fen

      // In human vs AI mode, only use first 4 characters of UCI move (hide extensions)
      const uciMove = isHumanVsAiMode.value
        ? entry.data.slice(0, 4)
        : entry.data
      const chineseMoves = uciToChineseMoves(fenBeforeMove, uciMove)
      return chineseMoves[0] || ''
    } catch (error) {
      console.warn('Failed to convert move to Chinese notation:', error)
      return ''
    }
  }
</script>

<style lang="scss">
  .sidebar {
    width: 420px;
    height: calc(
      100vh - 120px
    ); /* Adjusted to account for toolbar and padding */
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-sizing: border-box;
    border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    overflow-y: auto;
    background-color: rgb(var(--v-theme-surface));

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      width: 100%;
      max-width: 500px;
      height: auto;
      max-height: 60vh;
      border-left: none;
      border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
      margin-top: 20px;
      padding: 10px;
      gap: 6px;
    }
  }

  /* Styles for the engine manager section */
  .engine-management {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;

    .engine-select {
      flex-grow: 1;
    }

    .action-btn {
      flex-shrink: 0;
    }
  }

  .full-btn {
    width: 100%;
  }

  .button-group {
    display: flex;
    gap: 6px;
    width: 100%;

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      gap: 4px;
    }
  }

  .match-mode-buttons {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      gap: 4px;
    }
  }

  .grouped-btn {
    flex: 1;

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      font-size: 11px;
    }
  }

  .half-btn {
    width: 49%;

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      width: 48%;
      font-size: 11px;
    }
  }
  .section {
    padding-top: 6px;
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }
  .section h3,
  .section-title {
    margin: 0 0 6px;
    padding-bottom: 3px;
    font-size: 0.9rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .analysis-output,
  .move-list {
    padding: 10px;
    border-radius: 5px;
    height: 150px;
    overflow-y: auto;
    font-family: 'Courier New', Courier, monospace;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    font-size: 13px;

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      height: 120px;
      font-size: 12px;
    }
  }

  /* Make text areas fill available height when panel is undocked/resized */
  .undocked-panel-content .analysis-output,
  .undocked-panel-content .move-list,
  .undocked-panel-content .comments-list,
  .undocked-panel-content .engine-log {
    height: 100% !important;
    max-height: none;
  }

  .score-positive {
    color: #c62828;
    font-weight: bold;
  }

  .score-negative {
    color: #2e7d32;
    font-weight: bold;
  }

  .score-neutral {
    color: rgb(var(--v-theme-on-surface));
  }

  .score-mate-positive {
    color: #b71c1c;
    font-weight: bold;
    background-color: #ffcdd2;
    padding: 1px 4px;
    border-radius: 3px;
  }

  .score-mate-negative {
    color: #1b5e20;
    font-weight: bold;
    background-color: #c8e6c9;
    padding: 1px 4px;
    border-radius: 3px;
  }

  .pv-line {
    color: #1976d2;
    font-weight: normal;
    font-family:
      'Noto Sans SC',
      'Microsoft YaHei',
      'PingFang SC',
      'Hiragino Sans GB',
      'Source Han Sans SC',
      'WenQuanYi Micro Hei',
      'Heiti SC',
      system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      Arial,
      sans-serif;
  }

  /* ---------- Luck Index Styles ---------- */
  .luck-index-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .luck-description {
    font-size: 12px;
    color: rgb(var(--v-theme-on-surface));
    opacity: 0.7;
    margin-bottom: 4px;
  }
  .luck-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .luck-row .label {
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
    opacity: 0.8;
  }
  .luck-value {
    font-weight: 700;
    font-size: 18px;
  }
  .luck-positive {
    color: #d32f2f;
  }
  .luck-negative {
    color: #2e7d32;
  }
  .luck-neutral {
    color: rgb(var(--v-theme-on-surface));
    opacity: 0.85;
  }
  .luck-axis {
    position: relative;
    height: 42px;
    padding: 10px 0 14px 0;
    margin: 0 4px; /* Add margin to ensure ticks are visible when undocked */
  }
  .axis-track {
    position: absolute;
    left: 4px; /* Adjust to account for margin */
    right: 4px; /* Adjust to account for margin */
    top: 18px;
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(90deg, #2e7d32, #9e9e9e, #d32f2f);
    opacity: 0.9;
  }
  .axis-tick {
    position: absolute;
    top: 10px;
    width: 0;
    height: 18px;
  }
  .axis-tick::before {
    content: '';
    position: absolute;
    left: -1px;
    top: 8px;
    width: 2px;
    height: 12px;
    background: rgba(var(--v-border-color), var(--v-border-opacity));
  }
  .tick-label {
    position: absolute;
    top: 22px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: rgb(var(--v-theme-on-surface));
    opacity: 0.8;
    white-space: nowrap; /* Prevent label wrapping */
  }
  .axis-zero {
    position: absolute;
    top: 12px;
    width: 0;
    height: 30px;
    border-left: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  }
  .axis-marker {
    position: absolute;
    top: 2px;
    transform: translateX(-50%);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    background: rgba(var(--v-theme-surface), 0.9);
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  .marker-value {
    font-family: 'Courier New', Courier, monospace;
  }
  .luck-legend {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: rgb(var(--v-theme-on-surface));
    opacity: 0.8;
  }

  .wdl-info {
    color: #9c27b0;
    font-weight: bold;
  }
  .move-item {
    display: flex;
    gap: 10px;
    padding: 3px 5px;
    cursor: pointer;
    border-radius: 3px;
  }
  .move-item:hover {
    background-color: rgba(var(--v-theme-primary), 0.1);
  }
  .move-item.current-move {
    background-color: rgba(var(--v-theme-primary), 0.2);
    font-weight: bold;
  }
  .move-number {
    font-weight: bold;
    width: 40px;
    text-align: right;
    white-space: nowrap;
  }
  .move-uci {
    flex: 1;
  }

  .move-chinese {
    font-family:
      'Noto Sans SC',
      'Microsoft YaHei',
      'PingFang SC',
      'Hiragino Sans GB',
      'Source Han Sans SC',
      'WenQuanYi Micro Hei',
      'Heiti SC',
      system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      Arial,
      sans-serif;
    font-size: 0.85rem;
    color: rgb(var(--v-theme-secondary));
    font-weight: normal;
    margin-left: 8px;
  }

  .move-annot {
    font-weight: bold;
    font-size: 0.8rem;
    margin-left: 4px;
    padding: 1px 3px;
    border-radius: 2px;
    white-space: nowrap;
  }

  .annot-brilliant {
    color: #0066cc;
  }

  .annot-good {
    color: #00bcd4;
  }

  .annot-interesting {
    color: #8bc34a;
  }

  .annot-dubious {
    color: #ff9800;
  }

  .annot-mistake {
    color: #ff5722;
  }

  .annot-blunder {
    color: #f44336;
  }

  .engine-analysis {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-left: 8px;
    font-size: 11px;
  }

  .engine-score {
    font-weight: bold;
    padding: 1px 3px;
    border-radius: 2px;
    white-space: nowrap;
  }

  .engine-time {
    font-size: 10px;
    white-space: nowrap;
  }
  .move-adjust {
    font-style: italic;
    font-size: 12px;
    width: 100%;
    text-align: center;
  }
  .autoplay-settings {
    display: flex;
    justify-content: space-between;
    gap: 6px;

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      gap: 4px;
    }
  }

  .pool-manager {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }
  }
  .pool-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1px 4px;
    border-radius: 4px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }
  .pool-piece-img {
    width: 20px;
    height: 20px;
  }
  .pool-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    width: 100%;
  }
  .control-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .pool-count {
    font-weight: bold;
    font-size: 0.9rem;
    width: 40px;
    text-align: center;
  }
  .switch-row {
    display: flex;
    gap: 8px;
    margin-bottom: 4px;
  }

  .compact-switch {
    flex: 1;
    margin-top: -6px;
    margin-bottom: -4px;
  }

  .compact-switch .v-label {
    font-size: 0.85rem !important;
  }

  .custom-switch {
    margin-top: -6px;
    margin-bottom: -4px;
  }
  .notation-controls {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  .notation-btn {
    flex: 1;
  }

  .notation-info {
    background-color: rgb(var(--v-theme-surface));
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 12px;
    color: rgb(var(--v-theme-on-surface));

    p {
      margin: 4px 0;
      line-height: 1.4;
    }
  }

  .engine-log {
    background-color: #2e2e2e;
    color: #f0f0f0;
    padding: 10px;
    border-radius: 5px;
    height: 150px;
    overflow-y: scroll;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    white-space: pre-line;

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      height: 120px;
      font-size: 11px;
    }
  }

  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 1000;
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.3s ease;

    &.show {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .line-sent {
    color: #87cefa;
  }
  .line-sent::before {
    content: '>> ';
  }
  .line-recv {
    color: #b3b3b3;
  }

  .about-section {
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  /* ---------- Comment Styles ---------- */
  .comments-list {
    padding: 10px;
    border-radius: 5px;
    height: 200px;
    overflow-y: auto;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    font-size: 13px;

    // Mobile responsive adjustments
    @media (max-width: 768px) {
      height: 150px;
      font-size: 12px;
    }
  }

  .comment-item {
    margin-bottom: 8px;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background-color: rgba(var(--v-theme-surface), 0.8);
  }

  .comment-item.current-comment {
    background-color: rgba(var(--v-theme-primary), 0.1);
    border-color: rgb(var(--v-theme-primary));
  }

  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .comment-number {
    font-weight: bold;
    font-size: 12px;
  }

  .comment-text {
    font-size: 13px;
    line-height: 1.4;
    word-wrap: break-word;
  }

  .comment-edit {
    margin-top: 4px;
  }

  .comment-toolbar {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }

  .comment-text :deep(h1),
  .comment-text :deep(h2),
  .comment-text :deep(h3),
  .comment-text :deep(h4) {
    margin: 6px 0 4px;
    line-height: 1.2;
  }
  .comment-text :deep(p) {
    margin: 4px 0;
  }
  .comment-text :deep(a) {
    color: rgb(var(--v-theme-primary));
    text-decoration: underline;
  }

  .comment-edit-buttons {
    display: flex;
    gap: 4px;
    margin-top: 4px;
  }

  .panel-header .section-title {
    margin: 0;
    padding-left: 8px;
    font-size: 0.9rem;
    flex-grow: 1;
  }

  /* ---------- Match Mode Styles ---------- */
  .match-output {
    padding: 8px;
    font-family: monospace;
    font-size: 12px;
    line-height: 1.4;
  }

  .match-info {
    border-radius: 6px;
    padding: 12px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .match-status {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .status-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status-line .label {
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface));
    opacity: 0.8;
  }

  .status-line .value {
    font-weight: 500;
    color: rgb(var(--v-theme-primary));
  }

  .no-match-info {
    padding: 20px;
    text-align: center;
    color: rgb(var(--v-theme-on-surface));
    opacity: 0.6;
    font-style: italic;
  }

  .analysis-info {
    margin-top: 12px;
    padding: 8px;
    border-radius: 4px;
    background-color: rgba(var(--v-theme-surface), 0.8);
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .info-header {
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 6px;
    color: rgb(var(--v-theme-primary));
  }

  .analysis-line {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    line-height: 1.3;
    white-space: pre-line;
  }

  /* ---------- Notation Navigation Styles ---------- */
  .notation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .notation-header h3 {
    margin: 0;
    font-size: 0.9rem;
  }

  .notation-controls {
    display: flex;
    gap: 2px;
    align-items: center;
  }

  .notation-controls .v-btn {
    min-width: 28px;
    height: 28px;
  }

  /* Disable clicks during match running */
  .disabled-clicks .move-item {
    pointer-events: none;
    opacity: 0.6;
  }
</style>
