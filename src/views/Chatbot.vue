<template>
  <div class="chatbot-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">AI Financial Advisor</h1>
        <p class="page-sub">Powered by OpenAI · Ask about your split, goals, or spending</p>
      </div>
      <div class="ai-badge">
        <span class="ai-dot" />
        AI Active
      </div>
    </div>

    <!-- Chat window -->
    <div class="chat-window card" ref="windowEl">
      <div class="chat-messages" ref="listEl">
        <div
          v-for="msg in store.chatMessages"
          :key="msg.id"
          :class="['bubble-row', msg.role === 'user' ? 'bubble-row--user' : 'bubble-row--ai']"
        >
          <div v-if="msg.role === 'assistant'" class="ai-avatar">AI</div>
          <div class="bubble" :class="msg.role === 'user' ? 'bubble--user' : 'bubble--ai'">
            <p class="bubble-text">{{ msg.content }}</p>
            <!-- Suggested split chip -->
            <div v-if="msg.suggestedSplit" class="suggested-split">
              <p class="suggested-title">Suggested split:</p>
              <div class="split-chips">
                <span class="split-chip save">Save {{ msg.suggestedSplit.save }}%</span>
                <span class="split-chip invest">Invest {{ msg.suggestedSplit.invest }}%</span>
                <span class="split-chip spend">Spend {{ msg.suggestedSplit.spend }}%</span>
              </div>
              <button
                class="btn btn-outline apply-btn"
                :disabled="store.isApplyingSplit"
                @click="store.applySuggestedSplit(msg.suggestedSplit)"
              >
                <span v-if="store.isApplyingSplit" class="apply-spinner" />
                <span v-else>Apply this split →</span>
              </button>
            </div>
            <span class="bubble-ts">{{ fmtTime(msg.ts) }}</span>
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="store.isChatLoading" class="bubble-row bubble-row--ai">
          <div class="ai-avatar">AI</div>
          <div class="bubble bubble--ai">
            <div class="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input bar -->
    <div class="chat-input-bar">
      <div class="chat-input-wrap card">
        <input
          ref="inputEl"
          v-model="inputText"
          type="text"
          class="chat-input"
          placeholder="Ask me anything… e.g. 'How do I hit my goal by Dec 2026?'"
          :disabled="store.isChatLoading"
          @keydown.enter.prevent="send"
        />
        <button
          class="send-btn"
          :disabled="!inputText.trim() || store.isChatLoading"
          @click="send"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Quick prompts -->
    <div class="quick-prompts">
      <button
        v-for="q in quickPrompts"
        :key="q"
        class="quick-btn"
        :disabled="store.isChatLoading"
        @click="sendQuick(q)"
      >
        {{ q }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useFinanceStore } from '../stores/finance.js'

const store    = useFinanceStore()
const inputEl  = ref(null)
const listEl   = ref(null)
const inputText = ref('')

const quickPrompts = [
  'How do I hit my house goal by Dec 2026?',
  'Should I invest more?',
  'Optimise my split for me',
  'Am I spending too much?',
]

async function send() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  await store.sendChat(text)
  scrollToBottom()
}

function sendQuick(q) {
  inputText.value = q
  send()
}

function scrollToBottom() {
  nextTick(() => {
    if (listEl.value) {
      listEl.value.scrollTop = listEl.value.scrollHeight
    }
  })
}

watch(() => store.chatMessages.length, scrollToBottom)

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.chatbot-page {
  max-width: 820px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 4rem);
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.page-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.2rem; }
.page-sub   { color: var(--text-2); font-size: 0.875rem; }
.ai-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--teal-dim);
  border: 1px solid rgba(0,212,200,0.2);
  color: var(--teal);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
}
.ai-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--teal);
  box-shadow: 0 0 6px var(--teal);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Chat window */
.chat-window {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Bubbles */
.bubble-row {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}
.bubble-row--user {
  flex-direction: row-reverse;
}
.ai-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--teal), #005d85);
  color: #0A0F1E;
  font-size: 0.6rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bubble {
  max-width: 70%;
  padding: 0.85rem 1.1rem;
  border-radius: 16px;
  position: relative;
}
.bubble--ai {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}
.bubble--user {
  background: var(--teal);
  color: #0A0F1E;
  border-bottom-right-radius: 4px;
}
.bubble-text { font-size: 0.9rem; line-height: 1.55; margin-bottom: 0.3rem; }
.bubble--user .bubble-text { color: #0A0F1E; }
.bubble-ts {
  font-size: 0.65rem;
  color: var(--text-3);
  display: block;
  margin-top: 0.2rem;
}
.bubble--user .bubble-ts { color: rgba(10,15,30,0.55); text-align: right; }

/* Suggested split */
.suggested-split {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}
.suggested-title { font-size: 0.75rem; color: var(--text-3); margin-bottom: 0.5rem; }
.split-chips {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.split-chip {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  border: 1px solid;
}
.split-chip.save   { color: #00D4C8; border-color: rgba(0,212,200,0.3); background: rgba(0,212,200,0.1); }
.split-chip.invest { color: #F5C842; border-color: rgba(245,200,66,0.3); background: rgba(245,200,66,0.1); }
.split-chip.spend  { color: #A855F7; border-color: rgba(168,85,247,0.3); background: rgba(168,85,247,0.1); }
.apply-btn { font-size: 0.78rem; padding: 0.4rem 0.9rem; min-width: 130px; justify-content: center; }
.apply-spinner {
  display: inline-block;
  width: 12px; height: 12px;
  border: 2px solid rgba(0,212,200,0.3);
  border-top-color: var(--teal);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Typing dots */
.typing-dots {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 0.2rem 0;
}
.typing-dots span {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--text-3);
  animation: bounce 1.2s ease-in-out infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

/* Input */
.chat-input-bar { margin-bottom: 0.75rem; }
.chat-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.65rem 0.65rem 1.1rem;
}
.chat-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 0.9rem;
  padding: 0;
}
.chat-input::placeholder { color: var(--text-3); }
.chat-input:disabled { opacity: 0.5; }
.send-btn {
  width: 38px; height: 38px;
  border-radius: 8px;
  background: var(--teal);
  color: #0A0F1E;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--tr);
}
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.send-btn:not(:disabled):hover { background: #00ece4; transform: scale(1.05); }

/* Quick prompts */
.quick-prompts {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.quick-btn {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-2);
  font-size: 0.78rem;
  padding: 0.4rem 0.85rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all var(--tr);
}
.quick-btn:hover:not(:disabled) {
  border-color: var(--teal);
  color: var(--teal);
  background: var(--teal-dim);
}
.quick-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 768px) {
  .chatbot-page { height: auto; }
  .chat-window  { min-height: 400px; }
  .bubble       { max-width: 88%; }
}
</style>
