/** Dropbox からの取り込みの、簡体字中国語の訳。 */
export const dropboxZhHans = {
  "dropbox.entry": "从 Dropbox 导入",
  "dropbox.title": "从 Dropbox 导入",
  "dropbox.description":
    "用放在 Dropbox App folder 中的照片创建图片。导入的照片排在图片列表的最前面。",
  "dropbox.loadFailed": "无法读取与 Dropbox 的连接",
  "dropbox.unconfigured":
    "服务器没有 Dropbox 应用的设置（DROPBOX_APP_KEY、DROPBOX_APP_SECRET）。请设置后重新启动服务器。",
  "dropbox.disconnectedTitle": "尚未连接 Dropbox",
  "dropbox.disconnectedDescription":
    "连接后，只读取 Dropbox「应用」文件夹中本站点的文件夹。",
  "dropbox.connect": "连接 Dropbox",
  "dropbox.account": "已连接的账户",
  "dropbox.accountDetail": "{{email}}・{{date}}连接",
  "dropbox.disconnect": "断开连接",
  "dropbox.connectionFailure.NotConfigured":
    "服务器没有 Dropbox 应用的设置，无法连接。",
  "dropbox.connectionFailure.AlreadyConnected":
    "已经连接 Dropbox。已重新读取连接状态。",
  "dropbox.connectionFailure.ImportRunning":
    "导入照片期间无法断开连接。请在导入结束后再试。",
  "dropbox.connectionFailure.Failed": "无法与 Dropbox 通信。请再试一次。",
  "dropbox.connectionLost":
    "与 Dropbox 的连接已断开。可能在 Dropbox 的设置中移除了应用的连接，或授权已被撤销。",
  "dropbox.reconnect": "重新连接",
  "dropbox.photosTitle": "App folder 中的照片",
  "dropbox.photosLoadFailed": "无法读取 Dropbox 中的照片",
  "dropbox.photosEmptyTitle": "App folder 中没有照片",
  "dropbox.photosEmptyDescription":
    "请把 JPEG、PNG、WebP、AVIF、HEIC 照片放到 Dropbox「应用」文件夹中本站点的文件夹里。",
  "dropbox.photosSummary": "新照片 {{importable}} 张・已导入 {{imported}} 张",
  "dropbox.reload": "重新读取",
  "dropbox.import": "导入 {{count}} 张新照片",
  "dropbox.importNone": "没有新照片",
  "dropbox.importing": "正在导入",
  "dropbox.progress": "已导入 {{total}} 张中的 {{done}} 张",
  "dropbox.done": "已添加 {{total}} 张中的 {{added}} 张。",
  "dropbox.doneWithFailures":
    "已添加 {{total}} 张中的 {{added}} 张。{{failed}} 张无法导入。",
  "dropbox.startFailure.NotConnected": "尚未连接 Dropbox。请先连接。",
  "dropbox.startFailure.ConnectionLost":
    "与 Dropbox 的连接已断开。请重新连接。",
  "dropbox.startFailure.ImportRunning": "另一个导入正在进行。",
  "dropbox.photoDetail": "{{size}}・{{date}}",
  "dropbox.status.new": "新照片",
  "dropbox.status.imported": "已导入",
  "dropbox.status.image-deleted": "已导入（图片已删除）",
  "dropbox.status.waiting": "等待中",
  "dropbox.status.importing": "正在导入",
  "dropbox.status.added": "已添加",
  "dropbox.status.already-added": "已导入相同的照片",
  "dropbox.status.not-found": "Dropbox 中没有",
  "dropbox.status.changed": "选择后已更改",
  "dropbox.status.too-large": "太大（最多 {{limit}} MB）",
  "dropbox.status.unsupported": "不支持的格式",
  "dropbox.status.failed": "无法导入",
  "dropbox.return.NotConfigured": "服务器没有 Dropbox 应用的设置，无法连接。",
  "dropbox.return.AlreadyConnected": "已经连接 Dropbox。",
  "dropbox.return.Expired":
    "无法连接 Dropbox。打开授权页面后时间过长，或授权是在另一个标签页中开始的。",
  "dropbox.return.Rejected": "Dropbox 拒绝了授权。请从导入页面重新连接。",
  "dropbox.return.Denied": "你在 Dropbox 中没有允许，因此没有连接。",
  "dropbox.return.Invalid":
    "此页面在从 Dropbox 返回时打开。请从导入页面开始连接。",
  "dropbox.return.Failed": "无法连接 Dropbox。请稍后再试。",
  "dropbox.returnReady": "已在 Dropbox 中允许。连接后将返回导入页面。",
  "dropbox.returnConnect": "连接",
  "dropbox.returnBack": "返回导入页面",
} as const;
