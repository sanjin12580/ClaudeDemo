/**
 * 工具注册中心 - 管理实用工具（闹钟、天气、番茄钟等）
 *
 * 工具通过注册中心统一管理，新增工具只需注册即可自动出现在菜单和设置中。
 */

import React from 'react'

export interface ToolDefinition {
  /** 唯一标识 */
  id: string
  /** 显示名称 */
  name: string
  /** 图标 (emoji 或图标路径) */
  icon: string
  /** 工具 UI 组件 */
  component: React.ComponentType
  /** 是否默认启用 */
  enabledByDefault?: boolean
  /** 工具描述 */
  description?: string
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>()
  private enabledTools = new Set<string>()

  /**
   * 注册工具
   */
  register(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool)
    if (tool.enabledByDefault !== false) {
      this.enabledTools.add(tool.id)
    }
  }

  /**
   * 卸载工具
   */
  unregister(toolId: string): void {
    this.tools.delete(toolId)
    this.enabledTools.delete(toolId)
  }

  /**
   * 启用工具
   */
  enable(toolId: string): void {
    if (this.tools.has(toolId)) {
      this.enabledTools.add(toolId)
    }
  }

  /**
   * 禁用工具
   */
  disable(toolId: string): void {
    this.enabledTools.delete(toolId)
  }

  /**
   * 检查工具是否启用
   */
  isEnabled(toolId: string): boolean {
    return this.enabledTools.has(toolId)
  }

  /**
   * 获取所有已注册工具
   */
  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  /**
   * 获取所有已启用的工具
   */
  getEnabled(): ToolDefinition[] {
    return this.getAll().filter((tool) => this.isEnabled(tool.id))
  }

  /**
   * 根据 ID 获取工具
   */
  getById(id: string): ToolDefinition | undefined {
    return this.tools.get(id)
  }
}

// 全局单例
export const toolRegistry = new ToolRegistry()
