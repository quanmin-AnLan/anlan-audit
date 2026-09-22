<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { auditApi, type AuditChannel } from '@/api/audit'
import { getElMessage } from '@shared/child/element-plus'
import { useBreakpoint } from '@shared/use-breakpoint'
import MobileDataCards from '@shared/components/MobileDataCards.vue'

const router = useRouter()
const loading = ref(false)
const list = ref<AuditChannel[]>([])
const dialogVisible = ref(false)
const form = reactive({ code: '', name: '', description: '' })
const { isMobile } = useBreakpoint()

async function load() {
  loading.value = true
  try {
    list.value = await auditApi.listChannels()
  } finally {
    loading.value = false
  }
}

async function create() {
  await auditApi.createChannel({ ...form })
  getElMessage().success('已创建')
  dialogVisible.value = false
  form.code = ''
  form.name = ''
  form.description = ''
  await load()
}

function openRules(channelId: string) {
  router.push(`/audit/channels/${channelId}/rules`)
}

onMounted(load)
</script>

<template>
  <div class="page-card">
    <div class="page-toolbar">
      <h3>审核通道</h3>
      <div class="page-toolbar__actions">
        <el-button @click="router.push('/audit/hub/article')">工作台</el-button>
        <el-button type="primary" @click="dialogVisible = true">新建通道</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="list" stripe class="desktop-only">
      <el-table-column prop="name" label="三级通道" />
      <el-table-column prop="groupName" label="所属二级" width="120" />
      <el-table-column prop="domain" label="一级" width="80">
        <template #default="{ row }">
          {{ (row as AuditChannel).domain === 'COMMENT' ? '评论' : '文章' }}
        </template>
      </el-table-column>
      <el-table-column prop="code" label="编码" width="140" />
      <el-table-column prop="enabled" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="(row as AuditChannel).enabled ? 'success' : 'info'" size="small">
            {{ (row as AuditChannel).enabled ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openRules((row as AuditChannel).id)">关键词规则</el-button>
        </template>
      </el-table-column>
    </el-table>

    <MobileDataCards :items="list" :loading="loading" empty-text="暂无通道">
      <template #card="{ item }">
        <div class="mobile-data-card__title">{{ item.name }}</div>
        <div class="mobile-data-card__row">
          <span class="mobile-data-card__label">编码</span>
          <span class="mobile-data-card__value">{{ item.code }}</span>
        </div>
        <div class="mobile-data-card__row">
          <span class="mobile-data-card__label">状态</span>
          <span class="mobile-data-card__value">
            <el-tag :type="item.enabled ? 'success' : 'info'" size="small">
              {{ item.enabled ? '启用' : '停用' }}
            </el-tag>
          </span>
        </div>
      </template>
      <template #actions="{ item }">
        <el-button size="small" type="primary" plain @click="openRules(item.id)">关键词规则</el-button>
      </template>
    </MobileDataCards>

    <el-dialog
      v-model="dialogVisible"
      title="新建通道"
      :width="isMobile ? undefined : '420px'"
      :fullscreen="isMobile"
      class="anlan-responsive-dialog"
    >
      <el-form label-width="72px" class="anlan-form-mobile">
        <el-form-item label="编码"><el-input v-model="form.code" placeholder="如 politics" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="form.name" placeholder="如 政治敏感" /></el-form-item>
        <el-form-item label="说明"><el-input v-model="form.description" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="create">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>
