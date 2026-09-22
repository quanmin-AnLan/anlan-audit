<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auditApi, type HubData } from '@/api/audit'
import { getElMessage } from '@shared/child/element-plus'
import { usePermission } from '@shared/child/permission'

const route = useRoute()
const router = useRouter()
const { hasPermission } = usePermission()
const loading = ref(false)
const hub = ref<HubData | null>(null)

const domain = computed(() => route.params.domain as string)
const l1Label = computed(() => (domain.value === 'comment' ? '评论' : '文章'))
const canArticle = computed(() => hasPermission('article:review:read'))
const canComment = computed(() => hasPermission('article:comment:moderate'))

async function load() {
  loading.value = true
  try {
    hub.value = await auditApi.getHub(domain.value)
  } finally {
    loading.value = false
  }
}

async function openChannel(channelId: string) {
  loading.value = true
  try {
    const { taskId } = await auditApi.claimTask(channelId)
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

function switchDomain(target: string) {
  if (target !== domain.value) {
    router.push(`/audit/hub/${target}`)
  }
}

watch(domain, load, { immediate: true })
onMounted(load)
</script>

<template>
  <div v-loading="loading" class="page-card hub-page">
    <div class="page-toolbar">
      <div>
        <p class="level-hint">一级通道</p>
        <h3>{{ l1Label }}审核</h3>
      </div>
      <div class="page-toolbar__actions">
        <el-button-group v-if="canArticle || canComment">
          <el-button
            v-if="canArticle"
            :type="domain === 'article' ? 'primary' : 'default'"
            @click="switchDomain('article')"
          >
            文章
          </el-button>
          <el-button
            v-if="canComment"
            :type="domain === 'comment' ? 'primary' : 'default'"
            @click="switchDomain('comment')"
          >
            评论
          </el-button>
        </el-button-group>
        <el-button @click="goSearch">搜索</el-button>
        <el-button @click="router.push('/audit/channels')">通道配置</el-button>
        <el-button @click="load">刷新</el-button>
      </div>
    </div>

    <template v-for="group in hub?.groups ?? []" :key="group.id">
      <el-card shadow="never" class="group-card">
        <template #header>
          <div class="group-header">
            <el-tag size="small" type="warning" effect="plain">二级通道</el-tag>
            <span class="group-name">{{ group.name }}</span>
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
              <el-tag size="small" type="info" effect="plain">三级</el-tag>
              <span class="leaf-name">{{ ch.name }}</span>
            </div>
            <el-badge :value="ch.pendingCount" :max="999" :hidden="ch.pendingCount === 0" />
          </div>
        </div>
        <el-empty v-else description="该二级通道下暂无三级通道" :image-size="48" />
      </el-card>
    </template>

    <el-empty v-if="!loading && !(hub?.groups?.length)" description="暂无可用二级通道" />
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
