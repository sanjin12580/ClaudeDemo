#!/usr/bin/env python3
"""
网络可达性检测工具
检测本地电脑能访问哪些主流网站，哪些被屏蔽/不可达。
运行后自动生成 HTML 报告文件。
"""

import asyncio
import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path

import aiohttp

# ── 修复 Windows GBK 终端编码 ────────────────────────────
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ── 默认配置 ──────────────────────────────────────────────
DEFAULT_TIMEOUT = 5  # 秒
DEFAULT_CONCURRENT = 10
DEFAULT_SITES_FILE = "sites.json"


def load_sites(filepath: str) -> list:
    """加载网站列表 JSON 文件，返回 [(group, name, domain), ...]"""
    path = Path(filepath)
    if not path.exists():
        print(f"错误: 找不到网站列表文件 '{filepath}'")
        sys.exit(1)

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    sites = []
    for group, entries in data.items():
        for entry in entries:
            sites.append((group, entry["name"], entry["domain"]))
    return sites


async def check_site(
    session: aiohttp.ClientSession,
    name: str,
    domain: str,
    timeout: int,
    no_ssl: bool,
) -> dict:
    """检测单个网站可达性，优先 HTTPS"""
    ssl_flag = False if no_ssl else None

    # 构建 URL 列表：优先 https，加上 www 变体，最后 http 回退
    urls = []
    for scheme in ["https", "http"]:
        for host in {domain, f"www.{domain}"}:
            urls.append(f"{scheme}://{host}")

    for url in urls:
        try:
            start = time.monotonic()
            async with session.head(
                url,
                timeout=aiohttp.ClientTimeout(total=timeout),
                ssl=ssl_flag,
                allow_redirects=True,
            ) as resp:
                latency = round((time.monotonic() - start) * 1000)
                return {
                    "name": name, "domain": domain,
                    "status": "ok", "code": resp.status, "latency_ms": latency,
                }
        except (asyncio.TimeoutError, aiohttp.ServerTimeoutError):
            continue
        except aiohttp.ClientConnectorError:
            continue
        except aiohttp.ClientError:
            continue

    # 所有 URL 都失败 — 做一次最终诊断
    try:
        async with session.head(
            f"https://{domain}",
            timeout=aiohttp.ClientTimeout(total=min(timeout, 4)),
            ssl=ssl_flag,
            allow_redirects=True,
        ) as resp:
            return {
                "name": name, "domain": domain,
                "status": "ok", "code": resp.status, "latency_ms": None,
            }
    except asyncio.TimeoutError:
        return {
            "name": name, "domain": domain,
            "status": "timeout", "code": None, "latency_ms": None,
        }
    except aiohttp.ClientConnectorError as e:
        err = str(e)
        if any(kw in err for kw in [
            "Connection reset", "Connection refused",
            "Cannot connect to host", "Tunnel connection failed",
        ]):
            return {
                "name": name, "domain": domain,
                "status": "blocked", "code": None, "latency_ms": None,
            }
        if "getaddrinfo failed" in err or "Name or service not known" in err:
            return {
                "name": name, "domain": domain,
                "status": "dns_fail", "code": None, "latency_ms": None,
            }
        return {
            "name": name, "domain": domain,
            "status": "error", "code": None, "latency_ms": None, "error": err,
        }
    except aiohttp.ClientError as e:
        return {
            "name": name, "domain": domain,
            "status": "error", "code": None, "latency_ms": None, "error": str(e),
        }


async def check_all(
    sites: list, timeout: int, concurrent: int, no_ssl: bool,
) -> list:
    """并发检测所有网站"""
    semaphore = asyncio.Semaphore(concurrent)

    async def run(session, name, domain):
        async with semaphore:
            return await check_site(session, name, domain, timeout, no_ssl)

    connector = aiohttp.TCPConnector(limit=concurrent, force_close=True)
    timeout_obj = aiohttp.ClientTimeout(total=timeout)

    async with aiohttp.ClientSession(
        connector=connector, timeout=timeout_obj,
    ) as session:
        tasks = [run(session, name, domain) for _, name, domain in sites]
        results = await asyncio.gather(*tasks)

    return list(results)


# ── 状态标签 ──────────────────────────────────────────────

STATUS_LABELS = {
    "ok": ("可达", "ok"),
    "blocked": ("被屏蔽", "blocked"),
    "timeout": ("超时", "timeout"),
    "dns_fail": ("DNS失败", "error"),
    "error": ("错误", "error"),
}


def build_groups(results: list, sites: list) -> list:
    """将结果按分组整理，保持原始顺序"""
    group_order = []
    group_data = {}
    result_map = {(r["name"], r["domain"]): r for r in results}

    for group, name, domain in sites:
        if group not in group_data:
            group_data[group] = []
            group_order.append(group)
        r = result_map.get((name, domain))
        if r:
            group_data[group].append(r)

    return [(g, group_data[g]) for g in group_order]


def summarize(results: list) -> dict:
    """生成统计摘要"""
    return {
        "total": len(results),
        "ok": sum(1 for r in results if r["status"] == "ok"),
        "blocked": sum(1 for r in results if r["status"] == "blocked"),
        "timeout": sum(1 for r in results if r["status"] == "timeout"),
        "dns_fail": sum(1 for r in results if r["status"] == "dns_fail"),
        "error": sum(1 for r in results if r["status"] == "error"),
    }


# ── HTML 报告生成 ─────────────────────────────────────────

def generate_html(results: list, sites: list, elapsed: float, timeout: int) -> str:
    """生成完整的 HTML 报告"""
    groups = build_groups(results, sites)
    summary = summarize(results)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 各分组的表格行
    group_tables = ""
    for group_name, entries in groups:
        rows = ""
        for r in entries:
            label, css_class = STATUS_LABELS.get(r["status"], ("未知", "error"))
            code_cell = f"<code>{r['code']}</code>" if r["code"] else "—"
            latency_cell = f"{r['latency_ms']} ms" if r["latency_ms"] else "—"
            rows += f"""<tr class="{css_class}">
                <td>{r['name']}</td>
                <td class="domain">{r['domain']}</td>
                <td><span class="badge badge-{css_class}">{label}</span></td>
                <td>{code_cell}</td>
                <td class="latency">{latency_cell}</td>
            </tr>"""

        group_tables += f"""
        <div class="group">
            <h2>{group_name}</h2>
            <table>
                <thead><tr>
                    <th>网站</th><th>域名</th><th>状态</th><th>状态码</th><th>延迟</th>
                </tr></thead>
                <tbody>{rows}</tbody>
            </table>
        </div>"""

    # 汇总卡片
    cards = ""
    for key, label, emoji in [
        ("total", "总计", "📊"),
        ("ok", "可达", "✅"),
        ("blocked", "被屏蔽", "🚫"),
        ("timeout", "超时", "⏱️"),
        ("dns_fail", "DNS失败", "🌐"),
        ("error", "错误", "⚠️"),
    ]:
        cards += f"""<div class="card card-{key}">
            <div class="card-emoji">{emoji}</div>
            <div class="card-value">{summary[key]}</div>
            <div class="card-label">{label}</div>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>网络可达性检测报告 — {now}</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
    font-family: -apple-system, "Microsoft YaHei", "PingFang SC", sans-serif;
    background: #f5f7fa; color: #333; line-height: 1.6;
}}
.container {{ max-width: 960px; margin: 0 auto; padding: 24px; }}
.header {{
    text-align: center; padding: 40px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff; border-radius: 12px; margin-bottom: 24px;
}}
.header h1 {{ font-size: 28px; margin-bottom: 8px; }}
.header .time {{ opacity: 0.85; font-size: 14px; }}
.summary {{ display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 24px; }}
.card {{
    background: #fff; border-radius: 10px; padding: 20px 12px; text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}}
.card-emoji {{ font-size: 28px; margin-bottom: 6px; }}
.card-value {{ font-size: 32px; font-weight: 700; }}
.card-label {{ font-size: 13px; color: #888; margin-top: 2px; }}
.card-ok .card-value {{ color: #22c55e; }}
.card-blocked .card-value {{ color: #ef4444; }}
.card-timeout .card-value {{ color: #f59e0b; }}
.card-dns_fail .card-value, .card-error .card-value {{ color: #a855f7; }}
.card-total .card-value {{ color: #3b82f6; }}
.group {{
    background: #fff; border-radius: 10px; padding: 24px; margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}}
.group h2 {{
    font-size: 20px; color: #667eea; margin-bottom: 16px;
    padding-bottom: 10px; border-bottom: 2px solid #eef0ff;
}}
table {{ width: 100%; border-collapse: collapse; }}
th {{
    text-align: left; padding: 10px 12px; font-size: 13px;
    color: #888; border-bottom: 2px solid #eee; font-weight: 600;
}}
td {{ padding: 10px 12px; border-bottom: 1px solid #f5f5f5; font-size: 14px; }}
tr:last-child td {{ border-bottom: none; }}
.domain {{ color: #999; font-size: 13px; font-family: "SF Mono", "Consolas", monospace; }}
.latency {{ font-family: "SF Mono", "Consolas", monospace; color: #666; }}
.badge {{
    display: inline-block; padding: 3px 10px; border-radius: 12px;
    font-size: 12px; font-weight: 600;
}}
.badge-ok {{ background: #dcfce7; color: #16a34a; }}
.badge-blocked {{ background: #fef2f2; color: #dc2626; }}
.badge-timeout {{ background: #fffbeb; color: #d97706; }}
.badge-error {{ background: #faf5ff; color: #9333ea; }}
tr.blocked {{ background: #fffbff; }}
tr.timeout {{ background: #fffffa; }}
.footer {{
    text-align: center; padding: 24px; color: #aaa; font-size: 13px;
}}
.footer span {{ margin: 0 12px; }}
@media (max-width: 768px) {{
    .summary {{ grid-template-columns: repeat(3, 1fr); }}
    .container {{ padding: 12px; }}
}}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🌐 网络可达性检测报告</h1>
        <div class="time">检测时间: {now} &nbsp;|&nbsp; 耗时: {elapsed:.1f} 秒 &nbsp;|&nbsp; 超时设置: {timeout}s</div>
    </div>
    <div class="summary">{cards}</div>
    {group_tables}
    <div class="footer">
        <span>NetCheck Tool</span><span>|</span><span>{now}</span>
    </div>
</div>
</body>
</html>"""


# ── Markdown 报告生成 ─────────────────────────────────────

def generate_markdown(results: list, sites: list, elapsed: float, timeout: int) -> str:
    """生成 Markdown 格式报告"""
    groups = build_groups(results, sites)
    summary = summarize(results)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    lines = [
        f"# 🌐 网络可达性检测报告",
        f"",
        f"**检测时间**: {now} | **耗时**: {elapsed:.1f}s | **超时**: {timeout}s",
        f"",
        f"## 📊 汇总",
        f"",
        f"| 总计 | ✅ 可达 | 🚫 被屏蔽 | ⏱️ 超时 | 🌐 DNS失败 | ⚠️ 错误 |",
        f"|------|---------|-----------|---------|-----------|---------|",
        f"| {summary['total']} | {summary['ok']} | {summary['blocked']} | {summary['timeout']} | {summary['dns_fail']} | {summary['error']} |",
        f"",
    ]

    for group_name, entries in groups:
        lines.append(f"## {group_name}")
        lines.append("")
        lines.append("| 网站 | 域名 | 状态 | 状态码 | 延迟 |")
        lines.append("|------|------|------|--------|------|")
        for r in entries:
            label, _ = STATUS_LABELS.get(r["status"], ("未知", "error"))
            code_str = str(r["code"]) if r["code"] else "—"
            latency_str = f"{r['latency_ms']}ms" if r["latency_ms"] else "—"
            icon = {"ok": "✅", "blocked": "🚫", "timeout": "⏱️", "dns_fail": "🌐", "error": "⚠️"}.get(r["status"], "❓")
            lines.append(
                f"| {r['name']} | {r['domain']} | {icon} {label} | {code_str} | {latency_str} |"
            )
        lines.append("")

    lines.append("---")
    lines.append(f"*报告生成于 {now}*")
    return "\n".join(lines)


# ── 终端摘要输出 ──────────────────────────────────────────

COLORS = {
    "ok": "\033[92m", "blocked": "\033[91m", "timeout": "\033[93m",
    "dns_fail": "\033[95m", "error": "\033[95m",
    "bold": "\033[1m", "dim": "\033[2m", "cyan": "\033[96m", "reset": "\033[0m",
}


def print_summary(results: list, sites: list, elapsed: float, report_path: str) -> None:
    """终端输出简要摘要"""
    summary = summarize(results)
    groups = build_groups(results, sites)
    c = COLORS

    print()
    print(f"{c['bold']}{'═' * 60}{c['reset']}")
    print(f"{c['bold']}  网络可达性检测完成{c['reset']}")
    print(f"{c['dim']}  时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  |  "
          f"耗时: {elapsed:.1f}s{c['reset']}")
    print(f"{c['bold']}{'═' * 60}{c['reset']}")
    print(f"  总计 {c['bold']}{summary['total']}{c['reset']}  |  "
          f"{c['ok']}可达 {summary['ok']}{c['reset']}  |  "
          f"{c['blocked']}被屏蔽 {summary['blocked']}{c['reset']}  |  "
          f"{c['timeout']}超时 {summary['timeout']}{c['reset']}  |  "
          f"{c['dns_fail']}DNS失败 {summary['dns_fail']}{c['reset']}  |  "
          f"{c['error']}错误 {summary['error']}{c['reset']}")
    print(f"{c['bold']}{'═' * 60}{c['reset']}")
    print()

    for group_name, entries in groups:
        ok_n = sum(1 for r in entries if r["status"] == "ok")
        blocked_n = sum(1 for r in entries if r["status"] == "blocked")
        total_n = len(entries)
        print(f"  {c['cyan']}{c['bold']}{group_name}{c['reset']} "
              f"({ok_n}/{total_n} 可达)")

        for r in entries:
            label, _ = STATUS_LABELS.get(r["status"], ("未知", "error"))
            code_str = f" {r['code']}" if r['code'] else ""
            latency_str = f" {r['latency_ms']}ms" if r['latency_ms'] else ""
            color = COLORS.get(r["status"], "")
            icon = {"ok": "+", "blocked": "x", "timeout": "~",
                    "dns_fail": "?", "error": "!"}.get(r["status"], "?")
            print(
                f"    {color}[{icon}] {r['name']:<16} {c['dim']}{r['domain']:<28}{c['reset']}"
                f"  {color}{label}{code_str}{latency_str}{c['reset']}"
            )
        print()

    print(f"{c['bold']}  详细报告已保存到: {report_path}{c['reset']}")
    print(f"{c['dim']}  用浏览器打开即可查看完整彩色报告{c['reset']}")
    print()


# ── 主入口 ────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="网络可达性检测工具 — 检测本地电脑能访问哪些主流网站，生成 HTML 报告",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python net_check.py                          # 默认检测，生成 report.html
  python net_check.py -o md                    # 生成 Markdown 格式报告
  python net_check.py -o both                  # 同时生成 HTML + Markdown
  python net_check.py -t 10 -c 20              # 超时 10s，20 并发
  python net_check.py -g AI大模型               # 只检测 AI 大模型分组
  python net_check.py -f my_sites.json         # 使用自定义网站列表
  python net_check.py --no-ssl                 # 禁用 SSL 验证
        """,
    )
    parser.add_argument(
        "-f", "--file", default=DEFAULT_SITES_FILE,
        help=f"网站列表 JSON 文件 (默认: {DEFAULT_SITES_FILE})",
    )
    parser.add_argument(
        "-t", "--timeout", type=int, default=DEFAULT_TIMEOUT,
        help=f"请求超时秒数 (默认: {DEFAULT_TIMEOUT})",
    )
    parser.add_argument(
        "-c", "--concurrent", type=int, default=DEFAULT_CONCURRENT,
        help=f"并发请求数 (默认: {DEFAULT_CONCURRENT})",
    )
    parser.add_argument(
        "--no-ssl", action="store_true",
        help="禁用 SSL 证书验证（某些网络环境下需要）",
    )
    parser.add_argument(
        "-g", "--group", metavar="NAME",
        help="只检测指定分组（如: 国际、国内、AI大模型、开发者）",
    )
    parser.add_argument(
        "-o", "--output", default="html", choices=["html", "md", "both"],
        help="报告格式: html / md / both (默认: html)",
    )

    args = parser.parse_args()

    # 解析 sites.json 路径
    script_dir = Path(__file__).parent
    sites_path = args.file
    if not Path(sites_path).is_absolute():
        if (script_dir / sites_path).exists():
            sites_path = str(script_dir / sites_path)

    # 加载
    all_sites = load_sites(sites_path)
    if args.group:
        all_sites = [(g, n, d) for g, n, d in all_sites if g == args.group]
        if not all_sites:
            print(f"错误: 找不到分组 '{args.group}'")
            sys.exit(1)

    group_names = sorted(set(g for g, _, _ in all_sites))
    print(f"\n正在检测 {len(all_sites)} 个网站 "
          f"({', '.join(group_names)}) ...")
    print(f"超时: {args.timeout}s | 并发: {args.concurrent}")
    print()

    # 检测
    start_time = time.monotonic()
    results = asyncio.run(check_all(
        all_sites, timeout=args.timeout,
        concurrent=args.concurrent, no_ssl=args.no_ssl,
    ))
    elapsed = time.monotonic() - start_time

    # 生成报告
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if args.output in ("html", "both"):
        html_path = script_dir / f"report_{timestamp}.html"
        html_content = generate_html(results, all_sites, elapsed, args.timeout)
        html_path.write_text(html_content, encoding="utf-8")
        report_path = str(html_path)

    if args.output in ("md", "both"):
        md_path = script_dir / f"report_{timestamp}.md"
        md_content = generate_markdown(results, all_sites, elapsed, args.timeout)
        md_path.write_text(md_content, encoding="utf-8")
        if args.output == "md":
            report_path = str(md_path)
        else:
            report_path = f"{html_path} 和 {md_path}"

    # 终端摘要
    print_summary(results, all_sites, elapsed, report_path)


if __name__ == "__main__":
    main()
