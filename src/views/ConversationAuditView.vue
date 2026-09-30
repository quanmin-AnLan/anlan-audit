<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auditApi } from '@/api/audit'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const title = ref('')
const messages = ref<
  Array<{
    id: string
    senderName: string
    body: string | null
    withdrawn: boolean
    createdAt: string
  }>
>([])

async function load() {
  loading.value = true
  try {
    const kind = route.params.kind as string
    const id = String(route.params.id)
    const data =
      kind === 'group'
        ? await auditApi.getGroupConversation(id)
        : await auditApi.getDmConversation(id)
    title.value = data.sceneLabel
    messages.value = data.messages ?? []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div v-loading="loading" class="page-card conv-audit">
    <el-button text @click="router.push('/audit/search')">← 返回审核搜索</el-button>
    <h3>{{ title || '对话记录' }}</h3>
    <p class="hint">仅供审核查阅，展示当前保留期内的消息。</p>
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
  color: $text-secondary;
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
    color: $text-secondary;
  }
}

.withdrawn {
  color: $text-secondary;
  font-size: 13px;
}

.msg-row p {
  margin: 0;
  white-space: pre-wrap;
}
</style>
