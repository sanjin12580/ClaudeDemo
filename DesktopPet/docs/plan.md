# DesktopPet - PC 桌面宠物软件开发计划

## Context

开发一款跨平台（Windows + macOS）的桌面宠物软件，采用 Electron + Web 技术栈，使用 Three.js 渲染 3D 模型宠物。宠物具备基础互动、养成系统、智能对话（LLM）、实用工具等全套功能。系统设计需具备良好的扩展性，方便后续添加新功能。

---

## 技术架构

```
┌─────────────────────────────────────────────┐
│              Electron 主进程                  │
│  - 窗口管理（透明无边框窗口）                    │
│  - 系统托盘 & 全局快捷键                       │
│  - 文件存储（宠物状态持久化）                    │
│  - IPC 通信                                   │
├─────────────────────────────────────────────┤
│              Electron 渲染进程                 │
│  ┌───────────┐  ┌──────────┐  ┌───────────┐ │
│  │  Three.js  │  │  UI 层   │  │  AI 对话   │ │
│  │  3D 宠物   │  │ React    │  │  LLM 接口  │ │
│  └───────────┘  └──────────┘  └───────────┘ │
├─────────────────────────────────────────────┤
│              核心服务层                        │
│  - 养成系统引擎（状态衰减、事件触发）            │
│  - 动画状态机（宠物行为切换）                    │
│  - 插件系统（工具/功能扩展入口）                 │
│  - 事件总线（模块间松耦合通信）                  │
│  - 配置管理                                   │
└─────────────────────────────────────────────┘
```

### 核心技术选型

| 模块 | 技术 | 说明 |
|------|------|------|
| 框架 | Electron 28+ | 跨平台桌面应用 |
| 3D 渲染 | Three.js + react-three-fiber | 3D 宠物模型渲染 |
| UI 框架 | React 18 + TypeScript | 界面组件开发 |
| 状态管理 | Zustand | 轻量级全局状态 |
| 3D 模型格式 | GLTF/GLB | 标准 3D 资源格式 |
| 动画 | Three.js AnimationMixer | 骨骼动画播放 |
| AI 对话 | OpenAI API / Claude API | LLM 智能对话 |
| 天气 API | OpenWeatherMap | 天气数据获取 |
| 存储 | electron-store | 本地数据持久化 |
| 构建 | Vite + electron-builder | 开发与打包 |

---

## 项目结构

```
DesktopPet/
├── electron/                    # Electron 主进程
│   ├── main.ts                  # 主进程入口
│   ├── preload.ts               # 预加载脚本
│   ├── tray.ts                  # 系统托盘
│   └── ipc-handlers.ts          # IPC 通信处理
├── src/                         # 渲染进程源码
│   ├── App.tsx                  # 应用入口
│   ├── core/                    # 核心系统
│   │   ├── EventBus.ts          # 事件总线
│   │   ├── PluginManager.ts     # 插件管理器
│   │   ├── NurturingEngine.ts   # 养成系统引擎
│   │   └── AnimationStateMachine.ts # 动画状态机
│   ├── components/
│   │   ├── Pet3D/               # 3D 宠物组件
│   │   │   ├── PetScene.tsx     # Three.js 场景
│   │   │   ├── PetModel.tsx     # 3D 模型加载与动画
│   │   │   ├── PetAnimations.ts # 动画配置
│   │   │   └── PetInteraction.tsx # 拖拽/点击交互
│   │   ├── ChatPanel/           # 智能对话面板
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   └── ChatInput.tsx
│   │   ├── StatusBar/           # 宠物状态栏
│   │   │   ├── StatusBars.tsx   # 饥饿/心情/健康
│   │   │   └── StatusIcon.tsx
│   │   ├── Tools/               # 实用工具（插件化）
│   │   │   ├── ToolRegistry.ts  # 工具注册中心
│   │   │   ├── AlarmTool.tsx
│   │   │   ├── WeatherWidget.tsx
│   │   │   ├── SystemMonitor.tsx
│   │   │   └── PomodoroTool.tsx
│   │   ├── ContextMenu/         # 右键菜单
│   │   └── Settings/            # 设置面板
│   ├── plugins/                 # 插件目录
│   │   ├── PluginInterface.ts   # 插件接口定义
│   │   └── builtin/             # 内置插件
│   ├── stores/                  # Zustand 状态管理
│   │   ├── petStore.ts          # 宠物状态（养成数据）
│   │   ├── chatStore.ts         # 对话历史
│   │   └── settingsStore.ts     # 用户设置
│   ├── services/                # 业务服务
│   │   ├── ai/                  # AI 服务（策略模式）
│   │   │   ├── AIServiceInterface.ts
│   │   │   ├── OpenAIService.ts
│   │   │   └── ClaudeService.ts
│   │   ├── weather/             # 天气服务
│   │   │   ├── WeatherInterface.ts
│   │   │   └── OpenWeatherService.ts
│   │   └── notificationService.ts
│   ├── hooks/                   # 自定义 Hooks
│   ├── utils/                   # 工具函数
│   └── types/                   # TypeScript 类型定义
├── assets/
│   ├── models/                  # 3D 模型资源 (.glb)
│   ├── textures/               # 贴图资源
│   ├── sounds/                 # 音效资源
│   └── icons/                  # 图标资源
├── package.json
├── vite.config.ts
├── electron-builder.yml
└── tsconfig.json
```

---

## 分阶段开发计划

### Phase 1：基础框架与 3D 宠物渲染（第 1-2 周）✅ 已完成

**目标**：搭建 Electron 项目，实现透明窗口中 3D 宠物的静态展示和基础交互。

#### 1.1 项目初始化
- [x] 使用 Vite + Electron 初始化项目（electron-vite）
- [x] 配置 TypeScript（tsconfig.node.json + tsconfig.web.json）
- [x] 配置 electron-builder 打包（Win + Mac）
- [ ] 设置 CI/CD 基础流程

#### 1.2 透明窗口 & 宠物容器
- [x] 创建透明无边框 Electron 窗口（`transparent: true, frame: false`）
- [x] 窗口始终置顶（`alwaysOnTop: true`）
- [x] 窗口可拖拽移动（IPC moveWindow）
- [x] 系统托盘图标 & 基础右键菜单（显示/隐藏/退出）
- [x] 窗口穿透：宠物区域可交互，其余区域点击穿透（overlayState 全局协调）

#### 1.3 Three.js 3D 场景
- [x] 搭建 react-three-fiber 场景
- [x] 3 个精美形象：龙猫🐾、中华田园犬🐶、幽灵👻（程序化几何体）
- [x] 基础光照（环境光 + 方向光）
- [x] 形象选择面板（右键菜单 → 更换形象）

#### 1.4 基础交互
- [x] 鼠标点击宠物 → 播放反应动画 + 弹出表情气泡
- [x] 鼠标拖拽宠物移动位置
- [x] 鼠标悬停宠物 → 显示状态栏
- [x] 右键菜单（喂食/抚摸/陪玩/更换形象/设置/隐藏）

#### 1.5 核心扩展架构
- [x] EventBus 事件总线
- [x] PluginManager 插件管理器
- [x] ToolRegistry 工具注册中心
- [x] overlayState 全局 overlay 状态协调

**产出物**：桌面显示 3D 宠物（3 个形象可选），可拖拽/点击/右键互动。

---

### Phase 2：动画系统 & 养成引擎（第 3-4 周）

**目标**：宠物拥有丰富的动画表现，养成系统驱动宠物行为变化。

#### 2.1 动画状态机
- [ ] 定义宠物状态：`idle`、`happy`、`sad`、`hungry`、`sleeping`、`eating`、`playing`、`walking`
- [ ] 使用有限状态机（FSM）管理动画切换
- [ ] 实现动画过渡（AnimationMixer crossFade）
- [ ] 随机空闲行为（打哈欠、伸懒腰、原地踱步）
- [ ] 定时行为（白天活跃、夜晚睡觉）

#### 2.2 养成系统引擎
- [ ] 设计属性模型：
  ```
  PetStats {
    hunger: number      // 0-100, 饥饿度（越低越饿）
    happiness: number   // 0-100, 心情值
    health: number      // 0-100, 健康值
    energy: number      // 0-100, 精力值
    intimacy: number    // 0-100, 亲密度（长期积累）
    age: number         // 宠物年龄（天）
  }
  ```
- [ ] 状态衰减机制：每隔 N 分钟自动衰减（hunger -2/h, happiness -1/h）
- [ ] 状态联动：饥饿过低 → 健康下降；心情低 → 动画变 sad
- [ ] 状态持久化（electron-store，关闭应用后恢复）

#### 2.3 喂食与互动
- [ ] 喂食功能：右键菜单选择食物 → 播放 eating 动画 → hunger 恢复
- [ ] 抚摸功能：长按宠物 → 播放 happy 动画 → happiness + intimacy 提升
- [ ] 陪玩功能：点击玩具按钮 → 播放 playing 动画 → happiness + energy 消耗
- [ ] 清洁功能：当 health 低时触发清洁互动

#### 2.4 状态栏 UI
- [ ] 悬浮状态条（鼠标悬停宠物时显示）
- [ ] 各属性进度条 + 图标
- [ ] 属性过低时闪烁警告
- [ ] 宠物头顶气泡表情（爱心、问号、Zzz 等）

**产出物**：宠物拥有完整动画和养成系统，会因时间和互动改变状态与行为。

---

### Phase 3：AI 智能对话（第 5-6 周）

**目标**：宠物能通过 LLM 与用户自然对话，具有个性化人设。

#### 3.1 对话 UI
- [ ] 对话气泡面板（从宠物头顶弹出，半透明背景）
- [ ] 输入框（支持 Enter 发送）
- [ ] 对话历史记录（最近 N 条）
- [ ] 宠物回复时播放 talking 口型动画
- [ ] 面板可收起/展开，不遮挡桌面

#### 3.2 AI 服务集成
- [ ] 接入 OpenAI API / Claude API（可配置切换）
- [ ] 设计宠物人设 System Prompt（性格、语气、口头禅）
- [ ] 上下文管理（携带最近对话 + 宠物当前状态）
- [ ] 流式输出（SSE，打字机效果）
- [ ] API Key 管理（设置页配置，加密存储）

#### 3.3 智能触发
- [ ] 宠物主动说话（状态低时主动提醒："我好饿呀~"）
- [ ] 定时问候（早上好、中午好、晚上好）
- [ ] 识别用户情绪关键词，做出对应反应
- [ ] 特殊节日/事件彩蛋对话

#### 3.4 个性化配置
- [ ] 宠物名字设置
- [ ] 性格模板选择（活泼/傲娇/温柔/话痨）
- [ ] 用户可自定义 System Prompt

**产出物**：宠物具备 AI 对话能力，能主动互动，性格可定制。

---

### Phase 4：实用工具集成（第 7-8 周）

**目标**：宠物附带实用桌面工具，增加使用粘性。

#### 4.1 闹钟 / 提醒
- [ ] 设置提醒时间 + 提醒内容
- [ ] 到时间后宠物播放警告动画 + 气泡提示
- [ ] 系统通知（Notification API）
- [ ] 支持重复提醒（每天/工作日/自定义）
- [ ] 提醒列表管理（增删改）

#### 4.2 天气展示
- [ ] 接入 OpenWeatherMap API
- [ ] 宠物根据天气变化行为：
  - 晴天 → 开心动画
  - 雨天 → 打伞动画 / 躲雨
  - 下雪 → 玩雪动画
  - 高温 → 扇风动画
- [ ] 天气信息气泡展示（温度、天气状况）
- [ ] 自动定位（IP 定位 / 手动设置城市）

#### 4.3 系统监控
- [ ] CPU / 内存使用率展示（通过 Electron 获取）
- [ ] 宠物在系统负载高时表现疲倦
- [ ] 网速监控（可选）
- [ ] 小型悬浮图表（可收起）

#### 4.4 番茄钟
- [x] 自定义工作/休息时长（1-120 分钟工作 + 1-60 分钟休息）
- [ ] 工作时宠物安静陪伴（reading 动画）
- [ ] 休息时宠物提醒活动（playing 动画）
- [ ] 专注统计（今日专注时长）

**产出物**：宠物成为实用的桌面伴侣工具，而不仅仅是玩具。

---

### Phase 5：打磨与发布（第 9-10 周）

**目标**：完善体验，打包发布。

#### 5.1 设置面板
- [ ] 宠物大小缩放
- [ ] 透明度调节
- [ ] 开机自启选项
- [ ] 快捷键配置
- [ ] 语言切换（中/英）
- [ ] 主题切换（深色/浅色）

#### 5.2 多宠物支持（可选扩展）
- [ ] 宠物皮肤系统（不同 3D 模型切换）
- [ ] 宠物商店（本地皮肤包导入）
- [ ] 多宠物同屏

#### 5.3 性能优化
- [ ] 3D 渲染性能优化（LOD、纹理压缩）
- [ ] 内存占用优化（目标 < 150MB）
- [ ] CPU 空闲时降帧率（requestAnimationFrame 智能调度）
- [ ] 开发者工具可关闭

#### 5.4 打包发布
- [ ] Windows 安装包（.exe / .msi）
- [ ] macOS 安装包（.dmg）
- [ ] 自动更新（electron-updater）
- [ ] 用户协议 & 隐私政策
- [ ] GitHub Release 发布

---

## 3D 模型资源方案

| 方案 | 说明 | 成本 |
|------|------|------|
| Mixamo 免费模型 | Adobe 提供的免费角色 + 动画 | 免费 |
| Ready Player Me | 可定制 3D 虚拟形象 | 免费基础版 |
| VRoid Studio | 日系二次元 3D 模型制作 | 免费 |
| 自制 Blender 模型 | 用 Blender 自己建模 + 绑骨 | 时间成本 |
| 购买资产 | Unity/itch.io 商店购买 | $5-50 |

**推荐**：Phase 1 用 Mixamo 免费模型快速验证，后续用 VRoid Studio 或自制模型替换。

---

## 关键技术难点 & 解决方案

| 难点 | 方案 |
|------|------|
| 透明窗口下 3D 渲染 | Electron transparent + Three.js alpha 背景 |
| 鼠标穿透（非宠物区域） | `setIgnoreMouseEvents` + CSS `pointer-events` 配合 |
| 3D 模型性能 | 控制多边形数量 < 10K，使用 Draco 压缩 |
| 窗口拖拽与 3D 交互冲突 | 分层处理：宠物区域可交互，背景区域可拖拽 |
| 状态持久化 | electron-store + JSON 序列化，退出时自动保存 |
| API Key 安全 | 主进程存储，不暴露给渲染进程 |

---

## 里程碑总结

| 阶段 | 时间 | 交付物 |
|------|------|--------|
| Phase 1 | 第 1-2 周 | 桌面显示 3D 宠物，可拖拽/点击 |
| Phase 2 | 第 3-4 周 | 动画系统 + 养成系统完整运行 |
| Phase 3 | 第 5-6 周 | AI 对话功能上线 |
| Phase 4 | 第 7-8 周 | 实用工具集成完成 |
| Phase 5 | 第 9-10 周 | 打磨优化，打包发布 |

---

## 验证方式

1. **Phase 1 验证**：启动应用，桌面出现 3D 宠物，可拖拽移动，点击有动画反应
2. **Phase 2 验证**：放置一段时间后宠物状态衰减，喂食后恢复，动画随状态变化
3. **Phase 3 验证**：与宠物对话，回复符合人设；宠物能主动说话
4. **Phase 4 验证**：设置提醒准时触发；天气影响宠物行为；番茄钟正常计时
5. **Phase 5 验证**：Win/Mac 安装包正常安装运行，内存占用 < 150MB
