# 🌐 网络可达性检测工具 (NetCheck)

检测本地电脑能访问哪些主流网站、哪些被屏蔽/不可达，并生成彩色 HTML 报告。

## 环境要求

- **Python** 3.8 或更高版本
- 已安装 `pip`

## 快速开始

```bash
# 1. 进入项目目录
cd net-check

# 2. 安装依赖（只需一次）
pip install -r requirements.txt

# 3. 运行检测
python net_check.py
```

运行后在终端会看到实时摘要，完成后自动生成 **HTML 报告文件**，用浏览器打开即可查看完整彩色报告。

## 使用方式

```bash
# 默认检测全部网站，生成 HTML 报告
python net_check.py

# 生成 Markdown 格式报告
python net_check.py -o md

# 同时生成 HTML + Markdown
python net_check.py -o both

# 只检测某个分组
python net_check.py -g AI大模型
python net_check.py -g 国内
python net_check.py -g 国际
python net_check.py -g 开发者

# 自定义超时和并发数
python net_check.py -t 10 -c 20

# 使用自定义网站列表
python net_check.py -f my_sites.json

# 禁用 SSL 验证（某些网络环境需要）
python net_check.py --no-ssl
```

## 命令行参数

| 参数 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--file` | `-f` | 网站列表 JSON 文件 | `sites.json` |
| `--timeout` | `-t` | 请求超时秒数 | `5` |
| `--concurrent` | `-c` | 并发请求数 | `10` |
| `--group` | `-g` | 只检测指定分组 | 全部 |
| `--output` | `-o` | 报告格式: html / md / both | `html` |
| `--no-ssl` | | 禁用 SSL 证书验证 | 关闭 |

## 检测分组

- **国际** (24 个) — Google, YouTube, GitHub, OpenAI, ChatGPT 等
- **国内** (27 个) — 百度、淘宝、京东、微博、B站、小红书等
- **AI大模型** (14 个) — DeepSeek、文心一言、通义千问、Kimi、豆包等
- **开发者** (10 个) — GitLab、NPM、PyPI、Hugging Face 等

## 自定义网站列表

编辑 `sites.json`，按以下格式添加/删除网站：

```json
{
  "分组名": [
    { "name": "显示名称", "domain": "example.com" }
  ]
}
```

## 报告说明

运行后在项目目录下生成 `report_YYYYMMDD_HHMMSS.html` 文件，包含：

- 📊 汇总统计卡片（总计、可达、被屏蔽、超时、DNS失败、错误）
- 📋 按分组排列的详细检测表格
- 🎨 颜色标记：绿色=可达、红色=被屏蔽、黄色=超时、紫色=错误

## 项目结构

```
net-check/
├── net_check.py          # 主程序
├── sites.json            # 网站列表配置
├── requirements.txt      # Python 依赖
└── report_*.html         # 生成的检测报告
```
