<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auditApi, type ReviewBoardData } from '@/api/audit'
import { getElMessage } from '@shared/child/element-plus'
import { usePermission } from '@shared/child/permission'

const route = useRoute()
const router = useRouter()
const { hasPermission } = usePermission()
const loading = ref(false)
const board = ref<ReviewBoardData | null>(null)

const businessLine = computed(() => (route.meta.businessLine as string) ?? 'article')
const lineLabel = computed(() => (businessLine.value === 'comment' ? '评论' : '文章'))
const canArticle = computed(() => hasPermission('article:review:read'))
const canComment = computed(() => hasPermission('article:comment:moderate'))

function gradeTagType(grade: number) {
  if (grade >= 3) return 'danger'
  if (grade >= 2) return 'warning'
  return 'info'
}

function businessLineLabel(line: string | null) {
  if (line === 'article') return '文章'
  if (line === 'comment') return '评论'
  return null
}

async function load() {
  loading.value = true
  try {
    board.value = await auditApi.getReviewBoard(businessLine.value)
  } finally {
    loading.value = false
  }
}

async function openChannel(channelId: string) {
  loading.value = true
  try {
    const { taskId } = await auditApi.claimTask(channelId, businessLine.value)
    router.push(`/audit/workspace/${channelId}/${taskId}`)
  } catch {
    getElMessage().info('该通道暂无待审项')
  } finally {
    loading.value = false
  }
}

function goSearch() {
  router.push('/audit/search')
}

function switchLine(target: string) {
  if (target !== businessLine.value) {
    router.push(target === 'comment' ? '/audit/comment' : '/audit/article')
  }
}

watch(businessLine, load, { immediate: true })
onMounted(load)
</script>

<template>
  <div v-loading="loading" class="page-card hub-page">
    <div class="page-toolbar">
      <div>
        <p class="level-hint">业务线</p>
        <h3>{{ lineLabel }}审核</h3>
      </div>
      <div class="page-toolbar__actions">
        <el-button-group v-if="canArticle || canComment">
          <el-button
            v-if="canArticle"
            :type="businessLine === 'article' ? 'primary' : 'default'"
            @click="switchLine('article')"
          >
            文章
          </el-button>
          <el-button
            v-if="canComment"
            :type="businessLine === 'comment' ? 'primary' : 'default'"
            @click="switchLine('comment')"
          >
            评论
          </el-button>
        </el-button-group>
        <el-button @click="goSearch">搜索</el-button>
        <el-button @click="router.push('/audit/channels')">通道配置</el-button>
        <el-button @click="load">刷新</el-button>
      </div>
    </div>

    <template v-for="group in board?.groups ?? []" :key="group.id">
      <el-card shadow="never" class="group-card">
        <template #header>
          <div class="group-header">
            <el-tag size="small" type="warning" effect="plain">一级通道</el-tag>
            <el-tag size="small" :type="gradeTagType(group.grade)" effect="dark">
              L{{ group.grade }}
            </el-tag>
            <span class="group-name">{{ group.name }}</span>
            <el-tag
              v-if="businessLineLabel(group.businessLine)"
              size="small"
              type="info"
              effect="plain"
            >
              {{ businessLineLabel(group.businessLine) }}
            </el-tag>
          </div>
        </template>

        <div v-if="group.channels.length" class="leaf-list">
          <div
            v-for="ch in group.channels"
            :key="ch.id"
            class="leaf-row"
            @click="openChannel(ch.id)"
          >
            <div class="leaf-main">
              <el-tag size="small" type="info" effect="plain">二级</el-tag>
              <span class="leaf-name">{{ ch.name }}</span>
            </div>
            <el-badge :value="ch.pendingCount" :max="999" :hidden="ch.pendingCount === 0" />
          </div>
        </div>
        <el-empty v-else description="该一级通道下暂无二级通道" :image-size="48" />
      </el-card>
    </template>

    <el-empty v-if="!loading && !(board?.groups?.length)" description="暂无可用一级通道" />
  </div>
</template>

<style scoped lang="scss">
.hub-page {
  .level-hint {
    margin: 0 0 4px;
    font-size: 12px;
    color: #909399;
  }

  h3 {
    margin: 0;
  }

  .group-card {
    margin-bottom: 16px;

    :deep(.el-card__header) {
      padding: 12px 16px;
    }
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .group-name {
      font-size: 15px;
      font-weight: 600;
    }
  }

  .leaf-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .leaf-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:hover {
      border-color: $primary-color;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }

  .leaf-main {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .leaf-name {
    font-size: 15px;
  }
}
</style>
