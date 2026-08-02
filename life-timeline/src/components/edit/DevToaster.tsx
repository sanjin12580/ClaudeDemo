// ============================================================
// DevToaster — 页面级单例 Toaster（仅 dev 使用，避免多岛重复挂载）
// ============================================================

import { Toaster } from '../ui/toaster';

export default function DevToaster() {
  return <Toaster />;
}
