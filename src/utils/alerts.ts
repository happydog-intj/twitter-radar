import type { AnalyzedAppStoreReview, AnalyzedGooglePlayReview } from '../types.js';

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  P0 = 'P0', // Critical - immediate action required
  P1 = 'P1', // High - requires attention soon
  P2 = 'P2', // Medium - monitor and address
  P3 = 'P3', // Low - informational
}

/**
 * Alert definition
 */
export interface Alert {
  severity: AlertSeverity;
  title: string;
  message: string;
  count: number;
  examples?: string[];
  timestamp: string;
}

/**
 * Alert thresholds configuration
 */
export interface AlertThresholds {
  // Negative review thresholds
  negativeReviewP0: number; // e.g., 20 negative reviews
  negativeReviewP1: number; // e.g., 10 negative reviews
  negativePercentP0: number; // e.g., 50% negative
  negativePercentP1: number; // e.g., 30% negative

  // Critical keywords
  criticalKeywords: string[];
  criticalKeywordP0: number; // e.g., 5 mentions

  // Rating drop
  ratingDropP0: number; // e.g., drop by 0.5
  ratingDropP1: number; // e.g., drop by 0.3
}

/**
 * Default alert thresholds
 */
export const DEFAULT_THRESHOLDS: AlertThresholds = {
  negativeReviewP0: 20,
  negativeReviewP1: 10,
  negativePercentP0: 50,
  negativePercentP1: 30,
  criticalKeywords: [
    'crash',
    'bug',
    'broken',
    'refund',
    'scam',
    'fraud',
    'worst',
    'terrible',
    'never again',
    'deleted',
    'uninstall',
    '崩溃',
    '骗子',
    '退款',
    '垃圾',
    '卸载',
  ],
  criticalKeywordP0: 5,
  ratingDropP0: 0.5,
  ratingDropP1: 0.3,
};

/**
 * Analyze reviews and generate alerts
 */
export function generateAlerts(
  appStoreReviews: AnalyzedAppStoreReview[],
  googlePlayReviews: AnalyzedGooglePlayReview[],
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): Alert[] {
  const alerts: Alert[] = [];

  // Combine all reviews
  const allReviews = [...appStoreReviews, ...googlePlayReviews];

  if (allReviews.length === 0) {
    return alerts;
  }

  // Count negative reviews
  const negativeReviews = allReviews.filter((r) => r.sentiment.sentiment === 'negative');
  const negativePercent = (negativeReviews.length / allReviews.length) * 100;

  // Alert: High volume of negative reviews
  if (negativeReviews.length >= thresholds.negativeReviewP0) {
    alerts.push({
      severity: AlertSeverity.P0,
      title: '🚨 CRITICAL: High Volume of Negative Reviews',
      message: `Detected ${negativeReviews.length} negative reviews (${negativePercent.toFixed(1)}% of total)`,
      count: negativeReviews.length,
      examples: negativeReviews.slice(0, 3).map((r) => {
        const text = 'text' in r ? r.text : r.content;
        return text.substring(0, 100);
      }),
      timestamp: new Date().toISOString(),
    });
  } else if (negativeReviews.length >= thresholds.negativeReviewP1) {
    alerts.push({
      severity: AlertSeverity.P1,
      title: '⚠️ HIGH: Increased Negative Reviews',
      message: `Detected ${negativeReviews.length} negative reviews (${negativePercent.toFixed(1)}% of total)`,
      count: negativeReviews.length,
      timestamp: new Date().toISOString(),
    });
  }

  // Alert: High percentage of negative reviews
  if (negativePercent >= thresholds.negativePercentP0) {
    alerts.push({
      severity: AlertSeverity.P0,
      title: '🚨 CRITICAL: Negative Review Rate Spike',
      message: `${negativePercent.toFixed(1)}% of reviews are negative (threshold: ${thresholds.negativePercentP0}%)`,
      count: negativeReviews.length,
      timestamp: new Date().toISOString(),
    });
  } else if (negativePercent >= thresholds.negativePercentP1) {
    alerts.push({
      severity: AlertSeverity.P1,
      title: '⚠️ HIGH: Elevated Negative Review Rate',
      message: `${negativePercent.toFixed(1)}% of reviews are negative (threshold: ${thresholds.negativePercentP1}%)`,
      count: negativeReviews.length,
      timestamp: new Date().toISOString(),
    });
  }

  // Alert: Critical keywords detected
  const criticalMentions: Array<{ keyword: string; review: string }> = [];

  for (const review of allReviews) {
    const text = ('text' in review ? review.text : review.content).toLowerCase();

    for (const keyword of thresholds.criticalKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        criticalMentions.push({
          keyword,
          review: text.substring(0, 100),
        });
      }
    }
  }

  if (criticalMentions.length >= thresholds.criticalKeywordP0) {
    alerts.push({
      severity: AlertSeverity.P0,
      title: '🚨 CRITICAL: Critical Issues Detected',
      message: `Found ${criticalMentions.length} mentions of critical keywords: ${[...new Set(criticalMentions.map((m) => m.keyword))].join(', ')}`,
      count: criticalMentions.length,
      examples: criticalMentions.slice(0, 3).map((m) => `"${m.keyword}": ${m.review}`),
      timestamp: new Date().toISOString(),
    });
  }

  // Alert: Specific topic issues
  const topicCounts = new Map<string, number>();
  for (const review of negativeReviews) {
    for (const topic of review.topics) {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    }
  }

  for (const [topic, count] of topicCounts.entries()) {
    if (count >= 5) {
      alerts.push({
        severity: count >= 10 ? AlertSeverity.P1 : AlertSeverity.P2,
        title: `⚠️ ${count >= 10 ? 'HIGH' : 'MEDIUM'}: Recurring ${topic} Issues`,
        message: `Detected ${count} negative reviews mentioning ${topic} issues`,
        count,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return alerts;
}

/**
 * Format alerts for Telegram notification
 */
export function formatAlertsForTelegram(alerts: Alert[]): string | null {
  if (alerts.length === 0) {
    return null;
  }

  // Sort by severity
  const severityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const lines: string[] = [];

  lines.push('🔔 *SMART ALERTS*');
  lines.push('');

  for (const alert of alerts) {
    lines.push(`*${alert.title}*`);
    lines.push(alert.message);

    if (alert.examples && alert.examples.length > 0) {
      lines.push('');
      lines.push('Examples:');
      for (const example of alert.examples) {
        lines.push(`• ${escapeMarkdown(example)}...`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format alerts for console output
 */
export function logAlerts(alerts: Alert[]): void {
  if (alerts.length === 0) {
    console.error('✅ No alerts triggered');
    return;
  }

  console.error('\n🚨 ALERTS TRIGGERED:\n');

  for (const alert of alerts) {
    const icon = {
      P0: '🔴',
      P1: '🟠',
      P2: '🟡',
      P3: '🟢',
    }[alert.severity];

    console.error(`${icon} [${alert.severity}] ${alert.title}`);
    console.error(`   ${alert.message}`);

    if (alert.examples && alert.examples.length > 0) {
      console.error('   Examples:');
      for (const example of alert.examples) {
        console.error(`   - ${example}...`);
      }
    }

    console.error('');
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}
