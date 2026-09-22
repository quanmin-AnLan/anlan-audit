<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { auditApi, type ReviewTask } from '@/api/audit'
import { getElMessage, getElMessageBox } from '@shared/child/element-plus'
import MobileDataCards from '@shared/components/MobileDataCards.vue'

const router = useRouter()
const loading = ref(false)
const list = ref<ReviewTask[]>([])
const total = ref(0)

const query = reactive({
  articleId: '',
  authorId: '',
  articleTitle: '',
  commentContent: '',
  authorName: '',
  status: '',
  contentType: '',
  from: '',
  to: '',
  page: 1,
  pageSize: 20,
})

const statusLabel: Record<string, string> = {
  pending: '待审',
  approved: '已通过',
  rejected: '已驳回',
}

async function load() {
  loading.value = true
  try {
    const res = await auditApi.search({
      articleId: query.articleId || undefined,
      authorId: query.authorId || undefined,
      articleTitle: query.articleTitle || undefined,
      commentContent: query.commentContent || undefined,
      authorName: query.authorName || undefined,
      status: query.status || undefined,
      contentType: query.contentType || undefined,
      from: query.from || undefined,
      to: query.to || undefined,
      page: query.page,
      pageSize: query.pageSize,
    })
    list.value = res.items
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function reset() {
  Object.assign(query, {
    articleId: '',
    authorId: '',
    articleTitle: '',
    commentContent: '',
    authorName: '',
    status: '',
    contentType: '',
    from: '',
    to: '',
    page: 1,
  })
  load()
}

async function changeVerdict(row: ReviewTask, action: 'approve' | 'reject') {
  let reason: string | undefined
  if (action === 'reject') {
    const { value } = await getElMessageBox().prompt('请填写驳回理由', '改判驳回', {
      confirmButtonText: '确认',
      inputPattern: /.+/,
      inputErrorMessage: '理由不能为空',
    })
    reason = value
  } else if (row.status === 'rejected') {
    await getElMessageBox().confirm('将该内容改判为通过？', '改判通过')
  } else {
    return
  }

  await auditApi.changeVerdict(row.id, action, reason)
  getElMessage().success('已更新')
  await load()
}

onMounted(load)
</script>

<template>
  <div class="page-card">
    <div class="page-toolbar">
      <h3>审核搜索</h3>
      <el-button @click="router.push('/audit/hub/article')">返回工作台</el-button>
    </div>

    <el-form :inline="true" class="search-form" @submit.prevent="load">
      <el-form-item label="文章 ID">
        <el-input v-model="query.articleId" clearable placeholder="精确" />
      </el-form-item>
      <el-form-item label="作者 ID">
        <el-input v-model="query.authorId" clearable placeholder="精确" />
      </el-form-item>
      <el-form-item label="文章标题">
        <el-input v-model="query.articleTitle" clearable placeholder="模糊" />
      </el-form-item>
      <el-form-item label="评论内容">
        <el-input v-model="query.commentContent" clearable placeholder="模糊" />
      </el-form-item>
      <el-form-item label="作者名">
        <el-input v-model="query.authorName" clearable placeholder="模糊" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="query.contentType" clearable placeholder="全部" style="width: 120px">
          <el-option label="文章" value="ARTICLE" />
          <el-option label="评论" value="COMMENT" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width: 120px">
          <el-option label="待审" value="PENDING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="已驳回" value="REJECTED" />
        </el-select>
      </el-form-item>
      <el-form-item label="起止时间">
        <el-date-picker
          v-model="query.from"
          type="datetime"
          placeholder="开始"
          value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          style="width: 180px"
        />
        <span class="range-sep">—</span>
        <el-date-picker
          v-model="query.to"
          type="datetime"
          placeholder="结束"
          value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          style="width: 180px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">搜索</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" stripe class="desktop-only">
      <el-table-column prop="contentType" label="类型" width="72">
        <template #default="{ row }">{{ row.contentType === 'comment' ? '评论' : '文章' }}</template>
      </el-table-column>
      <el-table-column prop="articleTitle" label="文章" min-width="140" show-overflow-tooltip />
      <el-table-column prop="commentContent" label="评论" min-width="120" show-overflow-tooltip />
      <el-table-column prop="authorName" label="作者" width="100" />
      <el-table-column prop="status" label="状态" width="88">
        <template #default="{ row }">{{ statusLabel[row.status] ?? row.status }}</template>
      </el-table-column>
      <el-table-column prop="submittedAt" label="提交时间" width="170">
        <template #default="{ row }">{{ new Date(row.submittedAt).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'approved'"
            link
            type="danger"
            @click="changeVerdict(row as ReviewTask, 'reject')"
          >
            改判驳回
          </el-button>
          <el-button
            v-if="row.status === 'rejected'"
            link
            type="success"
            @click="changeVerdict(row as ReviewTask, 'approve')"
          >
            改判通过
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <MobileDataCards :items="list" :loading="loading" empty-text="暂无结果">
      <template #card="{ item }">
        <div>{{ item.contentType === 'comment' ? '评论' : '文章' }} · {{ statusLabel[item.status] }}</div>
        <div>{{ item.articleTitle }}</div>
        <div v-if="item.commentContent">{{ item.commentContent }}</div>
      </template>
      <template #actions="{ item }">
        <el-button
          v-if="item.status === 'approved'"
          size="small"
          type="danger"
          @click="changeVerdict(item as ReviewTask, 'reject')"
        >
          改判驳回
        </el-button>
        <el-button
          v-if="item.status === 'rejected'"
          size="small"
          type="success"
          @click="changeVerdict(item as ReviewTask, 'approve')"
        >
          改判通过
        </el-button>
      </template>
    </MobileDataCards>

    <el-pagination
      v-if="total > query.pageSize"
      class="pager"
      layout="prev, pager, next"
      :total="total"
      :page-size="query.pageSize"
      :current-page="query.page"
      @current-change="(p: number) => { query.page = p; load() }"
    />
  </div>
</template>

<style scoped lang="scss">
.search-form {
  margin-bottom: 16px;
}

.range-sep {
  margin: 0 8px;
  color: #909399;
}

.pager {
  margin-top: 16px;
  justify-content: flex-end;
}

</style>
