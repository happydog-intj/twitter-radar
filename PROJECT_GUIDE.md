# Twitter Radar 项目指南

## 📋 项目概述

Twitter Radar 是一个自动化的 Twitter 监控和分析工具，使用阿里云通义千问（Qwen）AI 进行智能分析，专注于：

1. **监控指定 Twitter 账号**的推文
2. **AI 情感分析**（正面/负面/中性）
3. **SHEIN 品牌相关性判断**
4. **自动生成双语报告**（中英文）
5. **多渠道发布**（GitHub + Telegram + RSS）

## 🎯 核心功能

### 1. Twitter 数据采集

**使用 Twitter API v2**:
- 获取指定账号的最新推文
- 支持配置获取天数（默认7天）
- 每个账号可配置最大推文数（默认50条）
- 包含完整的互动数据（点赞、转发、回复）

**文件**: `src/collectors/twitter.ts`

```typescript
// 自动采集配置中的所有账号
const tweets = await collectTweets();
```

### 2. Qwen AI 智能分析

**两个分析维度**:

#### A. 情感分析
```json
{
  "sentiment": "positive/negative/neutral",
  "score": -1 到 1,
  "confidence": 0 到 1,
  "summary": "简短的情感描述"
}
```

#### B. SHEIN 相关性判断
```json
{
  "isRelevant": true/false,
  "confidence": 0 到 1,
  "reason": "判断原因",
  "keywords": ["识别到的关键词"]
}
```

**文件**: `src/analyzers/qwen.ts`

**优势**:
- 使用国产大模型（通义千问）
- 成本低廉（~¥0.008/千tokens）
- 理解中文语境更准确
- 支持批量分析

### 3. 报告生成

**生成内容**:
- 📊 数据总览（推文数、SHEIN相关数、情感分布）
- 🎯 SHEIN相关推文（按情感分类）
- 📱 所有推文（按账号分类）
- 🔗 推文链接和互动数据

**支持格式**:
- Markdown（双语）
- JSON
- RSS feed

**文件**: `src/generators/markdown.ts`, `src/generators/rss.ts`

### 4. 自动化发布

**发布渠道**:
- ✅ Git 自动提交到仓库
- ✅ 创建 GitHub Issue（每日报告）
- ✅ Telegram 推送关键摘要
- ✅ GitHub Pages 托管 RSS feed

## 📁 项目结构详解

```
twitter-radar/
├── .github/workflows/
│   └── daily-analysis.yml        # GitHub Actions 自动化
│       ├─ 定时触发（每天08:00 UTC）
│       ├─ 手动触发（带参数选择）
│       └─ 10个执行步骤
│
├── config/
│   └── config.yml                # 核心配置文件
│       ├─ Twitter 账号列表
│       ├─ SHEIN 关键词
│       ├─ Qwen 模型配置
│       └─ 输出和通知设置
│
├── src/
│   ├── collectors/
│   │   └── twitter.ts            # Twitter API v2 集成
│   │       ├─ 获取用户信息
│   │       ├─ 获取推文时间线
│   │       └─ 速率限制处理
│   │
│   ├── analyzers/
│   │   └── qwen.ts               # Qwen AI 分析引擎
│   │       ├─ 情感分析
│   │       ├─ SHEIN相关性判断
│   │       ├─ 批量处理
│   │       └─ 降级策略（关键词匹配）
│   │
│   ├── generators/
│   │   ├── markdown.ts           # Markdown 报告生成
│   │   │   ├─ 双语支持
│   │   │   ├─ 数据统计
│   │   │   ├─ 分类展示
│   │   │   └─ 格式化输出
│   │   │
│   │   └── rss.ts                # RSS feed 生成
│   │       ├─ 收集历史报告
│   │       ├─ 生成 XML
│   │       └─ 保存到 public/
│   │
│   ├── notifiers/
│   │   └── telegram.ts           # Telegram 通知
│   │       ├─ 格式化消息
│   │       └─ 发送摘要
│   │
│   ├── types.ts                  # TypeScript 类型定义
│   │   ├─ Tweet（推文）
│   │   ├─ SentimentAnalysis（情感）
│   │   ├─ SheinRelevance（相关性）
│   │   └─ AnalyzedTweet（分析结果）
│   │
│   ├── config.ts                 # 配置加载器
│   │   ├─ 环境变量读取
│   │   └─ YAML 配置解析
│   │
│   └── index.ts                  # 主程序入口
│       ├─ 采集推文
│       ├─ AI 分析
│       ├─ 生成报告
│       └─ 发布通知
│
├── reports/                      # 生成的报告（自动创建）
│   ├── YYYY-MM/
│   │   ├── YYYY-MM-DD-en.md     # 英文报告
│   │   └── YYYY-MM-DD-zh.md     # 中文报告
│   └── latest.md                 # 最新报告
│
├── public/                       # RSS feed（自动创建）
│   └── feed.xml                  # RSS 订阅源
│
├── package.json                  # 项目依赖
├── tsconfig.json                 # TypeScript 配置
├── .env.example                  # 环境变量模板
├── .gitignore                    # Git 忽略规则
├── README.md                     # 项目文档
└── LICENSE                       # MIT 许可证
```

## 🔑 API Keys 配置

### 1. Twitter Bearer Token

**获取步骤**:
1. 访问 https://developer.twitter.com/en/portal/dashboard
2. 创建应用（App）
3. 进入 "Keys and Tokens" 标签
4. 点击 "Generate" 生成 Bearer Token
5. 复制 token（格式：`AAAAAAAAAAAAAAAAAAAAAxxxxxxx...`）

**权限要求**:
- Read permissions（读取权限）
- 不需要 Write 权限

**添加到 .env**:
```bash
TWITTER_BEARER_TOKEN=your-bearer-token-here
```

### 2. Qwen API Key

**获取步骤**:
1. 访问 https://dashscope.console.aliyun.com/
2. 登录阿里云账号
3. 开通 DashScope 服务（通义千问）
4. 创建 API Key
5. 复制 key（格式：`sk-xxxxxxxxxxxxxxxx`）

**计费说明**:
- 按 Token 计费
- qwen-plus: ¥0.008/千tokens
- 每条推文约 500 tokens
- 100条推文/天 ≈ ¥0.4/天

**添加到 .env**:
```bash
QWEN_API_KEY=sk-your-api-key-here
```

### 3. Telegram Bot（可选）

**获取步骤**:
1. 在 Telegram 搜索 `@BotFather`
2. 发送 `/newbot` 创建机器人
3. 获取 Bot Token
4. 启动你的 bot
5. 获取 Chat ID（发送消息后访问 `https://api.telegram.org/bot<TOKEN>/getUpdates`）

**添加到 .env**:
```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=your-chat-id
```

## ⚙️ 配置说明

### config/config.yml

```yaml
twitter:
  accounts:
    - username: shein_official      # 要监控的 Twitter 账号
      priority: high                # 优先级（high/medium/low）
      description: "SHEIN官方"      # 描述

  maxTweetsPerAccount: 50           # 每个账号最多获取推文数
  sinceDays: 7                      # 获取最近几天的推文

qwen:
  model: "qwen-plus"                # 使用的模型
    # qwen-turbo - 最快最便宜
    # qwen-plus  - 推荐，平衡性能和成本
    # qwen-max   - 最强最贵

shein:
  keywords:                         # SHEIN 关键词
    - shein
    - SHEIN
    - "#shein"

  brands:                           # 品牌名称
    - SHEIN
    - ROMWE

  relatedTerms:                     # 相关术语
    - "fast fashion"
    - "shein haul"

output:
  formats:                          # 输出格式
    - markdown
    - json
    - rss

  createIssues: true                # 是否创建 GitHub Issue

notifications:
  telegram:
    enabled: false                  # 是否启用 Telegram 通知
```

## 🚀 使用指南

### 本地运行

```bash
# 1. 安装依赖
cd /Users/a10093140/Documents/TwitterRadar
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，添加 API keys

# 3. 配置监控账号
# 编辑 config/config.yml

# 4. 构建项目
pnpm build

# 5. 运行分析
pnpm analyze
```

### GitHub Actions 自动运行

**1. 创建 GitHub 仓库**:
```bash
gh repo create TwitterRadar --public --source=. --push
```

**2. 配置 Secrets**:
在仓库的 Settings → Secrets and variables → Actions 中添加：
- `TWITTER_BEARER_TOKEN`
- `QWEN_API_KEY`
- `TELEGRAM_BOT_TOKEN` (可选)
- `TELEGRAM_CHAT_ID` (可选)

**3. 启用 Actions**:
- 访问 Actions 标签页
- 启用工作流

**4. 手动触发或等待定时运行**:
- 手动：Actions → Daily Analysis → Run workflow
- 自动：每天 UTC 08:00（北京时间 16:00）

## 📊 分析结果示例

### 报告结构

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

#### 😊 @shein_official
> Just launched our new sustainable collection! 🌱...

💙 1.2K | 🔁 450 | 💬 89

**情感**: 非常积极的产品发布，用户反馈良好
**SHEIN相关性**: 官方账号发布新品信息
**关键词**: SHEIN, sustainable, collection
**发布时间**: 2026-03-08 14:30

...
```

### Qwen 分析示例

**输入推文**:
```
"Just got my SHEIN order! The quality is amazing and the price is unbeatable! 😍 #shein #fashion"
```

**Qwen 返回**:
```json
{
  "sentiment": {
    "sentiment": "positive",
    "score": 0.85,
    "confidence": 0.92,
    "summary": "非常满意的购物体验，对商品质量和价格都表示赞赏"
  },
  "sheinRelevance": {
    "isRelevant": true,
    "confidence": 0.98,
    "reason": "明确提到SHEIN品牌和购物体验，包含品牌标签",
    "keywords": ["SHEIN", "#shein", "order", "quality", "price"]
  }
}
```

## 💡 最佳实践

### 1. 监控策略

**建议监控的账号类型**:
- ✅ SHEIN 官方账号
- ✅ SHEIN 品牌矩阵（SHEINcurve, sheinmen等）
- ✅ 竞品账号（ZARA, H&M等）
- ✅ KOL/网红账号
- ✅ 行业媒体账号

**不建议**:
- ❌ 过多账号（成本高）
- ❌ 低活跃账号（数据少）
- ❌ 垃圾账号（噪音大）

### 2. 关键词配置

**基础关键词**:
```yaml
keywords:
  - shein
  - SHEIN
  - "@shein_official"
  - "#shein"
```

**扩展关键词**（提高召回率）:
```yaml
relatedTerms:
  - "shein haul"
  - "shein review"
  - "shein dress"
  - "shein clothing"
  - "shein vs"
```

### 3. 成本优化

**减少成本**:
- 使用 `qwen-turbo` 而不是 `qwen-max`
- 减少 `maxTweetsPerAccount`
- 增加 `sinceDays` 间隔（改为每周运行）
- 只分析 SHEIN 相关推文（先关键词过滤）

**优化后成本**:
```
原成本: 100条/天 × 500tokens × ¥0.008 = ¥0.4/天
优化后: 30条/天 × 500tokens × ¥0.004 = ¥0.06/天
```

### 4. 数据质量

**提高准确性**:
- 使用 `qwen-plus` 或 `qwen-max`
- 提供更详细的关键词列表
- 定期review分析结果，调整 prompt
- 使用更长的上下文窗口

## 🔧 故障排查

### Twitter API 问题

**问题 1: 401 Unauthorized**
```bash
# 测试 token 是否有效
curl -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" \
  "https://api.twitter.com/2/tweets/search/recent?query=test"
```

**问题 2: 429 Too Many Requests**
- 等待15分钟后重试
- 减少请求频率
- 检查是否超出月度限额

**问题 3: 找不到用户**
- 确认用户名正确（区分大小写）
- 检查账号是否被封禁或删除

### Qwen API 问题

**问题 1: 无效 API Key**
```bash
# 测试 API Key
curl -X POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation \
  -H "Authorization: Bearer $QWEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-turbo","input":{"messages":[{"role":"user","content":"hello"}]}}'
```

**问题 2: 余额不足**
- 检查阿里云账户余额
- 充值或开通按量付费

**问题 3: 分析返回错误**
- 检查日志中的具体错误
- 可能是 prompt 格式问题
- 回退到简单关键词匹配

### GitHub Actions 问题

**问题 1: Secrets 未生效**
- 确认 Secret 名称正确
- 重新添加 Secret
- 手动触发工作流测试

**问题 2: 推送失败**
- 检查仓库权限
- 确认 workflow 有 `contents: write` 权限

**问题 3: 工作流超时**
- 减少分析的推文数量
- 增加超时时间设置

## 📈 未来扩展

### 功能扩展

1. **多平台支持**
   - Instagram 监控
   - TikTok 评论分析
   - 小红书笔记追踪

2. **高级分析**
   - 用户画像分析
   - 传播路径追踪
   - 竞品对比分析
   - 趋势预测

3. **可视化**
   - 数据仪表板
   - 情感趋势图
   - 热词云图
   - 时间线视图

4. **告警系统**
   - 负面舆情告警
   - 异常流量检测
   - 危机预警

### 技术优化

1. **性能优化**
   - 批量API调用
   - 结果缓存
   - 增量更新

2. **数据存储**
   - 使用数据库（PostgreSQL）
   - 长期数据保存
   - 历史趋势分析

3. **AI 优化**
   - Fine-tune 专用模型
   - 多模型对比
   - Prompt 工程优化

## 📚 相关资源

- **Twitter API**: https://developer.twitter.com/en/docs/twitter-api
- **Qwen 文档**: https://help.aliyun.com/zh/dashscope/
- **GitHub Actions**: https://docs.github.com/en/actions
- **TypeScript**: https://www.typescriptlang.org/

## 🎓 学习路径

1. **入门** - 运行示例，理解基本流程
2. **配置** - 添加自己的监控账号
3. **定制** - 修改关键词和分析逻辑
4. **优化** - 调整成本和准确性
5. **扩展** - 添加新功能

---

**项目状态**: ✅ 已完成，可直接使用

**下一步**: 配置 API keys 并运行第一次分析！
