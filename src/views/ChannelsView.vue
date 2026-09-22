<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  auditApi,
  type AuditChannel,
  type BusinessLineType,
  type ChannelLevel,
} from '@/api/audit'
import { getElMessage } from '@shared/child/element-plus'
import { useBreakpoint } from '@shared/use-breakpoint'
import MobileDataCards from '@shared/components/MobileDataCards.vue'

const router = useRouter()
const loading = ref(false)
const list = ref<AuditChannel[]>([])
const dialogVisible = ref(false)
const editVisible = ref(false)
const editingId = ref('')
const form = reactive({
  code: '',
  name: '',
  description: '',
  level: 'SECONDARY' as ChannelLevel,
  parentId: '',
  grade: 1,
  businessLine: '' as '' | BusinessLineType,
})
const editForm = reactive({
  name: '',
  description: '',
  enabled: true,
  grade: 1,
  businessLine: '' as '' | BusinessLineType,
})
const { isMobile } = useBreakpoint()

const primaryOptions = computed(() =>
  list.value.filter((ch) => ch.level === 'PRIMARY' && ch.enabled),
)

const levelLabel = (level: ChannelLevel) => (level === 'PRIMARY' ? '一级' : '二级')

const businessLineLabel = (line?: BusinessLineType | null) => {
  if (line === 'ARTICLE') return '文章'
  if (line === 'COMMENT') return '评论'
  return '全部'
}

const gradeTagType = (grade: number) => {
  if (grade >= 3) return 'danger'
  if (grade >= 2) return 'warning'
  return 'info'
}

const gradeLabel = (grade: number) => `L${grade}`

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
  form.grade = 1
  form.businessLine = ''
  dialogVisible.value = true
}

function openEdit(row: AuditChannel) {
  editingId.value = row.id
  editForm.name = row.name
  editForm.description = row.description ?? ''
  editForm.enabled = row.enabled
  editForm.grade = row.grade ?? 1
  editForm.businessLine = row.businessLine ?? ''
  editVisible.value = true
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
    grade: form.level === 'PRIMARY' ? form.grade : undefined,
    businessLine:
      form.level === 'PRIMARY'
        ? form.businessLine || null
        : undefined,
  })
  getElMessage().success('已创建')
  dialogVisible.value = false
  await load()
}

async function saveEdit() {
  const payload: Partial<AuditChannel> = {
    name: editForm.name,
    description: editForm.description || null,
    enabled: editForm.enabled,
  }
  const row = list.value.find((ch) => ch.id === editingId.value)
  if (row?.level === 'PRIMARY') {
    payload.grade = editForm.grade
    payload.businessLine = editForm.businessLine || null
  }
  await auditApi.updateChannel(editingId.value, payload)
  getElMessage().success('已保存')
  editVisible.value = false
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
      <el-table-column label="等级" width="80">
        <template #default="{ row }">
          <el-tag
            v-if="(row as AuditChannel).level === 'PRIMARY'"
            size="small"
            :type="gradeTagType((row as AuditChannel).grade ?? 1)"
          >
            {{ gradeLabel((row as AuditChannel).grade ?? 1) }}
          </el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="业务线" width="100">
        <template #default="{ row }">
          <template v-if="(row as AuditChannel).level === 'PRIMARY'">
            {{ businessLineLabel((row as AuditChannel).businessLine) }}
          </template>
          <span v-else>—</span>
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
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row as AuditChannel)">编辑</el-button>
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
        <div v-if="item.level === 'PRIMARY'" class="mobile-data-card__row">
          <span class="mobile-data-card__label">等级</span>
          <span class="mobile-data-card__value">{{ gradeLabel(item.grade ?? 1) }}</span>
        </div>
        <div v-if="item.level === 'PRIMARY'" class="mobile-data-card__row">
          <span class="mobile-data-card__label">业务线</span>
          <span class="mobile-data-card__value">{{ businessLineLabel(item.businessLine) }}</span>
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
        <el-button size="small" plain @click="openEdit(item)">编辑</el-button>
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
        <template v-if="form.level === 'PRIMARY'">
          <el-form-item label="等级">
            <el-input-number v-model="form.grade" :min="1" :max="9" />
            <span class="field-hint">数值越大优先级越高，命中多通道时取最高等级</span>
          </el-form-item>
          <el-form-item label="业务线">
            <el-select v-model="form.businessLine" placeholder="全部业务线" clearable style="width: 100%">
              <el-option label="全部业务线" value="" />
              <el-option label="文章" value="ARTICLE" />
              <el-option label="评论" value="COMMENT" />
            </el-select>
          </el-form-item>
        </template>
        <el-form-item label="编码"><el-input v-model="form.code" placeholder="如 politics" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="form.name" placeholder="如 政治敏感" /></el-form-item>
        <el-form-item label="说明"><el-input v-model="form.description" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="create">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="editVisible"
      title="编辑通道"
      :width="isMobile ? undefined : '460px'"
      :fullscreen="isMobile"
      class="anlan-responsive-dialog"
    >
      <el-form label-width="88px" class="anlan-form-mobile">
        <el-form-item label="名称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="说明"><el-input v-model="editForm.description" type="textarea" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="editForm.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <template v-if="list.find((ch) => ch.id === editingId)?.level === 'PRIMARY'">
          <el-form-item label="等级">
            <el-input-number v-model="editForm.grade" :min="1" :max="9" />
          </el-form-item>
          <el-form-item label="业务线">
            <el-select v-model="editForm.businessLine" placeholder="全部业务线" clearable style="width: 100%">
              <el-option label="全部业务线" value="" />
              <el-option label="文章" value="ARTICLE" />
              <el-option label="评论" value="COMMENT" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.field-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
</style>
