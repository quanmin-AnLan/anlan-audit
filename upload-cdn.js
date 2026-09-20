import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import cdnConfig from './cdn.config.json' with { type: 'json' }

const root = dirname(fileURLToPath(import.meta.url))
const { uploadDistToCdn } = await import(join(root, '../anlan-base/shared/upload-cdn-core.js'))

await uploadDistToCdn({
  appName: cdnConfig.appName,
  cdnOrigin: cdnConfig.cdnOrigin,
  title: cdnConfig.title,
  activeRule: cdnConfig.activeRule,
  icon: cdnConfig.icon,
  devPort: cdnConfig.devPort,
})
