<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auditApi, type ReviewTask } from '@/api/audit'
import { getElMessage, getElMessageBox } from '@shared/child/element-plus'

const route = useRoute()
const router = useRouter()
const taskId = route.params.taskId as string
const loading = ref(false)
const acting = ref(false)
const task = ref<ReviewTask | null>(null)
const rejectReason = ref('')

const previewUrl = computed(() => task.value?.previewUrl ?? '')

async function load() {
  loading.value = true
  try {
    task.value = await auditApi.getTask(taskId)
  } finally {
    loading.value = false
  }
}

async function approve() {
  acting.value = true
  try {
    await auditApi.approve(taskId)
    getElMessage().success('已通过，文章已发布')
    router.push('/audit/queues')
  } finally {
    acting.value = false
  }
}

async function reject() {
  if (!rejectReason.value.trim()) {
    getElMessage().warning('请填写内部驳回备注')
    return
  }
  await getElMessageBox().confirm('驳回后文章将退回作者草稿，作者暂不可见备注', '确认驳回')
  acting.value = true
  try {
    await auditApi.reject(taskId, rejectReason.value.trim())
    getElMessage().success('已驳回')
    router.push('/audit/queues')
  } finally {
    acting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div v-loading="loading" class="page-card task-layout">
    <el-button text @click="router.back()">← 返回</el-button>
    <h3>{{ task?.articleTitle || '审核详情' }}</h3>

    <el-row :gutter="16" class="split-layout">
      <el-col :xs="24" :sm="10">
        <el-card shadow="never">
          <template #header>命中信息</template>
          <el-descriptions v-if="task" :column="1" border size="small">
            <el-descriptions-item label="文章 ID">{{ task.articleId }}</el-descriptions-item>
            <el-descriptions-item label="通道">
              <el-tag v-for="c in task.channels" :key="c.id" size="small" style="margin-right: 4px">{{ c.name }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <ul v-if="task?.hits?.length" class="hits">
            <li v-for="(h, i) in task.hits" :key="i">
              <strong>{{ h.channelName }}</strong> · {{ h.keyword }}
              <span class="snippet">「{{ h.snippet }}」</span>
            </li>
          </ul>
          <el-divider />
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="内部驳回备注（作者不可见，供站内信后续使用）" />
          <div class="actions">
            <el-button type="primary" :loading="acting" @click="approve">通过并发布</el-button>
            <el-button type="danger" :loading="acting" @click="reject">驳回退回草稿</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="14">
        <el-card shadow="never" class="preview-card">
          <template #header>文章预览（SSR）</template>
          <iframe v-if="previewUrl" :src="previewUrl" class="preview-frame" title="文章预览" />
          <el-empty v-else description="预览加载中…" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.task-layout h3 { margin: 8px 0 16px; }
.hits { padding-left: 18px; margin: 12px 0; line-height: 1.8; .snippet { color: #909399; } }
.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;

  @media (min-width: 768px) {
    flex-direction: row;
  }

  .el-button {
    margin: 0;
    width: 100%;

    @media (min-width: 768px) {
      width: auto;
    }
  }
}

.preview-card {
  min-height: 360px;

  @media (min-width: 768px) {
    min-height: 520px;
  }
}

.preview-frame {
  width: 100%;
  height: 50vh;
  min-height: 280px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;

  @media (min-width: 768px) {
    height: 480px;
  }
}
</style>
