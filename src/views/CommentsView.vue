<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { commentsApi, type PendingCommentItem } from '@/api/comments'
import { getElMessage, getElMessageBox } from '@shared/child/element-plus'
import MobileDataCards from '@shared/components/MobileDataCards.vue'

const loading = ref(false)
const list = ref<PendingCommentItem[]>([])

async function load() {
  loading.value = true
  try {
    list.value = await commentsApi.listPending()
  } finally {
    loading.value = false
  }
}

async function approve(row: PendingCommentItem) {
  await commentsApi.approve(row.id)
  getElMessage().success('评论已通过')
  await load()
}

async function reject(row: PendingCommentItem) {
  const { value } = await getElMessageBox().prompt('驳回原因（可选）', '驳回评论', {
    confirmButtonText: '驳回',
    cancelButtonText: '取消',
    inputPlaceholder: '未填写则使用默认文案',
  })
  await commentsApi.reject(row.id, value || undefined)
  getElMessage().success('评论已驳回')
  await load()
}

onMounted(load)
</script>

<template>
  <div class="page-card">
    <div class="page-toolbar">
      <h3>评论审核</h3>
      <el-button @click="load">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="list" stripe class="desktop-only">
      <el-table-column prop="articleTitle" label="文章" min-width="140" show-overflow-tooltip />
      <el-table-column prop="authorName" label="作者" width="100" />
      <el-table-column prop="content" label="内容" min-width="220" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="时间" width="170">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="success" @click="approve(row as PendingCommentItem)">通过</el-button>
          <el-button link type="danger" @click="reject(row as PendingCommentItem)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>

    <MobileDataCards :items="list" :loading="loading" empty-text="暂无待审评论">
      <template #card="{ item }">
        <div class="mobile-data-card__title">{{ item.articleTitle }}</div>
        <div class="mobile-data-card__row">
          <span class="mobile-data-card__label">作者</span>
          <span class="mobile-data-card__value">{{ item.authorName }}</span>
        </div>
        <div class="mobile-data-card__row">
          <span class="mobile-data-card__label">内容</span>
          <span class="mobile-data-card__value">{{ item.content }}</span>
        </div>
      </template>
      <template #actions="{ item }">
        <el-button size="small" type="success" @click="approve(item)">通过</el-button>
        <el-button size="small" type="danger" @click="reject(item)">驳回</el-button>
      </template>
    </MobileDataCards>
  </div>
</template>
