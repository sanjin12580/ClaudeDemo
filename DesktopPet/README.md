# DesktopPet - PC 桌面宠物

一款跨平台（Windows + macOS）桌面宠物软件，采用 Electron + Web 技术栈，使用 Three.js 渲染 3D 模型宠物。

## 功能特性

- **3D 宠物**：Three.js 渲染的 3D 宠物，浮于桌面之上
- **基础互动**：拖拽移动、点击反应、鼠标跟随、右键菜单
- **养成系统**：饥饿/心情/健康/精力/亲密度，状态随时间衰减
- **AI 对话**：接入 LLM，宠物能与用户自然对话，性格可定制
- **实用工具**：闹钟提醒、天气展示、系统监控、番茄钟
- **插件架构**：良好的扩展性，方便后续添加新功能

## 技术栈

| 模块 | 技术 |
|------|------|
| 框架 | Electron 28+ |
| 3D 渲染 | Three.js + react-three-fiber |
| UI | React 18 + TypeScript |
| 状态管理 | Zustant |
| 构建 | Vite + electron-builder |

## 项目结构

```
DesktopPet/
├── CLAUDE.md              # 项目指引
├── README.md              # 项目说明（本文件）
├── docs/                  # 文档目录
│   ├── plan.md            # 开发计划
│   └── architecture.md    # 扩展性架构设计
├── electron/              # Electron 主进程（待创建）
├── src/                   # 渲染进程源码（待创建）
└── assets/                # 资源文件（待创建）
```

## 文档

- [开发计划](docs/plan.md) - 详细的分阶段开发计划
- [扩展性架构设计](docs/architecture.md) - 插件系统、事件总线、策略模式等扩展性设计

## 开发阶段

| 阶段 | 内容 | 时间 |
|------|------|------|
| Phase 1 | 基础框架 + 3D 宠物渲染 + 透明窗口 + 拖拽/点击交互 | 1-2 周 |
| Phase 2 | 动画状态机 + 养成系统 + 喂食互动 | 3-4 周 |
| Phase 3 | AI 智能对话 + 宠物人设 + 主动说话 | 5-6 周 |
| Phase 4 | 实用工具：闹钟、天气、系统监控、番茄钟 | 7-8 周 |
| Phase 5 | 设置面板 + 性能优化 + Win/Mac 打包发布 | 9-10 周 |

## 快速开始（待实现后填写）

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建打包
npm run build
npm run dist
```
