<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auditApi, type ReviewTask } from '@/api/audit'
import { getElMessage, getElMessageBox } from '@shared/child/element-plus'

const route = useRoute()
const router = useRouter()
const channelId = computed(() => route.params.channelId as string)
const taskId = computed(() => route.params.taskId as string)

const loading = ref(false)
const acting = ref(false)
const task = ref<ReviewTask | null>(null)
const rejectReason = ref('')
let lockTimer: ReturnType<typeof setTimeout> | null = null

const reviewPath = computed(() => {
  const line = task.value?.businessLine ?? task.value?.hubDomain ?? 'article'
  return line === 'comment' ? '/audit/comment' : '/audit/article'
})
const businessLine = computed(
  () => task.value?.businessLine ?? task.value?.hubDomain ?? 'article',
)
const articleLink = computed(() => task.value?.previewUrl || task.value?.articleUrl || '')
const isComment = computed(() => task.value?.contentType === 'comment')

const actionLabel: Record<string, string> = {
  approve: '通过',
  reject: '驳回',
  cancel: '取消审核',
}

function formatAction(action: string) {
  return actionLabel[action] ?? action
}

function clearLockTimer() {
  if (lockTimer) {
    clearTimeout(lockTimer)
    lockTimer = null
  }
}

function scheduleLockTimer(expiresAt: string | null | undefined) {
  clearLockTimer()
  if (!expiresAt) return
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) {
    onLockExpired()
    return
  }
  lockTimer = setTimeout(onLockExpired, ms)
}

async function onLockExpired() {
  clearLockTimer()
  await getElMessageBox().alert('审核占用已超时（300 秒），请重新从通道进入', '占用超时', {
    confirmButtonText: '返回工作台',
    type: 'warning',
  })
  router.replace(reviewPath.value)
}

async function load() {
  loading.value = true
  try {
    task.value = await auditApi.getWorkspace(taskId.value, channelId.value)
    scheduleLockTimer(task.value.lockExpiresAt)
  } catch (err: unknown) {
    const code = (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data
      ?.error?.code
    if (code === 'LOCK_EXPIRED' || code === 'LOCKED_BY_OTHER') {
      await getElMessageBox().alert(
        code === 'LOCK_EXPIRED' ? '审核占用已超时' : '该审核项已被他人占用',
        '无法继续',
        { type: 'warning' },
      )
      router.replace(reviewPath.value)
    }
  } finally {
    loading.value = false
  }
}

async function cancelReview() {
  acting.value = true
  try {
    await auditApi.cancel(taskId.value)
    router.replace(reviewPath.value)
  } finally {
    acting.value = false
  }
}

async function complete() {
  acting.value = true
  try {
    await auditApi.complete(taskId.value)
    getElMessage().success('已完成')
    router.replace(reviewPath.value)
  } finally {
    acting.value = false
  }
}

async function completeNext() {
  acting.value = true
  try {
    const res = await auditApi.completeNext(taskId.value, channelId.value, businessLine.value)
    getElMessage().success('已完成')
    clearLockTimer()
    if (res.hasNext && res.nextTaskId) {
      router.replace(`/audit/workspace/${channelId.value}/${res.nextTaskId}`)
    } else {
      router.replace(reviewPath.value)
    }
  } finally {
    acting.value = false
  }
}

async function reject() {
  if (!rejectReason.value.trim()) {
    getElMessage().warning('驳回须填写操作理由')
    return
  }
  await getElMessageBox().confirm('确认驳回该内容？', '驳回')
  acting.value = true
  try {
    await auditApi.reject(taskId.value, rejectReason.value.trim())
    getElMessage().success('已驳回')
    router.replace(reviewPath.value)
  } finally {
    acting.value = false
  }
}

function goBack() {
  cancelReview()
}

watch(() => route.params.taskId, load, { immediate: true })
onBeforeUnmount(clearLockTimer)
</script>

<template>
  <div v-loading="loading" class="page-card workspace">
    <el-button text @click="goBack">← 返回{{ businessLine === 'comment' ? '评论' : '文章' }}审核</el-button>

    <template v-if="task">
      <div class="head">
        <h3 v-if="isComment">评论审核</h3>
        <h3 v-else>
          <a v-if="articleLink" :href="articleLink" target="_blank" rel="noopener" class="title-link">
            {{ task.articleTitle || '未命名文章' }}
          </a>
          <span v-else>{{ task.articleTitle || '未命名文章' }}</span>
        </h3>
      </div>

      <el-descriptions :column="2" border size="small" class="meta">
        <el-descriptions-item label="类型">
          {{ isComment ? '评论' : '文章' }}
        </el-descriptions-item>
        <el-descriptions-item label="文章 ID">{{ task.articleId }}</el-descriptions-item>
        <el-descriptions-item label="作者">{{ task.authorName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="官职">{{ task.authorTitle || '—' }}</el-descriptions-item>
        <el-descriptions-item label="时间" :span="2">
          {{ task.contentAt ? new Date(task.contentAt).toLocaleString() : '—' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="isComment" label="评论内容" :span="2">
          {{ task.commentContent }}
        </el-descriptions-item>
        <el-descriptions-item label="命中通道" :span="2">
          <el-tag v-for="c in task.channels" :key="c.id" size="small" style="margin-right: 4px">
            {{ c.name }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <ul v-if="task.hits?.length" class="hits">
        <li v-for="(h, i) in task.hits" :key="i">
          <strong>{{ h.channelName }}</strong> · {{ h.keyword }}
          <span class="snippet">「{{ h.snippet }}」</span>
        </li>
      </ul>

      <el-card v-if="task.actions?.length" shadow="never" class="action-log">
        <template #header>审核操作记录</template>
        <el-timeline>
          <el-timeline-item
            v-for="a in task.actions"
            :key="a.id"
            :timestamp="new Date(a.createdAt).toLocaleString()"
          >
            <strong>{{ a.actorName }}</strong>
            <span v-if="a.actorTitle">（{{ a.actorTitle }}）</span>
            {{ formatAction(a.action) }}
            <span v-if="a.reason" class="reason">理由：{{ a.reason }}</span>
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <div v-if="!isComment && articleLink" class="preview-wrap">
        <iframe :src="articleLink" class="preview-frame" title="文章预览" />
      </div>

      <div class="reject-box">
        <el-input
          v-model="rejectReason"
          type="textarea"
          :rows="2"
          placeholder="驳回理由（驳回时必填）"
        />
      </div>

      <div class="actions">
        <el-button type="primary" :loading="acting" @click="complete">完成</el-button>
        <el-button :loading="acting" @click="cancelReview">取消</el-button>
        <el-button type="success" :loading="acting" @click="completeNext">完成并审核下一项</el-button>
        <el-button type="danger" :loading="acting" @click="reject">驳回</el-button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.workspace {
  .title-link {
    color: $primary-color;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .meta {
    margin: 16px 0;
  }

  .hits {
    margin: 0 0 16px;
    padding-left: 18px;
    color: #606266;

    .snippet {
      color: #909399;
    }
  }

  .action-log {
    margin-bottom: 16px;

    .reason {
      color: #909399;
      margin-left: 8px;
    }
  }

  .preview-wrap {
    margin-bottom: 16px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    overflow: hidden;
  }

  .preview-frame {
    width: 100%;
    min-height: 360px;
    border: none;
  }

  .reject-box {
    margin-bottom: 12px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
