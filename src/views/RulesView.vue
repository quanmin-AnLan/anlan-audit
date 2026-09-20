<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auditApi, type KeywordRule } from '@/api/audit'
import { getElMessage, getElMessageBox } from '@shared/child/element-plus'
import MobileDataCards from '@shared/components/MobileDataCards.vue'

const route = useRoute()
const router = useRouter()
const channelId = route.params.channelId as string
const loading = ref(false)
const rules = ref<KeywordRule[]>([])
const keyword = ref('')

async function load() {
  loading.value = true
  try {
    rules.value = await auditApi.listRules(channelId)
  } finally {
    loading.value = false
  }
}

async function addRule() {
  if (!keyword.value.trim()) return
  await auditApi.createRule(channelId, { keyword: keyword.value.trim(), matchScope: 'ALL' })
  keyword.value = ''
  getElMessage().success('已添加')
  await load()
}

async function removeRule(ruleId: string) {
  await getElMessageBox().confirm('删除该关键词规则？', '确认')
  await auditApi.deleteRule(ruleId)
  getElMessage().success('已删除')
  await load()
}

onMounted(load)
</script>

<template>
  <div class="page-card">
    <el-button text @click="router.push('/audit/channels')">← 返回通道列表</el-button>
    <h3 class="page-subtitle">关键词规则</h3>
    <div class="add-row">
      <el-input v-model="keyword" placeholder="输入关键词" @keyup.enter="addRule" />
      <el-button type="primary" @click="addRule">添加</el-button>
    </div>

    <el-table v-loading="loading" :data="rules" stripe class="desktop-only">
      <el-table-column prop="keyword" label="关键词" />
      <el-table-column prop="matchScope" label="范围" width="100" />
      <el-table-column prop="matchType" label="匹配" width="100" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button link type="danger" @click="removeRule((row as KeywordRule).id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <MobileDataCards :items="rules" :loading="loading" empty-text="暂无规则">
      <template #card="{ item }">
        <div class="mobile-data-card__title">{{ item.keyword }}</div>
        <div class="mobile-data-card__row">
          <span class="mobile-data-card__label">范围</span>
          <span class="mobile-data-card__value">{{ item.matchScope }}</span>
        </div>
        <div class="mobile-data-card__row">
          <span class="mobile-data-card__label">匹配</span>
          <span class="mobile-data-card__value">{{ item.matchType }}</span>
        </div>
      </template>
      <template #actions="{ item }">
        <el-button size="small" type="danger" plain @click="removeRule(item.id)">删除</el-button>
      </template>
    </MobileDataCards>
  </div>
</template>

<style scoped lang="scss">
.page-subtitle {
  margin: 12px 0 16px;
}

.add-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;

    .el-input {
      max-width: 320px;
    }
  }
}
</style>
