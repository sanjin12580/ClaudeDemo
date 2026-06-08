# DesktopPet - PC 桌面宠物

## 项目概述
跨平台（Windows + macOS）桌面宠物软件，采用 Electron + Web 技术栈，使用 Three.js 渲染 3D 模型宠物。

## 技术栈
- **框架**: Electron 28+ (跨平台桌面应用)
- **前端**: React 18 + TypeScript
- **3D 渲染**: Three.js + react-three-fiber
- **状态管理**: Zustand
- **3D 模型**: GLTF/GLB 格式
- **AI 对话**: OpenAI API / Claude API (可配置切换)
- **构建**: Vite + electron-builder
- **存储**: electron-store (本地持久化)

## 项目结构（规划）
```
DesktopPet/
├── CLAUDE.md                   # 项目指引（本文件）
├── docs/                       # 文档目录
│   ├── plan.md                 # 开发计划
│   ├── architecture.md         # 扩展性架构设计
│   └── api-reference.md        # API 参考文档
├── electron/                   # Electron 主进程（待创建）
├── src/                        # 渲染进程源码（待创建）
├── assets/                     # 资源文件（待创建）
└── package.json                # 待创建
```

## 开发规范
- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 状态管理统一使用 Zustand store
- 3D 资源放在 assets/models/，贴图放 assets/textures/
- 所有模块需支持扩展，遵循插件化架构设计（见 docs/architecture.md）

## 扩展性设计原则
- **插件系统**: 功能模块通过插件接口注册，新增功能无需修改核心代码
- **事件总线**: 模块间通过事件通信，松耦合
- **配置驱动**: 行为、动画、工具通过配置文件声明
- **策略模式**: AI 服务、天气服务等外部依赖通过策略接口切换实现

## 构建与运行（待实现后填写）
```bash
# 开发
npm run dev

# 构建
npm run build

# 打包
npm run dist
```
