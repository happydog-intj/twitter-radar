# Twitter Radar 🔭

自动监控 Twitter 账号并使用 Qwen AI 分析推文情感和 SHEIN 相关性。

[![Daily Analysis](https://github.com/YOUR_USERNAME/twitter-radar/actions/workflows/daily-analysis.yml/badge.svg)](https://github.com/YOUR_USERNAME/twitter-radar/actions/workflows/daily-analysis.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 功能特性

### 数据采集
- 📱 **Twitter API v2** - 获取指定账号的最新推文
- 🍎 **App Store Reviews** - 抓取 SHEIN app iOS 用户评论（美国、英国、加拿大、澳大利亚）
- 🤖 **Google Play Reviews** - 抓取 SHEIN app Android 用户评论（美国、英国、印度、巴西、墨西哥）
- ⏰ **定时采集** - 每天自动运行
- 🎯 **灵活配置** - 支持监控多个账号和地区
- 📊 **丰富数据** - 包含点赞、转发、回复、评分、开发者回复等互动数据

### AI 智能分析
- 🧠 **Qwen 情感分析** - 使用阿里云通义千问分析推文和评论情感
- 🎯 **SHEIN 相关性判断** - AI 智能判断 Twitter 内容是否与 SHEIN 品牌相关
- 🏷️ **主题识别** - App Store 评论自动识别讨论主题（物流、质量、价格、体验等）
- 📈 **置信度评分** - 每个分析结果都带有置信度
- 🔍 **关键词提取** - 自动识别 SHEIN 相关关键词

### 报告生成
- 📝 **双语报告** - 支持中英文报告
- 📊 **数据统计** - Twitter: 总览、情感分布、相关性 | App Store/Google Play: 评分分布、主题统计、开发者回复率
- 🎨 **分类展示** - Twitter: 按情感、账号、相关性 | App Store/Google Play: 按地区、评分、情感
- 🌍 **多地区对比** - App Store (4地区) + Google Play (5地区) 全球市场覆盖
- 📡 **RSS 订阅** - 自动生成 RSS feed

### 多渠道发布
- 📁 **GitHub 仓库** - 自动提交报告文件
- 📋 **GitHub Issues** - 每日自动创建 Issue
- 📱 **Telegram 通知** - 推送关键摘要
- 🌐 **GitHub Pages** - 托管 RSS feed

## 📁 项目结构

```
twitter-radar/
├── .github/workflows/
│   ├── analyze.yml               # Twitter 分析工作流
│   ├── analyze-appstore.yml      # App Store 分析工作流
│   ├── analyze-googleplay.yml    # Google Play 分析工作流
│   └── pages.yml                 # GitHub Pages 部署
├── config/
│   └── config.yml                # 配置文件（监控账号、关键词等）
├── src/
│   ├── collectors/
│   │   ├── twitter.ts            # Twitter API 集成
│   │   ├── app-store.ts          # App Store 评论抓取
│   │   └── google-play.ts        # Google Play 评论抓取
│   ├── analyzers/
│   │   ├── qwen.ts               # Twitter Qwen AI 分析
│   │   ├── app-store.ts          # App Store Qwen AI 分析
│   │   └── google-play.ts        # Google Play Qwen AI 分析
│   ├── generators/
│   │   ├── markdown.ts           # Twitter Markdown 报告生成
│   │   ├── app-store-markdown.ts # App Store Markdown 报告生成
│   │   ├── google-play-markdown.ts # Google Play Markdown 报告生成
│   │   └── rss.ts                # RSS feed 生成
│   ├── notifiers/
│   │   └── telegram.ts           # Telegram 通知
│   ├── types.ts                  # TypeScript 类型定义
│   ├── config.ts                 # 配置加载
│   └── index.ts                  # 主程序入口
├── reports/                      # 生成的报告（自动创建）
├── public/                       # RSS feed（自动创建）
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+
- Twitter Developer Account (获取 Bearer Token)
- 阿里云账号 (获取 Qwen API Key)

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/twitter-radar.git
cd twitter-radar

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 添加 API keys
```

### 配置 API Keys

#### 1. Twitter Bearer Token

1. 访问 [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. 创建新应用或使用现有应用
3. 进入 Keys and Tokens
4. 生成 Bearer Token
5. 复制到 `.env` 文件：
   ```
   TWITTER_BEARER_TOKEN=your-bearer-token
   ```

#### 2. Qwen API Key

1. 访问 [阿里云 DashScope 控制台](https://dashscope.console.aliyun.com/)
2. 开通通义千问服务
3. 创建 API Key
4. 复制到 `.env` 文件：
   ```
   QWEN_API_KEY=sk-xxxxxxxx
   ```

#### 3. Telegram Bot（可选）

1. 在 Telegram 中搜索 `@BotFather`
2. 发送 `/newbot` 创建机器人
3. 获取 bot token 和 chat ID
4. 添加到 `.env`：
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
   TELEGRAM_CHAT_ID=your-chat-id
   ```

### 配置监控账号

编辑 `config/config.yml`:

```yaml
twitter:
  accounts:
    - username: shein_official
      priority: high
      description: "SHEIN官方账号"

    - username: ZARA
      priority: medium
      description: "竞品ZARA"

  maxTweetsPerAccount: 50
  sinceDays: 7  # 获取最近7天的推文
```

### 本地运行

```bash
# 构建项目
pnpm build

# 运行分析
pnpm analyze

# 或开发模式
pnpm dev
```

## 📊 分析示例

### 输出报告

```markdown
# Twitter Radar - 2026-03-08

## 📊 总览

- **总推文数**: 150
- **SHEIN相关**: 45 (30.0%)

### 情感分析
- 😊 正面: 60 (40.0%)
- 😐 中性: 70 (46.7%)
- 😞 负面: 20 (13.3%)

## 🎯 SHEIN相关推文

### 😊 正面评价 (25)

#### 😊 [@shein_official](...)
> Just launched our new sustainable collection! 🌱...

💙 1.2K | 🔁 450 | 💬 89

**情感**: 非常积极的产品发布推文，用户反馈良好
**SHEIN相关性**: 官方账号发布新品信息
**关键词**: SHEIN, sustainable, collection
```

### Qwen AI 分析

每条推文都会进行：

1. **情感分析**
   - 分类：positive/negative/neutral
   - 评分：-1 (最负面) 到 1 (最正面)
   - 置信度：0-1
   - 摘要：简短的情感描述

2. **SHEIN 相关性判断**
   - 是否相关：true/false
   - 置信度：0-1
   - 判断原因：为什么认为相关或不相关
   - 关键词：识别到的相关词汇

## 🔧 GitHub Actions 配置

### 触发方式

1. **定时运行**：每天 UTC 08:00（北京时间 16:00）
2. **手动触发**：在 Actions 页面点击 "Run workflow"
3. **推送触发**：修改工作流文件时自动运行

### 配置 Secrets

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中添加：

- `TWITTER_BEARER_TOKEN` - Twitter API Bearer Token
- `QWEN_API_KEY` - Qwen API Key
- `TELEGRAM_BOT_TOKEN` - （可选）Telegram Bot Token
- `TELEGRAM_CHAT_ID` - （可选）Telegram Chat ID

### 运行流程

```
触发工作流
    ↓
采集推文 (Twitter API)
    ↓
AI 分析 (Qwen API)
  ├─ 情感分析
  └─ SHEIN 相关性判断
    ↓
生成报告 (Markdown + RSS)
    ↓
发布
  ├─ Git 提交
  ├─ 创建 Issue
  ├─ Telegram 通知
  └─ GitHub Pages 部署
```

## 📈 数据分析

### 监控的指标

- 推文数量（总数、SHEIN相关）
- 情感分布（正面、中性、负面）
- 互动数据（点赞、转发、回复）
- 关键词出现频率
- 账号活跃度

### 分析维度

1. **按账号分类** - 查看每个账号的推文和情感
2. **按情感分类** - 分别查看正面、负面、中性推文
3. **SHEIN相关性** - 筛选出所有相关推文
4. **时间趋势** - 跨日期对比（需多日数据）

## 🎛️ 自定义配置

### 修改监控账号

编辑 `config/config.yml` 的 `twitter.accounts` 部分：

```yaml
twitter:
  accounts:
    - username: your_account
      priority: high
      description: "描述"
```

### 修改 SHEIN 关键词

编辑 `config/config.yml` 的 `shein` 部分：

```yaml
shein:
  keywords:
    - shein
    - "#shein"
    - 自定义关键词

  brands:
    - SHEIN
    - 相关品牌

  relatedTerms:
    - "快时尚"
    - "相关术语"
```

### 调整 Qwen 模型

```yaml
qwen:
  model: "qwen-plus"  # qwen-turbo, qwen-plus, qwen-max
```

- `qwen-turbo` - 最快，成本最低
- `qwen-plus` - 平衡性能和成本（推荐）
- `qwen-max` - 最强，成本最高

## 💰 成本估算

### Twitter API
- **免费套餐**：每月 50 万条推文
- 本项目预计：~1000 条/月
- **成本**：免费

### Qwen API
- **按Token计费**
- qwen-plus：约 ¥0.008/千tokens
- 平均每条推文分析：~500 tokens
- 每天 100 条推文：~¥4/月
- **成本**：低成本

### GitHub Actions
- 公开仓库：免费无限分钟
- **成本**：免费

### 总计
月成本约 **¥4-10**（主要是 Qwen API）

## 🔍 故障排查

### Twitter API 错误

**错误：401 Unauthorized**
- 检查 `TWITTER_BEARER_TOKEN` 是否正确
- 验证 token: `curl -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" https://api.twitter.com/2/tweets/search/recent?query=test`

**错误：429 Too Many Requests**
- API 限流，等待重试
- 减少 `maxTweetsPerAccount` 数值

### Qwen API 错误

**错误：无效的 API Key**
- 检查 `QWEN_API_KEY` 格式
- 确认已开通通义千问服务

**错误：余额不足**
- 检查阿里云账户余额
- 充值或开通按量付费

### 分析失败

**情感分析返回 neutral**
- 检查 Qwen API 是否正常
- 查看日志确认具体错误

## 📚 相关文档

- [Twitter API v2 文档](https://developer.twitter.com/en/docs/twitter-api)
- [Qwen API 文档](https://help.aliyun.com/zh/dashscope/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关项目

- [NanoClawRadar](https://github.com/happydog-intj/NanoClawRadar) - NanoClaw 生态监控
- [agents-radar](https://github.com/duanyytop/agents-radar) - AI Agents 监控

---

**注意**：本项目仅用于公开信息监控和分析，请遵守 Twitter API 使用条款和相关法律法规。
