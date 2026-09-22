<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auditApi, type HubData } from '@/api/audit'
import { getElMessage } from '@shared/child/element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const hub = ref<HubData | null>(null)

const domain = computed(() => route.params.domain as string)
const hubTitle = computed(() => hub.value?.routeName ?? '审核工作台')

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
  <div v-loading="loading" class="page-card">
    <div class="page-toolbar">
      <h3>{{ hubTitle }}</h3>
      <div class="page-toolbar__actions">
        <el-button-group>
          <el-button :type="domain === 'article' ? 'primary' : 'default'" @click="switchDomain('article')">
            文章
          </el-button>
          <el-button :type="domain === 'comment' ? 'primary' : 'default'" @click="switchDomain('comment')">
            评论
          </el-button>
        </el-button-group>
        <el-button @click="goSearch">搜索</el-button>
        <el-button @click="router.push('/audit/channels')">通道配置</el-button>
        <el-button @click="load">刷新</el-button>
      </div>
    </div>

    <template v-for="group in hub?.groups ?? []" :key="group.id">
      <div class="group-block">
        <h4 class="group-title">{{ group.name }}</h4>
        <el-row :gutter="12">
          <el-col
            v-for="ch in group.channels"
            :key="ch.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
          >
            <div class="channel-row" @click="openChannel(ch.id)">
              <span class="channel-name">{{ ch.name }}</span>
              <el-badge :value="ch.pendingCount" :max="999" :hidden="ch.pendingCount === 0" />
            </div>
          </el-col>
        </el-row>
      </div>
    </template>

    <el-empty v-if="!loading && !(hub?.groups?.length)" description="暂无可用通道" />
  </div>
</template>

<style scoped lang="scss">
.group-block {
  margin-bottom: 24px;
}

.group-title {
  margin: 0 0 12px;
  font-size: 15px;
  color: #606266;
}

.channel-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: $primary-color;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .channel-name {
    font-size: 15px;
  }
}
</style>
