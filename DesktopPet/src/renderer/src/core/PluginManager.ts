/**
 * 插件管理器 - 统一管理所有功能插件的生命周期
 *
 * 新功能通过实现 PetPlugin 接口注册到系统中。
 * 插件可提供 UI 组件、菜单项、设置项。
 */

import { EventBus } from './EventBus'

export interface MenuItem {
  label: string
  action: string
  icon?: string
  separator?: boolean
}

export interface SettingItem {
  key: string
  label: string
  type: 'toggle' | 'input' | 'select' | 'number'
  defaultValue: any
  options?: { label: string; value: any }[]
  description?: string
}

export interface PluginContext {
  eventBus: EventBus
  notify: (message: string, type?: 'info' | 'warning' | 'error') => void
  registerCronjob: (cron: string, callback: () => void) => void
}

export interface PetPlugin {
  id: string
  name: string
  version: string
  description: string

  onRegister?(context: PluginContext): void
  onUnregister?(): void
  getUI?(): React.ComponentType | null
  getMenuItems?(): MenuItem[]
  getSettings?(): SettingItem[]
}

export class PluginManager {
  private plugins = new Map<string, PetPlugin>()
  private context: PluginContext

  constructor(eventBus: EventBus) {
    this.context = {
      eventBus,
      notify: (message, type = 'info') => {
        eventBus.emit('notification:show', { message, type })
      },
      registerCronjob: (_cron, _callback) => {
        // TODO: 实现定时任务系统
      }
    }
  }

  /**
   * 注册插件
   */
  register(plugin: PetPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[PluginManager] Plugin "${plugin.id}" already registered`)
      return
    }

    plugin.onRegister?.(this.context)
    this.plugins.set(plugin.id, plugin)
    this.context.eventBus.emit('plugin:registered', { pluginId: plugin.id })
    console.log(`[PluginManager] Registered: ${plugin.name} v${plugin.version}`)
  }

  /**
   * 卸载插件
   */
  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return

    plugin.onUnregister?.()
    this.plugins.delete(pluginId)
    this.context.eventBus.emit('plugin:unregistered', { pluginId })
    console.log(`[PluginManager] Unregistered: ${plugin.name}`)
  }

  /**
   * 获取所有已注册插件
   */
  getAll(): PetPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 根据 ID 获取插件
   */
  getById(id: string): PetPlugin | undefined {
    return this.plugins.get(id)
  }

  /**
   * 收集所有插件提供的菜单项
   */
  getAllMenuItems(): (MenuItem & { pluginId: string })[] {
    const items: (MenuItem & { pluginId: string })[] = []
    this.plugins.forEach((plugin) => {
      plugin.getMenuItems?.().forEach((item) => {
        items.push({ ...item, pluginId: plugin.id })
      })
    })
    return items
  }

  /**
   * 收集所有插件提供的设置项
   */
  getAllSettings(): (SettingItem & { pluginId: string })[] {
    const settings: (SettingItem & { pluginId: string })[] = []
    this.plugins.forEach((plugin) => {
      plugin.getSettings?.().forEach((setting) => {
        settings.push({ ...setting, pluginId: plugin.id })
      })
    })
    return settings
  }
}

// 全局单例
import { eventBus } from './EventBus'
export const pluginManager = new PluginManager(eventBus)
