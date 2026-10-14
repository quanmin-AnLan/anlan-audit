<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auditApi } from '@/api/audit'

type AuditMessage = {
  id: string
  senderName: string
  body: string | null
  withdrawn: boolean
  createdAt: string
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const loadingEarlier = ref(false)
const title = ref('')
const hasMore = ref(false)
const messages = ref<AuditMessage[]>([])

async function load(before?: string) {
  const earlier = !!before
  if (earlier) loadingEarlier.value = true
  else loading.value = true
  try {
    const kind = route.params.kind as string
    const id = String(route.params.id)
    const data =
      kind === 'group'
        ? await auditApi.getGroupConversation(id, before)
        : await auditApi.getDmConversation(id, before)
    title.value = data.sceneLabel
    hasMore.value = !!data.hasMore
    const page = data.messages ?? []
    if (earlier) {
      const seen = new Set(messages.value.map((item) => item.id))
      messages.value = [...page.filter((item) => !seen.has(item.id)), ...messages.value]
    } else {
      messages.value = page
    }
  } finally {
    loading.value = false
    loadingEarlier.value = false
  }
}

function loadEarlier() {
  const cursor = messages.value[0]?.id
  if (!cursor || !hasMore.value || loadingEarlier.value) return
  void load(cursor)
}

onMounted(() => void load())
</script>

<template>
  <div v-loading="loading" class="page-card conv-audit">
    <el-button text @click="router.push('/audit/search')">← 返回审核搜索</el-button>
    <h3>{{ title || '对话记录' }}</h3>
    <p class="hint">仅供审核查阅。默认显示最近 50 条，可继续查看更早的消息。</p>
    <el-button v-if="hasMore" :loading="loadingEarlier" text type="primary" @click="loadEarlier">
      加载更早
    </el-button>
    <div class="messages">
      <div v-for="msg in messages" :key="msg.id" class="inset-panel msg-row">
        <div class="msg-head">
          <strong>{{ msg.senderName }}</strong>
          <span>{{ new Date(msg.createdAt).toLocaleString() }}</span>
        </div>
        <p v-if="msg.withdrawn" class="withdrawn">消息已违规撤回</p>
        <p v-else>{{ msg.body }}</p>
      </div>
      <el-empty v-if="!loading && !messages.length" description="暂无消息" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.conv-audit h3 {
  margin: 8px 0;
}

.hint {
  color: var(--anlan-text-secondary, $text-secondary);
  font-size: 13px;
  margin-bottom: 16px;
}

.msg-row {
  margin-bottom: 10px;
}

.msg-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 6px;

  span {
    color: var(--anlan-text-secondary, $text-secondary);
  }
}

.withdrawn {
  color: var(--anlan-text-secondary, $text-secondary);
  font-size: 13px;
}

.msg-row p {
  margin: 0;
  white-space: pre-wrap;
}
</style>
