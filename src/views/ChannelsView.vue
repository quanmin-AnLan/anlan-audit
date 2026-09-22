<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { auditApi, type AuditChannel, type ChannelLevel } from '@/api/audit'
import { getElMessage } from '@shared/child/element-plus'
import { useBreakpoint } from '@shared/use-breakpoint'
import MobileDataCards from '@shared/components/MobileDataCards.vue'

const router = useRouter()
const loading = ref(false)
const list = ref<AuditChannel[]>([])
const dialogVisible = ref(false)
const form = reactive({
  code: '',
  name: '',
  description: '',
  level: 'SECONDARY' as ChannelLevel,
  parentId: '',
})
const { isMobile } = useBreakpoint()

const primaryOptions = computed(() =>
  list.value.filter((ch) => ch.level === 'PRIMARY' && ch.enabled),
)

const levelLabel = (level: ChannelLevel) => (level === 'PRIMARY' ? '一级' : '二级')

async function load() {
  loading.value = true
  try {
    list.value = await auditApi.listChannels()
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.code = ''
  form.name = ''
  form.description = ''
  form.level = 'SECONDARY'
  form.parentId = primaryOptions.value[0]?.id ?? ''
  dialogVisible.value = true
}

async function create() {
  if (form.level === 'SECONDARY' && !form.parentId) {
    getElMessage().warning('请选择所属一级通道')
    return
  }
  await auditApi.createChannel({
    code: form.code,
    name: form.name,
    description: form.description || undefined,
    level: form.level,
    parentId: form.level === 'SECONDARY' ? form.parentId : undefined,
  })
  getElMessage().success('已创建')
  dialogVisible.value = false
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
        <el-button @click="router.push('/audit/article')">文章审核</el-button>
        <el-button type="primary" @click="openCreate">新建通道</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="list" stripe class="desktop-only" row-key="id">
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column label="层级" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="(row as AuditChannel).level === 'PRIMARY' ? 'warning' : 'info'">
            {{ levelLabel((row as AuditChannel).level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="parentName" label="所属一级" width="140">
        <template #default="{ row }">
          {{ (row as AuditChannel).parentName || '—' }}
        </template>
      </el-table-column>
      <el-table-column prop="code" label="编码" width="160" />
      <el-table-column prop="enabled" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="(row as AuditChannel).enabled ? 'success' : 'info'" size="small">
            {{ (row as AuditChannel).enabled ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button
            v-if="(row as AuditChannel).level === 'SECONDARY'"
            link
            type="primary"
            @click="openRules((row as AuditChannel).id)"
          >
            关键词规则
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <MobileDataCards :items="list" :loading="loading" empty-text="暂无通道">
      <template #card="{ item }">
        <div class="mobile-data-card__title">{{ item.name }}</div>
        <div class="mobile-data-card__row">
          <span class="mobile-data-card__label">层级</span>
          <span class="mobile-data-card__value">{{ levelLabel(item.level) }}</span>
        </div>
        <div v-if="item.parentName" class="mobile-data-card__row">
          <span class="mobile-data-card__label">所属一级</span>
          <span class="mobile-data-card__value">{{ item.parentName }}</span>
        </div>
        <div class="mobile-data-card__row">
          <span class="mobile-data-card__label">编码</span>
          <span class="mobile-data-card__value">{{ item.code }}</span>
        </div>
      </template>
      <template #actions="{ item }">
        <el-button
          v-if="item.level === 'SECONDARY'"
          size="small"
          type="primary"
          plain
          @click="openRules(item.id)"
        >
          关键词规则
        </el-button>
      </template>
    </MobileDataCards>

    <el-dialog
      v-model="dialogVisible"
      title="新建通道"
      :width="isMobile ? undefined : '460px'"
      :fullscreen="isMobile"
      class="anlan-responsive-dialog"
    >
      <el-form label-width="88px" class="anlan-form-mobile">
        <el-form-item label="通道层级">
          <el-radio-group v-model="form.level">
            <el-radio value="PRIMARY">一级通道</el-radio>
            <el-radio value="SECONDARY">二级通道</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.level === 'SECONDARY'" label="所属一级">
          <el-select v-model="form.parentId" placeholder="选择一级通道" style="width: 100%">
            <el-option
              v-for="opt in primaryOptions"
              :key="opt.id"
              :label="opt.name"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>
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
