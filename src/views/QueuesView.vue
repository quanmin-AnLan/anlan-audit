<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { auditApi, type QueueItem } from '@/api/audit'

const router = useRouter()
const loading = ref(false)
const queues = ref<QueueItem[]>([])

async function load() {
  loading.value = true
  try {
    queues.value = await auditApi.listQueues()
  } finally {
    loading.value = false
  }
}

function openChannel(channelId: string) {
  router.push(`/audit/queues/${channelId}`)
}

onMounted(load)
</script>

<template>
  <div class="page-card">
    <div class="page-toolbar">
      <h3>审核工作台</h3>
      <div class="page-toolbar__actions">
        <el-button @click="router.push('/audit/comments')">评论审核</el-button>
        <el-button @click="router.push('/audit/channels')">通道配置</el-button>
      </div>
    </div>
    <el-row v-loading="loading" :gutter="16">
      <el-col v-for="q in queues" :key="q.channelId" :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="queue-card" @click="openChannel(q.channelId)">
          <div class="name">{{ q.name }}</div>
          <div class="count">{{ q.pendingCount }}</div>
          <div class="hint">待审文章</div>
        </el-card>
      </el-col>
    </el-row>
    <el-empty v-if="!loading && queues.length === 0" description="暂无启用通道" />
  </div>
</template>

<style scoped lang="scss">
.queue-card {
  cursor: pointer;
  margin-bottom: 16px;
  text-align: center;

  .name {
    font-size: 16px;
    margin-bottom: 8px;
  }

  .count {
    font-size: 32px;
    font-weight: 600;
    color: #e6a23c;
  }

  .hint {
    color: #909399;
    font-size: 13px;
  }
}
</style>
