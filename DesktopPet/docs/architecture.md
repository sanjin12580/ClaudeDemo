# DesktopPet 扩展性架构设计

## 设计目标

系统应具备良好的扩展性，方便后续添加新功能模块（新工具、新宠物、新互动方式等），而无需修改核心代码。

---

## 1. 插件系统（Plugin System）

所有功能模块通过统一的插件接口注册到系统中。新增功能 = 新增一个插件文件 + 注册。

### 插件接口定义

```typescript
// src/plugins/PluginInterface.ts

export interface PetPlugin {
  /** 唯一标识 */
  id: string;
  /** 插件名称（显示用） */
  name: string;
  /** 版本号 */
  version: string;
  /** 插件描述 */
  description: string;

  /** 生命周期：插件加载时调用 */
  onRegister?(context: PluginContext): void;
  /** 生命周期：插件卸载时调用 */
  onUnregister?(): void;

  /** 返回插件提供的 UI 组件（可选） */
  getUI?(): React.ComponentType | null;
  /** 返回插件提供的右键菜单项（可选） */
  getMenuItems?(): MenuItem[];
  /** 返回插件提供的设置项（可选） */
  getSettings?(): SettingItem[];
}
```

### 插件上下文

```typescript
export interface PluginContext {
  /** 事件总线 - 用于与其他模块通信 */
  eventBus: EventBus;
  /** 宠物状态 - 读写宠物属性 */
  petStore: PetStore;
  /** 注册定时任务 */
  registerCronjob(cron: string, callback: () => void): void;
  /** 显示通知 */
  notify(message: string, type: 'info' | 'warning' | 'error'): void;
}
```

### 使用方式

```typescript
// src/plugins/builtin/AlarmPlugin.ts
export const AlarmPlugin: PetPlugin = {
  id: 'builtin.alarm',
  name: '闹钟提醒',
  version: '1.0.0',
  description: '设置定时提醒，宠物会按时提醒你',

  onRegister(ctx) {
    ctx.eventBus.on('alarm:trigger', (data) => {
      ctx.notify(data.message, 'warning');
    });
  },

  getMenuItems() {
    return [{ label: '设置提醒', action: 'alarm:open' }];
  },
};
```

---

## 2. 事件总线（Event Bus）

模块间通过事件进行松耦合通信，避免直接依赖。

```typescript
// src/core/EventBus.ts

type EventHandler = (...args: any[]) => void;

export class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    // 返回取消订阅函数
    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(...args);
      } catch (e) {
        console.error(`[EventBus] Error in handler for "${event}":`, e);
      }
    });
  }
}
```

### 预定义事件

| 事件名 | 触发时机 | 数据 |
|--------|---------|------|
| `pet:click` | 用户点击宠物 | `{ position }` |
| `pet:drag` | 拖拽宠物 | `{ from, to }` |
| `pet:statsChanged` | 宠物属性变化 | `{ stats: PetStats }` |
| `pet:moodChanged` | 宠物心情变化 | `{ mood: string }` |
| `pet:action` | 宠物执行动作 | `{ action: string }` |
| `chat:message` | 用户发送消息 | `{ text: string }` |
| `chat:reply` | AI 回复 | `{ text: string }` |
| `weather:update` | 天气更新 | `{ weather: WeatherData }` |
| `alarm:trigger` | 闹钟触发 | `{ message: string }` |
| `plugin:registered` | 插件注册 | `{ pluginId: string }` |

---

## 3. 工具注册中心（Tool Registry）

实用工具通过注册中心统一管理，新增工具只需注册即可出现在菜单和设置中。

```typescript
// src/components/Tools/ToolRegistry.ts

export interface ToolDefinition {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType;
  /** 工具对宠物行为的影响 */
  petBehaviorEffect?: PetBehaviorEffect;
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
  }

  unregister(toolId: string): void {
    this.tools.delete(toolId);
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getById(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }
}
```

---

## 4. AI 服务策略模式

AI 服务通过策略接口抽象，支持切换不同 LLM 提供商。

```typescript
// src/services/ai/AIServiceInterface.ts

export interface AIService {
  /** 服务名称 */
  name: string;
  /** 发送消息并获取回复 */
  chat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<string>;
  /** 检查 API 连接是否正常 */
  healthCheck(): Promise<boolean>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}
```

### 切换实现

```typescript
// src/services/ai/AIServiceFactory.ts
const services: Record<string, () => AIService> = {
  openai: () => new OpenAIService(),
  claude: () => new ClaudeService(),
};

export function createAIService(provider: string): AIService {
  const factory = services[provider];
  if (!factory) throw new Error(`Unknown AI provider: ${provider}`);
  return factory();
}
```

---

## 5. 配置驱动的动画系统

宠物动画通过声明式配置管理，新增动画只需添加配置。

```typescript
// src/components/Pet3D/animation-config.ts

export interface AnimationConfig {
  /** 动画名称 */
  name: string;
  /** GLTF 动画剪辑名称 */
  clipName: string;
  /** 播放速度 */
  speed?: number;
  /** 是否循环 */
  loop?: boolean;
  /** 播放完毕后默认切换到的状态 */
  nextState?: string;
}

export const ANIMATION_CONFIGS: Record<string, AnimationConfig> = {
  idle:       { name: 'idle',       clipName: 'Idle',       loop: true },
  happy:      { name: 'happy',      clipName: 'Happy',      loop: false, nextState: 'idle' },
  sad:        { name: 'sad',        clipName: 'Sad',        loop: true },
  eating:     { name: 'eating',     clipName: 'Eating',     loop: false, nextState: 'happy' },
  sleeping:   { name: 'sleeping',   clipName: 'Sleeping',   loop: true },
  playing:    { name: 'playing',    clipName: 'Playing',    loop: false, nextState: 'idle' },
  walking:    { name: 'walking',    clipName: 'Walking',    loop: true },
  talking:    { name: 'talking',    clipName: 'Talking',    loop: true },
  // 新增动画只需在这里添加配置 ↓
  // dancing: { name: 'dancing', clipName: 'Dancing', loop: true },
};
```

---

## 6. 扩展性检查清单

在开发每个功能时，确认以下几点：

- [ ] **是否通过事件总线通信？** → 避免直接 import 其他模块
- [ ] **是否可独立注册/卸载？** → 功能模块应是自包含的
- [ ] **配置是否外置？** → 行为参数放在配置文件中，不硬编码
- [ ] **接口是否抽象？** → 外部服务（AI、天气等）通过接口定义
- [ ] **是否提供了扩展点？** → 菜单项、设置项、UI 组件是否可扩展

---

## 7. 未来扩展方向（参考）

以下是后续可能的扩展方向，当前架构已为此预留空间：

| 扩展方向 | 实现方式 |
|---------|---------|
| 宠物换装系统 | 新增皮肤插件 + 模型资源管理器 |
| 多宠物同屏 | PetManager 管理多个 PetInstance |
| 宠物间互动 | 事件总线 + 多实例事件 |
| 语音交互 | 新增 SpeechService 策略接口 |
| AR 模式 | 摄像头接入 + Three.js AR 扩展 |
| 社区分享 | 云端同步插件 + 导入/导出功能 |
| 小游戏 | 新增 MiniGamePlugin + 游戏状态管理 |
| 日程管理 | CalendarPlugin + 事件日历集成 |
