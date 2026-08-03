// ============================================================
// RelationGraph — 以"我"为中心的生命图谱
// D3 force 布局 + Canvas 渲染：缩放平移 / 拖拽 / 头像节点
// 参考 LifeOS crm-graph 的中心化布局与 AniNet 的视图控制
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3';
import type { Person } from '../lib/types';
import { useI18n } from '../lib/i18n';
import { to } from '../lib/base';

interface Props {
  people: Person[];
  /** 中心"我"节点（由 profile 生成，不写入数据文件） */
  self?: { name: string; avatar?: string };
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  name: string;
  relation: string;
  importance: number;
  isSelf: boolean;
  avatar?: string;
  person?: Person;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  relation: string;
}

interface ViewTransform {
  x: number;
  y: number;
  k: number;
}

interface TooltipState {
  x: number;
  y: number;
  node: SimNode;
}

const SELF_ID = '__self__';
const SELF_COLOR = '#22c55e';
const BASE_HEIGHT = 520;
const RELATIONS_ORDER = [
  '家人',
  '爱人',
  '挚友',
  '导师',
  '同事',
  '同学',
  '萍水相逢',
  '观众',
  '其他',
] as const;

/** 关系 → emoji 图标（无头像节点显示，比首字母更有辨识度） */
const RELATION_ICONS: Record<string, string> = {
  家人: '👨‍👩‍👧',
  爱人: '💞',
  挚友: '🤝',
  导师: '🧭',
  同事: '💼',
  同学: '🎓',
  萍水相逢: '✨',
  观众: '🎭',
  其他: '💫',
};

/** 图谱柔和色板（低饱和、协调；仅用于图谱渲染，不改全局 RELATION_COLORS） */
const GRAPH_COLORS: Record<string, string> = {
  家人: '#fb7185',
  爱人: '#f472b6',
  挚友: '#38bdf8',
  导师: '#a78bfa',
  同事: '#34d399',
  同学: '#fbbf24',
  萍水相逢: '#94a3b8',
  观众: '#2dd4bf',
  其他: '#94a3b8',
};

function relationColor(relation: string): string {
  return GRAPH_COLORS[relation] || SELF_COLOR;
}

/** 调整 hex 颜色亮度（delta 为 -255~255，负值变暗） */
function shadeColor(hex: string, delta: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const clamp = (x: number) => Math.max(0, Math.min(255, x));
  const r = clamp((num >> 16) + delta);
  const g = clamp(((num >> 8) & 0x00ff) + delta);
  const b = clamp((num & 0x0000ff) + delta);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function nodeRadius(importance: number): number {
  return 17 + importance * 5;
}

export default function RelationGraph({ people, self }: Props) {
  const { relations: t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [hiddenRelations, setHiddenRelations] = useState<Set<string>>(new Set());
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const isFullscreenRef = useRef(false);

  const tooltipRef = useRef<TooltipState | null>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const viewRef = useRef<ViewTransform>({ x: 0, y: 0, k: 1 });
  const fittedRef = useRef(false);
  const animFrameRef = useRef(0);
  const dragNodeRef = useRef<SimNode | null>(null);
  const panStartRef = useRef<{ px: number; py: number; tx: number; ty: number } | null>(null);
  const sizeRef = useRef({ width: 0, height: BASE_HEIGHT });

  // 过滤可见人物（缓存，避免每次渲染重建仿真）
  const visiblePeople = useMemo(
    () => people.filter((p) => !hiddenRelations.has(p.relation)),
    [people, hiddenRelations],
  );

  // 图例切换
  const toggleRelation = useCallback((rel: string) => {
    setHiddenRelations((prev) => {
      const next = new Set(prev);
      if (next.has(rel)) next.delete(rel);
      else next.add(rel);
      return next;
    });
  }, []);

  // 图例（仅展示当前 people 中存在的类型）
  const legendItems = useMemo(
    () => RELATIONS_ORDER.filter((rel) => people.some((p) => p.relation === rel)),
    [people],
  );

  /** 重置视图：缩放并居中所有节点 */
  const fitView = useCallback(() => {
    const { width, height } = sizeRef.current;
    const nodes = nodesRef.current;
    if (nodes.length === 0 || width === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      if (n.x == null || n.y == null) continue;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x);
      maxY = Math.max(maxY, n.y);
    }
    if (!isFinite(minX)) return;
    const pad = 80;
    const bw = Math.max(maxX - minX, 1);
    const bh = Math.max(maxY - minY, 1);
    const k = Math.min(width / (bw + pad * 2), height / (bh + pad * 2), 1.4);
    viewRef.current = {
      k,
      x: width / 2 - (k * (minX + maxX)) / 2,
      y: height / 2 - (k * (minY + maxY)) / 2,
    };
  }, []);

  /** 屏幕坐标 → 世界坐标 */
  const screenToWorld = useCallback((sx: number, sy: number): [number, number] => {
    const v = viewRef.current;
    return [(sx - v.x) / v.k, (sy - v.y) / v.k];
  }, []);

  /** 命中检测（世界坐标） */
  const hitTest = useCallback(
    (wx: number, wy: number): SimNode | null => {
      for (const n of nodesRef.current) {
        if (n.x == null || n.y == null) continue;
        const dx = wx - n.x;
        const dy = wy - n.y;
        const r = nodeRadius(n.importance) + 6;
        if (dx * dx + dy * dy < r * r) return n;
      }
      return null;
    },
    [],
  );

  useEffect(() => {
    const container = containerRef.current!;
    const canvas = canvasRef.current!;
    if (!container || !canvas || visiblePeople.length === 0) return;

    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    const { width, height } = sizeRef.current;
    const dpr = window.devicePixelRatio;

    // ---- 构建节点与连线 ----
    const selfNode: SimNode = {
      id: SELF_ID,
      name: self?.name || '我',
      relation: 'self',
      importance: 5,
      isSelf: true,
      avatar: self?.avatar ? to(self.avatar) : undefined,
      x: width / 2,
      y: height / 2,
      fx: width / 2,
      fy: height / 2,
    };
    const nodes: SimNode[] = [
      selfNode,
      ...visiblePeople.map((p) => ({
        id: p.id,
        name: p.name,
        relation: p.relation,
        importance: p.importance,
        isSelf: false,
        avatar: p.avatar ? to(p.avatar) : undefined,
        person: p,
      })),
    ];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const links: SimLink[] = [];
    // 我 → 每位人物（一阶环绕）
    for (const p of visiblePeople) {
      links.push({ source: SELF_ID, target: p.id, relation: p.relation });
    }
    // 人物之间的原有关系
    for (const p of visiblePeople) {
      for (const linkId of p.links) {
        if (nodeMap.has(linkId) && linkId !== SELF_ID) {
          links.push({ source: p.id, target: linkId, relation: p.relation });
        }
      }
    }

    nodesRef.current = nodes;
    linksRef.current = links;
    fittedRef.current = false;

    // ---- 力仿真（self 固定圆心） ----
    const simulation = forceSimulation<SimNode>(nodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((d) => {
            const s = d.source as SimNode;
            const tt = d.target as SimNode;
            return s.isSelf || tt.isSelf ? 175 : 135;
          }),
      )
      .force('charge', forceManyBody().strength(-340))
      .force('center', forceCenter(width / 2, height / 2))
      .force(
        'collision',
        forceCollide<SimNode>().radius((d) => nodeRadius(d.importance) + 8),
      )
      .alpha(0.8)
      .alphaDecay(0.035)
      .on('tick', () => {
        // self 始终吸附圆心
        selfNode.x = width / 2;
        selfNode.y = height / 2;
        selfNode.fx = width / 2;
        selfNode.fy = height / 2;
      });
    simRef.current = simulation;

    // 首次布局稳定后适配视野
    const fitTimer = window.setTimeout(() => {
      if (!fittedRef.current) {
        fittedRef.current = true;
        fitView();
      }
    }, 600);

    // ---- 交互状态 ----
    let hoverNode: SimNode | null = null;

    // ---- 渲染循环 ----
    let time = 0;
    function render() {
      time += 0.016;
      // 每帧自测量：普通模式固定高度，全屏铺满视口（尺寸变化自动适配）
      const rect = container.getBoundingClientRect();
      const w = Math.max(rect.width, 320);
      const h = isFullscreenRef.current
        ? Math.max(320, window.innerHeight - 48)
        : BASE_HEIGHT;
      if (w !== sizeRef.current.width || h !== sizeRef.current.height) {
        sizeRef.current = { width: w, height: h };
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        selfNode.x = w / 2;
        selfNode.y = h / 2;
        selfNode.fx = w / 2;
        selfNode.fy = h / 2;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, sizeRef.current.width, sizeRef.current.height);
      const v = viewRef.current;
      ctx.setTransform(v.k * dpr, 0, 0, v.k * dpr, v.x * dpr, v.y * dpr);

      const isDark = document.documentElement.classList.contains('dark');

      // ---- 背景：径向光晕 + 淡网格（提升层次，避免空旷） ----
      const bgGrad = ctx.createRadialGradient(
        sizeRef.current.width / 2,
        sizeRef.current.height / 2,
        40,
        sizeRef.current.width / 2,
        sizeRef.current.height / 2,
        Math.max(sizeRef.current.width, sizeRef.current.height) * 0.55,
      );
      if (isDark) {
        bgGrad.addColorStop(0, 'rgba(34,197,94,0.10)');
        bgGrad.addColorStop(1, 'rgba(15,23,42,0)');
      } else {
        bgGrad.addColorStop(0, 'rgba(16,185,129,0.08)');
        bgGrad.addColorStop(1, 'rgba(255,255,255,0)');
      }
      ctx.beginPath();
      ctx.rect(
        (0 - v.x) / v.k,
        (0 - v.y) / v.k,
        sizeRef.current.width / v.k,
        sizeRef.current.height / v.k,
      );
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // 淡网格线（跟随视图缩放）
      ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.07)';
      ctx.lineWidth = 1 / v.k;
      const gridStep = 60;
      const w0 = (0 - v.x) / v.k;
      const h0 = (0 - v.y) / v.k;
      for (let gx = Math.floor(w0 / gridStep) * gridStep; gx < w0 + sizeRef.current.width / v.k; gx += gridStep) {
        ctx.beginPath();
        ctx.moveTo(gx, h0);
        ctx.lineTo(gx, h0 + sizeRef.current.height / v.k);
        ctx.stroke();
      }
      for (let gy = Math.floor(h0 / gridStep) * gridStep; gy < h0 + sizeRef.current.height / v.k; gy += gridStep) {
        ctx.beginPath();
        ctx.moveTo(w0, gy);
        ctx.lineTo(w0 + sizeRef.current.width / v.k, gy);
        ctx.stroke();
      }

      // hover 关联集合
      const hoverLinks = new Set<string>();
      if (hoverNode) {
        hoverLinks.add(hoverNode.id);
        for (const link of links) {
          const s = link.source as SimNode;
          const tt = link.target as SimNode;
          if (s.id === hoverNode.id) hoverLinks.add(tt.id);
          if (tt.id === hoverNode.id) hoverLinks.add(s.id);
        }
      }

      // ---- 连线 ----
      for (const link of links) {
        const s = link.source as SimNode;
        const tt = link.target as SimNode;
        if (s.x == null || s.y == null || tt.x == null || tt.y == null) continue;
        const linked = hoverNode && hoverLinks.has(s.id) && hoverLinks.has(tt.id);
        const dimmed = hoverNode && !linked;
        const color = link.relation === 'self' ? relationColor(tt.relation) : relationColor(link.relation);
        const widthPx = 1 + (Math.min(s.importance, tt.importance) / 5) * 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tt.x, tt.y);
        ctx.strokeStyle = color;
        ctx.globalAlpha = hoverNode ? (linked ? 0.9 : 0.08) : 0.4;
        ctx.lineWidth = dimmed ? 1 : widthPx;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // ---- 节点 ----
      for (const n of nodes) {
        if (n.x == null || n.y == null) continue;
        const r = nodeRadius(n.importance);
        const color = n.isSelf ? SELF_COLOR : relationColor(n.relation);
        const isHovered = hoverNode?.id === n.id;
        const isLinked = hoverNode && hoverLinks.has(n.id);
        const opacity = hoverNode ? (isHovered || isLinked ? 1 : 0.18) : 1;

        // 呼吸光晕（self 与高重要性节点）
        if (n.isSelf || n.importance >= 4) {
          const pulseR = r + (n.isSelf ? 18 : 10) + Math.sin(time * 2.4 + n.importance) * 5;
          const grad = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, pulseR);
          grad.addColorStop(0, color + '3d');
          grad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.globalAlpha = opacity * 0.75;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // self 金色外环（区别于其他节点）
        if (n.isSelf) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(250,204,21,0.75)';
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = opacity;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // 头像/关系图标圆（带投影提升层次）
        ctx.save();
        ctx.shadowColor = isDark ? 'rgba(0,0,0,0.55)' : 'rgba(15,23,42,0.28)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        if (n.avatar) {
          const img = getAvatarImage(n.avatar);
          if (img) {
            ctx.drawImage(img, n.x - r, n.y - r, r * 2, r * 2);
          } else {
            // 图片加载中：先用关系 emoji 占位
            ctx.fillStyle = color;
            ctx.fillRect(n.x - r, n.y - r, r * 2, r * 2);
            ctx.font = `${r * 0.95}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(n.isSelf ? '🧑' : (RELATION_ICONS[n.relation] || '💫'), n.x, n.y + 1);
          }
        } else {
          const grad = ctx.createLinearGradient(n.x - r, n.y - r, n.x + r, n.y + r);
          grad.addColorStop(0, color);
          grad.addColorStop(1, shadeColor(color, -18));
          ctx.fillStyle = grad;
          ctx.fillRect(n.x - r, n.y - r, r * 2, r * 2);
          ctx.font = `${r * 0.95}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            n.isSelf ? '🧑' : (RELATION_ICONS[n.relation] || '💫'),
            n.x,
            n.y + 1,
          );
        }
        ctx.restore();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // 描边
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255,255,255,0.75)';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.globalAlpha = opacity;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // 标签
        if (showLabels) {
          ctx.font = n.isSelf
            ? `bold 16px system-ui`
            : `${isHovered ? 'bold ' : ''}12px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = isDark ? '#d1d5db' : '#374151';
          ctx.globalAlpha = opacity;
          ctx.fillText(n.isSelf ? '我' : n.name, n.x, n.y - r - 7);
          ctx.globalAlpha = 1;
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    }
    render();

    // ---- 指针交互（手动实现缩放平移 + 节点拖拽） ----
    const getPos = (e: { clientX: number; clientY: number }): [number, number] => {
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    };

    // 记录按下位置，用于区分"点击"与"拖拽/平移"
    let downPos: [number, number] | null = null;

    const onPointerDown = (e: PointerEvent) => {
      const [sx, sy] = getPos(e);
      downPos = [sx, sy];
      const [wx, wy] = screenToWorld(sx, sy);
      const hit = hitTest(wx, wy);
      if (hit && !hit.isSelf) {
        dragNodeRef.current = hit;
        canvas.setPointerCapture(e.pointerId);
        simulation.alphaTarget(0.25).restart();
      } else {
        panStartRef.current = { px: sx, py: sy, tx: viewRef.current.x, ty: viewRef.current.y };
        canvas.setPointerCapture(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const [sx, sy] = getPos(e);
      const [wx, wy] = screenToWorld(sx, sy);

      // hover 检测（tooltip 变化时再更新 React 状态）
      const hit = hitTest(wx, wy);
      hoverNode = hit;
      canvas.style.cursor = hit ? 'pointer' : dragNodeRef.current ? 'grabbing' : 'grab';
      if (hit) {
        const next: TooltipState = { x: sx, y: sy, node: hit };
        const prev = tooltipRef.current;
        if (!prev || prev.node.id !== next.node.id) {
          tooltipRef.current = next;
          setTooltip(next);
        }
      } else if (tooltipRef.current) {
        tooltipRef.current = null;
        setTooltip(null);
      }

      if (dragNodeRef.current) {
        const n = dragNodeRef.current;
        n.fx = wx;
        n.fy = wy;
        return;
      }
      if (panStartRef.current) {
        const v = viewRef.current;
        v.x = panStartRef.current.tx + (sx - panStartRef.current.px);
        v.y = panStartRef.current.ty + (sy - panStartRef.current.py);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const [sx, sy] = getPos(e);
      const isClick =
        downPos !== null && Math.hypot(sx - downPos[0], sy - downPos[1]) < 6;
      downPos = null;

      if (dragNodeRef.current) {
        const n = dragNodeRef.current;
        n.fx = null;
        n.fy = null;
        dragNodeRef.current = null;
        simulation.alphaTarget(0);
      }
      panStartRef.current = null;

      // 点击人物节点 → 打开人物卡片（self 除外）
      if (isClick && !dragNodeRef.current) {
        const [wx, wy] = screenToWorld(sx, sy);
        const hit = hitTest(wx, wy);
        if (hit && !hit.isSelf && hit.person) {
          setSelectedPerson(hit.person);
        }
      }

      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // 未捕获指针时忽略
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const [sx, sy] = getPos(e);
      const v = viewRef.current;
      const factor = Math.exp(-e.deltaY * 0.0012);
      const k = Math.min(4, Math.max(0.25, v.k * factor));
      const [wx, wy] = screenToWorld(sx, sy);
      v.k = k;
      v.x = sx - wx * k;
      v.y = sy - wy * k;
    };

    const onDblClick = () => {
      fitView();
    };

    const onPointerLeave = () => {
      hoverNode = null;
      tooltipRef.current = null;
      setTooltip(null);
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', onDblClick);

    return () => {
      window.clearTimeout(fitTimer);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('dblclick', onDblClick);
      cancelAnimationFrame(animFrameRef.current);
      simulation.stop();
      simRef.current = null;
    };
  }, [visiblePeople, showLabels, self, fitView, screenToWorld, hitTest]);

  /** 头像图片缓存（加载完成后由渲染循环自动拾取） */
  const avatarCacheRef = useRef(new Map<string, HTMLImageElement>());
  const getAvatarImage = (url: string): HTMLImageElement | null => {
    let img = avatarCacheRef.current.get(url);
    if (!img) {
      img = new Image();
      img.src = url;
      avatarCacheRef.current.set(url, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
  };

  // 全屏状态监听
  useEffect(() => {
    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      isFullscreenRef.current = fs;
      setIsFullscreen(fs);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void containerRef.current?.requestFullscreen();
    }
  };

  return (
    <div className="space-y-4">
      {/* 图例筛选 */}
      <div className="flex flex-wrap gap-2">
        {legendItems.map((rel) => {
          const count = people.filter((p) => p.relation === rel).length;
          const isHidden = hiddenRelations.has(rel);
          return (
            <button
              key={rel}
              type="button"
              onClick={() => toggleRelation(rel)}
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors border
                ${
                  isHidden
                    ? 'border-gray-200 dark:border-gray-800 text-gray-400 line-through'
                    : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: relationColor(rel) }}
              />
              {t[rel as keyof typeof t] ?? rel} ({count})
            </button>
          );
        })}

        {/* 工具栏 */}
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowLabels((v) => !v)}
            className={`btn btn-xs ${showLabels ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t.showLabels}
          </button>
          <button type="button" onClick={fitView} className="btn btn-xs btn-ghost">
            {t.resetZoom}
          </button>
          <button type="button" onClick={toggleFullscreen} className="btn btn-xs btn-ghost">
            {isFullscreen ? t.exitFullscreen : t.fullscreen}
          </button>
        </div>
      </div>

      {/* Canvas 容器 */}
      {visiblePeople.length > 0 ? (
        <div
          ref={containerRef}
          className={`relative rounded-box border border-base-300 bg-base-100 overflow-hidden ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
          }`}
        >
          <canvas ref={canvasRef} className="w-full block" />

          {/* hover tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-10 px-3 py-2 rounded-lg shadow-lg text-xs
                         bg-white/95 dark:bg-gray-800/95 border border-base-300 dark:border-gray-700"
              style={{
                left: tooltip.x + 14,
                top: tooltip.y + 12,
                transform: 'translateY(0)',
              }}
            >
              <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: tooltip.node.isSelf ? SELF_COLOR : relationColor(tooltip.node.relation) }}
                />
                {tooltip.node.name}
                {tooltip.node.isSelf && <span className="font-normal text-gray-400">· 我</span>}
              </div>
              {!tooltip.node.isSelf && (
                <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                  {t[tooltip.node.relation as keyof typeof t] ?? tooltip.node.relation}
                  {' · '}
                  {'★'.repeat(tooltip.node.importance)}
                  {'☆'.repeat(5 - tooltip.node.importance)}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-3xl mb-3">🕸️</p>
          <p>{t.empty}</p>
        </div>
      )}

      {/* 人物卡片弹窗 */}
      {selectedPerson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPerson(null)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-base-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部渐变横幅（关系色） */}
            <div
              className="h-24"
              style={{
                background: `linear-gradient(135deg, ${relationColor(selectedPerson.relation)}, ${shadeColor(relationColor(selectedPerson.relation), -25)})`,
              }}
            />
            <button
              type="button"
              onClick={() => setSelectedPerson(null)}
              className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full bg-black/25 text-white hover:bg-black/40 transition-colors"
              aria-label="关闭"
            >
              ✕
            </button>

            {/* 头像叠在横幅上 */}
            <div className="relative -mt-12 px-6">
              <div
                className="w-24 h-24 rounded-full ring-4 ring-base-100 overflow-hidden shadow-lg grid place-items-center"
                style={{
                  background: `linear-gradient(135deg, ${relationColor(selectedPerson.relation)}, ${shadeColor(relationColor(selectedPerson.relation), -30)})`,
                }}
              >
                {selectedPerson.avatar ? (
                  <img
                    src={to(selectedPerson.avatar)}
                    alt={selectedPerson.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl" aria-hidden="true">
                    {RELATION_ICONS[selectedPerson.relation] || '💫'}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold mt-3">{selectedPerson.name}</h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: `${relationColor(selectedPerson.relation)}22`,
                    color: relationColor(selectedPerson.relation),
                  }}
                >
                  {t[selectedPerson.relation as keyof typeof t] ?? selectedPerson.relation}
                </span>
                <span className="text-amber-500 text-sm" aria-hidden="true">
                  {'★'.repeat(selectedPerson.importance)}
                  {'☆'.repeat(5 - selectedPerson.importance)}
                </span>
              </div>
            </div>

            <div className="px-6 pb-6 mt-5 space-y-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {selectedPerson.description}
              </p>

              {/* 共同经历时间轴 */}
              {selectedPerson.stories.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">{t.storiesTitle}</h4>
                  <ol className="relative border-l border-base-300 dark:border-gray-700 ml-2 space-y-4">
                    {selectedPerson.stories.map((story, i) => (
                      <li key={i} className="pl-5 relative">
                        <span
                          aria-hidden="true"
                          className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900"
                        />
                        <div className="text-xs text-gray-400 font-mono">{story.date}</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                          {story.event}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* 关联人物 */}
              {selectedPerson.links.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">{t.relatedPeople}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPerson.links.map((linkId) => {
                      const linked = people.find((p) => p.id === linkId);
                      if (!linked) return null;
                      return (
                        <button
                          key={linkId}
                          type="button"
                          onClick={() => setSelectedPerson(linked)}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700
                                     hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-300
                                     transition-colors"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: relationColor(linked.relation) }}
                          />
                          {linked.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
