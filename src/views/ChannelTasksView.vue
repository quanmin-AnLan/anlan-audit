<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auditApi, type ReviewTask } from '@/api/audit'
import MobileDataCards from '@shared/components/MobileDataCards.vue'

const route = useRoute()
const router = useRouter()
const channelId = route.params.channelId as string
const loading = ref(false)
const tasks = ref<ReviewTask[]>([])

async function load() {
  loading.value = true
  try {
    tasks.value = await auditApi.listChannelTasks(channelId)
  } finally {
    loading.value = false
  }
}

function openTask(taskId: string) {
  router.push(`/audit/tasks/${taskId}`)
}

onMounted(load)
</script>

<template>
  <div class="page-card">
    <el-button text @click="router.push('/audit/queues')">← 返回工作台</el-button>
    <h3 class="page-subtitle">通道待审列表</h3>

    <el-table
      v-loading="loading"
      :data="tasks"
      stripe
      class="desktop-only"
      @row-click="(row) => openTask((row as ReviewTask).id)"
    >
      <el-table-column prop="articleTitle" label="标题" min-width="200">
        <template #default="{ row }">{{ (row as ReviewTask).articleTitle || '（无标题）' }}</template>
      </el-table-column>
      <el-table-column label="命中关键词" min-width="180">
        <template #default="{ row }">
          <el-tag v-for="h in (row as ReviewTask).hits.slice(0, 3)" :key="h.keyword + h.channelId" size="small" class="tag">
            {{ h.keyword }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="submittedAt" label="提交时间" width="170">
        <template #default="{ row }">{{ new Date((row as ReviewTask).submittedAt).toLocaleString() }}</template>
      </el-table-column>
    </el-table>

    <MobileDataCards
      :items="tasks"
      :loading="loading"
      clickable
      empty-text="暂无待审任务"
      @item-click="(item) => openTask(item.id)"
    >
      <template #card="{ item }">
        <div class="mobile-data-card__title">{{ item.articleTitle || '（无标题）' }}</div>
        <div class="mobile-data-card__row">
          <span class="mobile-data-card__label">关键词</span>
          <span class="mobile-data-card__value mobile-data-card__tags">
            <el-tag v-for="h in item.hits.slice(0, 3)" :key="h.keyword + h.channelId" size="small">
              {{ h.keyword }}
            </el-tag>
          </span>
        </div>
        <div class="mobile-data-card__row">
          <span class="mobile-data-card__label">提交</span>
          <span class="mobile-data-card__value">{{ new Date(item.submittedAt).toLocaleString() }}</span>
        </div>
      </template>
    </MobileDataCards>
  </div>
</template>

<style scoped lang="scss">
.page-subtitle {
  margin: 12px 0 16px;
}

.tag {
  margin-right: 4px;
  margin-bottom: 4px;
}
</style>
