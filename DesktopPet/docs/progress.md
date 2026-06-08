# DesktopPet - 开发进度记录

## 2026-06-08

### 今日完成

#### Phase 1：基础框架 ✅
- Electron + Three.js 桌面宠物基础架构搭建完成
- 透明无边框窗口 + 系统托盘 + IPC 通信
- 鼠标穿透状态管理（overlayState）解决透明窗口交互问题

#### Phase 2：宠物系统 ✅
- 3 个 3D 形象：龙猫、中华田园犬、幽灵
- 基础动画：idle（呼吸）、walking（行走）、eating（进食）
- 拖拽移动、右键菜单交互
- 形象选择器（代码分割懒加载）

#### Phase 3：AI 对话 ✅
- 接入小米 MIMO 模型（mimo-v2.5-pro）
- 文本对话 + 语音输入（ASR）+ 语音回复（TTS）
- 对话历史存储（最多 50 条）
- API Key 安全处理：config.json 存储 + gitignore 排除 + UI 脱敏显示

#### Phase 4：实用工具（部分完成）
- **系统监控**：CPU、内存、GPU、磁盘使用率实时显示
- **番茄钟**：自定义工作/休息时长（1-120 分钟工作 + 1-60 分钟休息）

#### Phase 5：设置面板（部分完成）
- 宠物个性化：名字、性格预设（活泼/高冷/粘人/话痨/社恐）
- 外观设置：大小缩放（0.5x-2.0x）、透明度（30%-100%）
- 声音设置：开关 + 音量调节
- 开机自启：Windows AutoLaunch 支持

### 待完成
- [ ] 养成系统完善（属性衰减、成长阶段）
- [ ] 更多宠物动画（happy、sad、sleeping 等）
- [ ] 打包发布（electron-builder）
- [ ] macOS 适配测试

### 技术问题与解决
1. **透明窗口鼠标穿透**：setIgnoreMouseEvents 切换不可靠，最终方案是窗口始终可交互，UI 面板通过 CSS 控制
2. **右键菜单点击失效**：document.addEventListener('click') 吞掉 React onClick，改用 overlay div 解决
3. **Vite 插件版本冲突**：@vitejs/plugin-react@6 需要 vite@^8，降级到 @vitejs/plugin-react@4
