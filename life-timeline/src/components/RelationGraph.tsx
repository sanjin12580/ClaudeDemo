import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { Person } from '../lib/types';
import { RELATION_COLORS } from '../lib/types';
import { useI18n } from '../lib/i18n';

interface Props {
  people: Person[];
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  relation: string;
  importance: number;
  person: Person;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
  relation: string;
}

const RELATIONS_ORDER = ['家人', '爱人', '挚友', '导师', '同事', '同学', '萍水相逢', '观众', '其他'] as const;

export default function RelationGraph({ people }: Props) {
  const { relations: t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [hiddenRelations, setHiddenRelations] = useState<Set<string>>(new Set());
  const animFrameRef = useRef<number>(0);

  // 过滤可见的人物
  const visiblePeople = people.filter((p) => !hiddenRelations.has(p.relation));

  // 图例切换
  const toggleRelation = useCallback((rel: string) => {
    setHiddenRelations((prev) => {
      const next = new Set(prev);
      if (next.has(rel)) next.delete(rel);
      else next.add(rel);
      return next;
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || visiblePeople.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const context = ctx;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 500;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 构建节点和连线
    const nodes: SimNode[] = visiblePeople.map((p) => ({
      id: p.id,
      name: p.name,
      relation: p.relation,
      importance: p.importance,
      person: p,
    }));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const links: SimLink[] = [];
    for (const p of visiblePeople) {
      for (const linkId of p.links) {
        if (nodeMap.has(linkId)) {
          links.push({
            source: p.id,
            target: linkId,
            relation: p.relation,
          });
        }
      }
    }

    // 力仿真
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => 20 + (d as SimNode).importance * 6));

    // 拖拽
    d3
      .drag<HTMLCanvasElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    // 粒子
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    // 鼠标状态
    let hoverNode: SimNode | null = null;
    let mouseX = 0;
    let mouseY = 0;

    // Canvas 鼠标事件
    const onMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;

      // 检测 hover
      let found: SimNode | null = null;
      for (const node of nodes) {
        if (node.x == null || node.y == null) continue;
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        const radius = 14 + node.importance * 5;
        if (dx * dx + dy * dy < radius * radius) {
          found = node;
          break;
        }
      }
      hoverNode = found;
      canvas.style.cursor = found ? 'pointer' : 'grab';
    };

    const onClick = () => {
      if (hoverNode) {
        setSelectedPerson(hoverNode.person);
      }
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);

    // 渲染循环
    let time = 0;
    function render() {
      context.clearRect(0, 0, width, height);
      time += 0.016;

      // 暗色模式检测
      const isDark = document.documentElement.classList.contains('dark');

      // 绘制粒子背景
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        context.beginPath();
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fillStyle = isDark
          ? `rgba(74, 222, 128, ${p.alpha * 0.3})`
          : `rgba(34, 197, 94, ${p.alpha * 0.3})`;
        context.fill();
      }

      // 获取 hover 节点的关联节点
      const hoverLinks = new Set<string>();
      if (hoverNode) {
        hoverLinks.add(hoverNode.id);
        for (const link of links) {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          if (sourceId === hoverNode.id) hoverLinks.add(targetId);
          if (targetId === hoverNode.id) hoverLinks.add(sourceId);
        }
      }

      // 绘制连线
      for (const link of links) {
        const source = link.source as SimNode;
        const target = link.target as SimNode;
        if (source.x == null || source.y == null || target.x == null || target.y == null) continue;

        const isHovered = hoverNode && (hoverLinks.has(source.id) && hoverLinks.has(target.id));
        const opacity = hoverNode ? (isHovered ? 0.8 : 0.1) : 0.5;

        context.beginPath();
        context.moveTo(source.x, source.y);
        context.lineTo(target.x, target.y);
        context.strokeStyle = RELATION_COLORS[source.person.relation as keyof typeof RELATION_COLORS] || '#6b7280';
        context.globalAlpha = opacity;
        context.lineWidth = isHovered ? 2 : 1;
        context.stroke();
        context.globalAlpha = 1;
      }

      // 绘制节点
      for (const node of nodes) {
        if (node.x == null || node.y == null) continue;
        const radius = 14 + node.importance * 5;
        const isHovered = hoverNode?.id === node.id;
        const isLinked = hoverNode && hoverLinks.has(node.id);
        const opacity = hoverNode ? (isHovered || isLinked ? 1 : 0.2) : 1;

        // 脉冲光环（高重要性节点）
        if (node.importance >= 4) {
          const pulseR = radius + 8 + Math.sin(time * 3 + node.importance) * 5;
          const gradient = context.createRadialGradient(node.x, node.y, radius, node.x, node.y, pulseR);
          const color = RELATION_COLORS[node.person.relation as keyof typeof RELATION_COLORS] || '#6b7280';
          gradient.addColorStop(0, color + '40');
          gradient.addColorStop(1, 'transparent');
          context.beginPath();
          context.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
          context.fillStyle = gradient;
          context.globalAlpha = opacity * 0.6;
          context.fill();
          context.globalAlpha = 1;
        }

        // 节点圆
        context.beginPath();
        context.arc(node.x, node.y, radius, 0, Math.PI * 2);
        const color = RELATION_COLORS[node.person.relation as keyof typeof RELATION_COLORS] || '#6b7280';
        context.fillStyle = color + 'cc';
        context.globalAlpha = opacity;
        context.fill();

        // 边框
        context.strokeStyle = isHovered ? '#fff' : 'transparent';
        context.lineWidth = 2;
        context.stroke();
        context.globalAlpha = 1;

        // 文字标签
        context.font = `${isHovered ? 'bold ' : ''}12px system-ui`;
        context.textAlign = 'center';
        context.fillStyle = isDark ? '#d1d5db' : '#374151';
        context.globalAlpha = opacity;
        context.fillText(node.name, node.x, node.y - radius - 8);
        context.globalAlpha = 1;
      }

      animFrameRef.current = requestAnimationFrame(render);
    }

    render();

    // 滚轮缩放（用 transform 模拟，这里用简单的透明度技巧）
    // D3 的 zoom 作用在 canvas 上比较复杂，暂用拖拽代替

    return () => {
      simulation.stop();
      cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
    };
  }, [visiblePeople]);

  return (
    <div className="space-y-4">
      {/* 图例 */}
      <div className="flex flex-wrap gap-2">
        {RELATIONS_ORDER.map((rel) => {
          const count = people.filter((p) => p.relation === rel).length;
          if (count === 0) return null;
          const isHidden = hiddenRelations.has(rel);
          return (
            <button
              key={rel}
              onClick={() => toggleRelation(rel)}
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors border
                ${isHidden
                  ? 'border-gray-200 dark:border-gray-800 text-gray-400 line-through'
                  : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: RELATION_COLORS[rel as keyof typeof RELATION_COLORS] }}
              />
              {t[rel as keyof typeof t] ?? rel} ({count})
            </button>
          );
        })}
      </div>

      {/* Canvas 容器 */}
      <div
        ref={containerRef}
        className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
      >
        <canvas ref={canvasRef} className="w-full block" />
      </div>

      {/* 人物详情侧边面板 */}
      {selectedPerson && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={() => setSelectedPerson(null)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative w-80 max-w-full h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPerson(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg"
            >
              ✕
            </button>

            {/* 人物信息 */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                style={{
                  backgroundColor: RELATION_COLORS[selectedPerson.relation as keyof typeof RELATION_COLORS] || '#6b7280',
                }}
              >
                {selectedPerson.name[0]}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{selectedPerson.name}</h3>
                <span className="text-sm text-gray-500">
                  {t[selectedPerson.relation as keyof typeof t] ?? selectedPerson.relation}
                  {' · '}
                  {'★'.repeat(selectedPerson.importance)}{'☆'.repeat(5 - selectedPerson.importance)}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {selectedPerson.description}
            </p>

            {/* 共同经历 */}
            {selectedPerson.stories.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">{t.storiesTitle}</h4>
                <div className="space-y-3">
                  {selectedPerson.stories.map((story, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-sm p-3 rounded-lg bg-gray-50 dark:bg-gray-950"
                    >
                      <span className="text-xs text-gray-400 font-mono shrink-0 mt-0.5">
                        {story.date}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{story.event}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 关联人物 */}
            {selectedPerson.links.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">{t.relatedPeople}</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPerson.links.map((linkId) => {
                    const linked = people.find((p) => p.id === linkId);
                    if (!linked) return null;
                    return (
                      <button
                        key={linkId}
                        onClick={() => setSelectedPerson(linked)}
                        className="text-xs px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700
                                   hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-300
                                   transition-colors"
                      >
                        {linked.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
