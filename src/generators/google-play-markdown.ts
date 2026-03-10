import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { AnalyzedGooglePlayReview, GooglePlayDigest } from '../types.js';
import { OUTPUT_DIR } from '../config.js';

export function generateGooglePlayReport(
  reviews: AnalyzedGooglePlayReview[],
  date: string,
  language: 'en' | 'zh',
  appInfo: {
    name: string;
    averageRating: number;
    totalRatings: number;
    totalReviews: number;
    installs: string;
    currentVersion: string;
  }
): string {
  const digest = buildDigest(reviews, date, language, appInfo);

  if (language === 'zh') {
    return generateChineseReport(digest);
  } else {
    return generateEnglishReport(digest);
  }
}

function buildDigest(
  reviews: AnalyzedGooglePlayReview[],
  date: string,
  language: 'en' | 'zh',
  appInfo: {
    name: string;
    averageRating: number;
    totalRatings: number;
    totalReviews: number;
    installs: string;
    currentVersion: string;
  }
): GooglePlayDigest {
  const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const sentimentBreakdown = { positive: 0, negative: 0, neutral: 0 };
  const topicCounts: { [topic: string]: number } = {};
  const reviewsByRegion: { [region: string]: AnalyzedGooglePlayReview[] } = {};
  let developerReplies = 0;

  reviews.forEach((review) => {
    // Rating breakdown
    ratingBreakdown[review.rating as 1 | 2 | 3 | 4 | 5]++;

    // Sentiment breakdown
    sentimentBreakdown[review.sentiment.sentiment]++;

    // Topic counting
    review.topics.forEach((topic) => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    // Group by region
    if (!reviewsByRegion[review.region]) {
      reviewsByRegion[review.region] = [];
    }
    reviewsByRegion[review.region].push(review);

    // Count developer replies
    if (review.replyText) {
      developerReplies++;
    }
  });

  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));

  return {
    date,
    appInfo,
    summary: {
      totalReviews: reviews.length,
      ratingBreakdown,
      sentimentBreakdown,
      topTopics,
      developerReplies,
    },
    reviewsByRegion,
    language,
  };
}

function generateEnglishReport(digest: GooglePlayDigest): string {
  const { summary, reviewsByRegion, appInfo } = digest;

  let markdown = `# SHEIN Google Play Reviews - ${digest.date}\n\n`;

  // App Info
  markdown += `## 📱 App Information\n\n`;
  markdown += `- **App**: ${appInfo.name}\n`;
  markdown += `- **Overall Rating**: ${appInfo.averageRating.toFixed(2)}/5.0\n`;
  markdown += `- **Total Ratings**: ${appInfo.totalRatings.toLocaleString()}\n`;
  markdown += `- **Total Reviews**: ${appInfo.totalReviews.toLocaleString()}\n`;
  markdown += `- **Installs**: ${appInfo.installs}\n`;
  markdown += `- **Current Version**: ${appInfo.currentVersion}\n\n`;

  // Summary
  markdown += `## 📊 Analysis Summary\n\n`;
  markdown += `- **Reviews Analyzed**: ${summary.totalReviews}\n`;
  markdown += `- **Developer Replies**: ${summary.developerReplies} (${((summary.developerReplies / summary.totalReviews) * 100).toFixed(1)}%)\n`;
  markdown += `- **Period**: Latest reviews from Google Play\n\n`;

  // Rating breakdown
  markdown += `### ⭐ Rating Distribution\n\n`;
  for (let i = 5; i >= 1; i--) {
    const count = summary.ratingBreakdown[i as 1 | 2 | 3 | 4 | 5];
    const percent = ((count / summary.totalReviews) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round((count / summary.totalReviews) * 20));
    markdown += `- ${'⭐'.repeat(i)} (${i}): ${count} (${percent}%) ${bar}\n`;
  }
  markdown += `\n`;

  // Sentiment breakdown
  markdown += `### 😊 Sentiment Analysis\n\n`;
  markdown += `- 😊 Positive: ${summary.sentimentBreakdown.positive} (${((summary.sentimentBreakdown.positive / summary.totalReviews) * 100).toFixed(1)}%)\n`;
  markdown += `- 😐 Neutral: ${summary.sentimentBreakdown.neutral} (${((summary.sentimentBreakdown.neutral / summary.totalReviews) * 100).toFixed(1)}%)\n`;
  markdown += `- 😞 Negative: ${summary.sentimentBreakdown.negative} (${((summary.sentimentBreakdown.negative / summary.totalReviews) * 100).toFixed(1)}%)\n\n`;

  // Top topics
  markdown += `### 🏷️ Top Discussion Topics / 热门讨论话题\n\n`;
  summary.topTopics.forEach(({ topic, count }, index) => {
    const percent = ((count / summary.totalReviews) * 100).toFixed(1);
    markdown += `${index + 1}. **${formatTopicBilingual(topic)}**: ${count} mentions (${percent}%)\n`;
  });
  markdown += `\n`;

  // Reviews by region
  markdown += `## 🌍 Reviews by Region\n\n`;

  for (const [region, reviews] of Object.entries(reviewsByRegion)) {
    markdown += `### ${region} (${reviews.length} reviews)\n\n`;

    // Group by sentiment
    const positive = reviews.filter((r) => r.sentiment.sentiment === 'positive');
    const negative = reviews.filter((r) => r.sentiment.sentiment === 'negative');

    // Show negative reviews FIRST (prioritized)
    if (negative.length > 0) {
      markdown += `#### 🚨 Negative Reviews (${negative.length}) - PRIORITY\n\n`;
      markdown += `> **⚠️ Critical Feedback** - These reviews require attention\n\n`;
      negative.slice(0, 5).forEach((review) => {
        markdown += formatReviewEN(review, true);
      });
    }

    // Show positive reviews
    if (positive.length > 0) {
      markdown += `#### 😊 Positive Reviews (${positive.length})\n\n`;
      positive.slice(0, 5).forEach((review) => {
        markdown += formatReviewEN(review);
      });
    }

    markdown += `\n`;
  }

  markdown += `---\n\n`;
  markdown += `*Report generated on ${new Date().toISOString()}*\n`;
  markdown += `*Powered by Qwen AI*\n`;

  return markdown;
}

function generateChineseReport(digest: GooglePlayDigest): string {
  const { summary, reviewsByRegion, appInfo } = digest;

  let markdown = `# SHEIN Google Play 评论分析 - ${digest.date}\n\n`;

  // App Info
  markdown += `## 📱 应用信息\n\n`;
  markdown += `- **应用名称**: ${appInfo.name}\n`;
  markdown += `- **总体评分**: ${appInfo.averageRating.toFixed(2)}/5.0\n`;
  markdown += `- **总评分数**: ${appInfo.totalRatings.toLocaleString()}\n`;
  markdown += `- **总评论数**: ${appInfo.totalReviews.toLocaleString()}\n`;
  markdown += `- **安装量**: ${appInfo.installs}\n`;
  markdown += `- **当前版本**: ${appInfo.currentVersion}\n\n`;

  // Summary
  markdown += `## 📊 分析概览\n\n`;
  markdown += `- **本次分析评论数**: ${summary.totalReviews}\n`;
  markdown += `- **开发者回复**: ${summary.developerReplies} (${((summary.developerReplies / summary.totalReviews) * 100).toFixed(1)}%)\n`;
  markdown += `- **时间范围**: Google Play 最新评论\n\n`;

  // Rating breakdown
  markdown += `### ⭐ 评分分布\n\n`;
  for (let i = 5; i >= 1; i--) {
    const count = summary.ratingBreakdown[i as 1 | 2 | 3 | 4 | 5];
    const percent = ((count / summary.totalReviews) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round((count / summary.totalReviews) * 20));
    markdown += `- ${'⭐'.repeat(i)} (${i}星): ${count} (${percent}%) ${bar}\n`;
  }
  markdown += `\n`;

  // Sentiment breakdown
  markdown += `### 😊 情感分析\n\n`;
  markdown += `- 😊 正面: ${summary.sentimentBreakdown.positive} (${((summary.sentimentBreakdown.positive / summary.totalReviews) * 100).toFixed(1)}%)\n`;
  markdown += `- 😐 中性: ${summary.sentimentBreakdown.neutral} (${((summary.sentimentBreakdown.neutral / summary.totalReviews) * 100).toFixed(1)}%)\n`;
  markdown += `- 😞 负面: ${summary.sentimentBreakdown.negative} (${((summary.sentimentBreakdown.negative / summary.totalReviews) * 100).toFixed(1)}%)\n\n`;

  // Top topics
  markdown += `### 🏷️ 热门话题\n\n`;
  summary.topTopics.forEach(({ topic, count }, index) => {
    const percent = ((count / summary.totalReviews) * 100).toFixed(1);
    markdown += `${index + 1}. **${formatTopicZH(topic)}**: ${count} 次提及 (${percent}%)\n`;
  });
  markdown += `\n`;

  // Reviews by region
  markdown += `## 🌍 各地区评论\n\n`;

  for (const [region, reviews] of Object.entries(reviewsByRegion)) {
    markdown += `### ${region} (${reviews.length} 条评论)\n\n`;

    // Group by sentiment
    const positive = reviews.filter((r) => r.sentiment.sentiment === 'positive');
    const negative = reviews.filter((r) => r.sentiment.sentiment === 'negative');

    // Show negative reviews FIRST (prioritized)
    if (negative.length > 0) {
      markdown += `#### 🚨 负面评价 (${negative.length}) - 优先关注\n\n`;
      markdown += `> **⚠️ 重要反馈** - 这些评价需要关注\n\n`;
      negative.slice(0, 5).forEach((review) => {
        markdown += formatReviewZH(review, true);
      });
    }

    // Show positive reviews
    if (positive.length > 0) {
      markdown += `#### 😊 正面评价 (${positive.length})\n\n`;
      positive.slice(0, 5).forEach((review) => {
        markdown += formatReviewZH(review);
      });
    }

    markdown += `\n`;
  }

  markdown += `---\n\n`;
  markdown += `*报告生成时间: ${new Date().toISOString()}*\n`;
  markdown += `*分析引擎: 通义千问*\n`;

  return markdown;
}

function formatReviewEN(review: AnalyzedGooglePlayReview, isNegative: boolean = false): string {
  const prefix = isNegative ? '🚨 ' : '';
  let md = `##### ${prefix}${'⭐'.repeat(review.rating)} by ${review.userName}\n\n`;
  if (isNegative) {
    md += `> **⚠️ NEGATIVE FEEDBACK**\n>\n`;
  }
  md += `> ${review.text}\n\n`;
  const beijingTime = formatInTimeZone(review.date, 'Asia/Shanghai', 'yyyy-MM-dd HH:mm:ss');
  md += `**Version**: ${review.version} | **Date**: ${beijingTime} (北京时间) | **👍**: ${review.thumbsUp}\n\n`;
  if (isNegative) {
    md += `**🔴 AI Analysis**: ${review.sentiment.summary}\n\n`;
  } else {
    md += `**AI Analysis**: ${review.sentiment.summary}\n\n`;
  }
  md += `**Topics**: ${review.topics.map(formatTopic).join(', ')}\n\n`;

  if (review.replyText) {
    const replyBeijingTime = review.replyDate ? formatInTimeZone(review.replyDate, 'Asia/Shanghai', 'yyyy-MM-dd HH:mm:ss') : 'N/A';
    md += `**🏢 Developer Reply** (${replyBeijingTime}):\n`;
    md += `> ${review.replyText}\n\n`;
  }

  if (isNegative) {
    md += `---\n\n`;
  }

  return md;
}

function formatReviewZH(review: AnalyzedGooglePlayReview, isNegative: boolean = false): string {
  const prefix = isNegative ? '🚨 ' : '';
  let md = `##### ${prefix}${'⭐'.repeat(review.rating)} - ${review.userName}\n\n`;
  if (isNegative) {
    md += `> **⚠️ 负面反馈**\n>\n`;
  }
  md += `> ${review.text}\n\n`;
  const beijingTime = formatInTimeZone(review.date, 'Asia/Shanghai', 'yyyy-MM-dd HH:mm:ss');
  md += `**版本**: ${review.version} | **日期**: ${beijingTime} (北京时间) | **👍**: ${review.thumbsUp}\n\n`;
  if (isNegative) {
    md += `**🔴 AI 分析**: ${review.sentiment.summary}\n\n`;
  } else {
    md += `**AI 分析**: ${review.sentiment.summary}\n\n`;
  }
  md += `**主题**: ${review.topics.map(formatTopicZH).join('、')}\n\n`;

  if (review.replyText) {
    const replyBeijingTime = review.replyDate ? formatInTimeZone(review.replyDate, 'Asia/Shanghai', 'yyyy-MM-dd HH:mm:ss') : 'N/A';
    md += `**🏢 开发者回复** (${replyBeijingTime}):\n`;
    md += `> ${review.replyText}\n\n`;
  }

  if (isNegative) {
    md += `---\n\n`;
  }

  return md;
}

function formatTopic(topic: string): string {
  const mapping: { [key: string]: string } = {
    delivery: 'Delivery & Shipping',
    quality: 'Product Quality',
    price: 'Pricing & Value',
    'ui/ux': 'App Experience',
    'customer-service': 'Customer Service',
    sizing: 'Size & Fit',
    returns: 'Returns & Refunds',
    payment: 'Payment Issues',
    other: 'Other',
  };
  return mapping[topic] || topic;
}

function formatTopicZH(topic: string): string {
  const mapping: { [key: string]: string } = {
    delivery: '物流配送',
    quality: '产品质量',
    price: '价格优惠',
    'ui/ux': '应用体验',
    'customer-service': '客户服务',
    sizing: '尺码合身',
    returns: '退换货',
    payment: '支付问题',
    other: '其他',
  };
  return mapping[topic] || topic;
}

function formatTopicBilingual(topic: string): string {
  const en = formatTopic(topic);
  const zh = formatTopicZH(topic);
  return `${en} / ${zh}`;
}

export function saveGooglePlayReport(
  markdown: string,
  date: string,
  language: 'en' | 'zh',
  type: 'googleplay' = 'googleplay'
): void {
  const yearMonth = date.substring(0, 7);
  const dir = join(OUTPUT_DIR, yearMonth);

  mkdirSync(dir, { recursive: true });

  const filename = `${date}-${type}-${language}.md`;
  const filepath = join(dir, filename);

  writeFileSync(filepath, markdown, 'utf8');
  console.log(`✅ Saved ${language.toUpperCase()} report: ${filepath}`);

  // Also save as latest
  const latestPath = join(OUTPUT_DIR, `latest-${type}.md`);
  writeFileSync(latestPath, markdown, 'utf8');
}
