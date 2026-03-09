# Instagram Graph API 集成技术方案

> 文档版本：v1.0
> 创建日期：2026-03-09
> 适用于：Social Radar 项目

## 📋 目录

1. [概述](#概述)
2. [前置要求](#前置要求)
3. [接入流程](#接入流程)
4. [技术架构](#技术架构)
5. [API 功能清单](#api-功能清单)
6. [实现计划](#实现计划)
7. [成本评估](#成本评估)
8. [风险与挑战](#风险与挑战)
9. [替代方案](#替代方案)

---

## 概述

### 目标

为 Social Radar 项目添加 Instagram 数据监控能力，实现对 SHEIN Instagram 账号的帖子、评论、互动数据的自动化采集和分析。

### 当前方案对比

| 平台 | 实现方式 | 数据获取 | 稳定性 | 难度 |
|------|---------|---------|--------|------|
| Twitter | Twitter API v2 | 公开 API | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| App Store | 爬虫 + RSS | 公开数据 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Google Play | google-play-scraper | 公开数据 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Instagram** | **Graph API** | **需授权** | **⭐⭐⭐⭐** | **⭐⭐⭐⭐** |

---

## 前置要求

### 账号要求

✅ **必需**：
1. Instagram 商业账号 (Business Account) 或创作者账号 (Creator Account)
2. 与 Instagram 账号关联的 Facebook 主页
3. Facebook 开发者账号
4. 该开发者账号能够管理上述 Facebook 主页的 Tasks

❌ **不支持**：
- 个人 Instagram 账号（无法使用 Graph API）
- 未连接 Facebook 主页的账号

### 技术要求

- Node.js 20+
- TypeScript 5+
- Meta App（Facebook App）注册
- OAuth 2.0 实现能力

---

## 接入流程

### 步骤 1：创建 Facebook App

```bash
# 访问 Facebook 开发者平台
https://developers.facebook.com/apps/create/

# 选择应用类型
App Type: Business

# 添加产品
Products: Facebook Login for Business
```

**配置项**：
```json
{
  "app_name": "Social Radar Instagram Monitor",
  "app_purpose": "Social Media Analytics",
  "redirect_uri": "https://your-domain.com/auth/callback"
}
```

### 步骤 2：实现 Facebook Login

**必需权限**：
- `instagram_basic` - 基本 Instagram 数据访问
- `pages_show_list` - 列出用户管理的主页
- `instagram_manage_comments` - 管理评论（可选）
- `instagram_manage_insights` - 获取洞察数据（可选）

**OAuth 流程图**：
```
用户 → Facebook Login → 授权页面 → 同意授权 → Redirect URI
                                                    ↓
                                              获取 Access Token
```

### 步骤 3：获取 Instagram Business Account ID

```typescript
// 1. 获取用户的 Facebook 主页
const pages = await fetch(
  `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`
);

// 2. 获取主页关联的 Instagram 账号
const igAccount = await fetch(
  `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
);

// 3. 保存 Instagram Business Account ID
const igBusinessAccountId = igAccount.instagram_business_account.id;
```

### 步骤 4：获取媒体数据

```typescript
// 获取账号的媒体对象（帖子）
const media = await fetch(
  `https://graph.facebook.com/v18.0/${igBusinessAccountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}`
);
```

---

## 技术架构

### 目录结构

```
src/
├── collectors/
│   └── instagram.ts          # Instagram 数据采集器
├── analyzers/
│   └── instagram.ts          # Instagram 数据分析器
├── generators/
│   └── instagram-markdown.ts # Instagram 报告生成器
├── auth/
│   └── facebook-oauth.ts     # Facebook OAuth 实现
├── types.ts                  # 类型定义
└── index-instagram.ts        # Instagram 分析入口
```

### 数据模型

```typescript
// Instagram Post 数据结构
interface InstagramPost {
  id: string;
  caption: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  insights?: {
    impressions: number;
    reach: number;
    engagement: number;
  };
}

// 分析后的数据
interface AnalyzedInstagramPost extends InstagramPost {
  sentiment: SentimentAnalysis;
  sheinRelevance: SheinRelevance;
  analyzedAt: string;
}

// 配置
interface InstagramConfig {
  accountId: string;
  accessToken: string;
  maxPostsPerRun: number;
  sinceDays: number;
}
```

### 数据流

```
Instagram API → Collector → Analyzer (Qwen AI) → Generator → GitHub Issue
                                                              ↓
                                                        Telegram 通知
```

---

## API 功能清单

### 支持的端点

| 端点 | 功能 | 是否需要 |
|------|------|---------|
| `/media` | 获取媒体对象列表 | ✅ 必需 |
| `/media/{id}` | 获取单个媒体详情 | ✅ 必需 |
| `/media/{id}/comments` | 获取评论 | ✅ 建议 |
| `/media/{id}/insights` | 获取洞察数据 | 🔶 可选 |
| `/stories` | 获取 Stories | 🔶 可选 |
| `/mentioned_media` | 获取提及 | 🔶 可选 |

### 数据字段

**基础字段**（免费）：
- `id` - 媒体 ID
- `caption` - 帖子文案
- `media_type` - 媒体类型
- `media_url` - 媒体 URL
- `permalink` - 永久链接
- `timestamp` - 发布时间
- `like_count` - 点赞数
- `comments_count` - 评论数

**Insights 字段**（需要额外权限）：
- `impressions` - 曝光量
- `reach` - 触达人数
- `engagement` - 互动数
- `saved` - 收藏数

---

## 实现计划

### Phase 1: 基础集成（预计 2-3 周）

**Week 1: OAuth & 数据采集**
- [ ] 实现 Facebook OAuth 流程
- [ ] 创建 Instagram collector
- [ ] 测试 API 调用和数据获取
- [ ] 处理 token 刷新逻辑

**Week 2: 数据分析与报告**
- [ ] 集成 Qwen AI 分析
- [ ] 实现 Markdown 报告生成
- [ ] 适配现有的 GitHub Issue 创建流程
- [ ] 添加 Telegram 通知

**Week 3: 测试与优化**
- [ ] 端到端测试
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] 文档编写

### Phase 2: 高级功能（预计 1-2 周）

- [ ] 添加评论采集和分析
- [ ] 实现 Insights 数据获取
- [ ] 支持 Stories 监控
- [ ] 实现提及（@mentions）追踪

### Phase 3: 监控与维护

- [ ] 设置监控告警
- [ ] 定期 token 检查
- [ ] API 变更追踪
- [ ] 数据质量监控

---

## 成本评估

### 开发成本

| 阶段 | 工作量 | 说明 |
|------|--------|------|
| OAuth 实现 | 3-5 天 | Facebook Login 集成 |
| 数据采集 | 2-3 天 | API 调用封装 |
| 数据分析 | 1-2 天 | 复用现有 Qwen 分析逻辑 |
| 报告生成 | 1-2 天 | 参考现有模板 |
| 测试优化 | 3-5 天 | 端到端测试 |
| **总计** | **2-3 周** | 约 10-15 个工作日 |

### 运营成本

| 项目 | 费用 | 说明 |
|------|------|------|
| API 调用 | **免费** | Instagram Graph API 免费 |
| Token 存储 | 最低成本 | 需要安全存储 Access Token |
| 维护成本 | 中等 | 需要定期更新 token |

### API 限制

- **Rate Limit**: 200 calls/hour per user
- **数据保留**: 最近 24 小时的 Stories
- **Token 过期**: 60 天（需要刷新）

---

## 风险与挑战

### 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Token 过期 | 🔴 高 | 实现自动刷新机制 |
| API 限流 | 🟡 中 | 实现重试和队列 |
| 账号权限变更 | 🔴 高 | 监控和告警 |
| API 版本更新 | 🟡 中 | 定期检查文档 |

### 业务风险

| 风险 | 概率 | 影响 |
|------|------|------|
| 无法获得 SHEIN 授权 | 🔴 高 | **阻塞性** - 无法实现 |
| 授权撤销 | 🟡 中 | 服务中断 |
| 账号类型变更 | 🟢 低 | 需要重新配置 |

### 合规风险

⚠️ **重要提醒**：
- 必须获得账号所有者的明确授权
- 遵守 Meta Platform Terms
- 不得用于未授权的数据采集
- 需要符合数据隐私法规（GDPR, CCPA）

---

## 替代方案

### 方案 A: 第三方分析工具

**推荐工具**：
- Hootsuite Analytics
- Sprout Social
- Later
- Iconosquare

**优点**：
- ✅ 开箱即用，无需开发
- ✅ 稳定可靠
- ✅ 功能丰富

**缺点**：
- ❌ 月费较高（$29-$299/月）
- ❌ 无法深度定制
- ❌ 数据导出受限

### 方案 B: 手动数据收集

**适用场景**：
- 监控频率低（每周/每月）
- 数据量小
- 临时性需求

**方法**：
- 手动导出 Instagram Insights
- 使用电子表格整理
- 定期生成报告

### 方案 C: 爬虫方案（不推荐）

⚠️ **风险极高**：
- 违反 Instagram 服务条款
- 容易被封禁 IP/账号
- 维护成本高
- 法律风险

**不建议采用**

---

## 实施建议

### 当前阶段

✅ **立即可做**：
1. 准备完整的技术方案文档（本文档）
2. 评估 SHEIN 授权的可行性
3. 创建 Facebook Developer 账号
4. 搭建测试环境

⏸️ **等待决策**：
1. 是否能获得 SHEIN 官方授权？
2. 预算是否支持开发成本？
3. 是否考虑第三方工具替代？

🚫 **不建议现在做**：
1. 开始编码实现（等待授权确认）
2. 购买第三方工具（先评估需求）

### 推荐路径

**短期（1-2 周）**：
1. 联系 SHEIN 社交媒体团队
2. 说明数据监控需求和用途
3. 申请 Instagram 商业账号的 API 访问权限
4. 准备技术实施计划

**中期（1 个月）**：
1. 如果获得授权 → 启动开发
2. 如果无法授权 → 评估第三方工具
3. 或者先专注优化现有的 Twitter + App Store 监控

**长期（3-6 个月）**：
1. 完善 Instagram 监控功能
2. 积累数据和洞察
3. 扩展到更多社交平台

---

## 附录

### 参考文档

- [Instagram Graph API 官方文档](https://developers.facebook.com/docs/instagram-api)
- [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/overview)
- [Meta Platform Terms](https://developers.facebook.com/terms)

### 联系方式

**项目负责人**: Social Radar Team
**文档维护**: Claude AI Assistant
**最后更新**: 2026-03-09

---

## 总结

Instagram Graph API 集成在技术上是**可行的**，但面临以下关键挑战：

1. **必须获得 SHEIN 官方授权** ⭐⭐⭐⭐⭐
2. 开发成本适中（2-3 周）⭐⭐⭐
3. 维护成本可控 ⭐⭐⭐
4. 技术难度较高 ⭐⭐⭐⭐

**建议**：在未确认能否获得授权之前，**先优化现有的 Twitter + App Store + Google Play 监控体系**，积累经验后再考虑扩展到 Instagram。
