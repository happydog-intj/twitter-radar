import gplay from 'google-play-scraper';

/**
 * Competitor app configuration
 */
export interface CompetitorApp {
  name: string;
  appStoreId?: string; // Apple App Store ID
  googlePlayId?: string; // Google Play package ID
}

/**
 * Competitor comparison data
 */
export interface CompetitorComparison {
  app: string;
  platform: 'appstore' | 'googleplay';
  rating: number;
  totalRatings: number;
  totalReviews?: number;
  installs?: string;
  recentReviews?: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

/**
 * Predefined competitors for SHEIN
 */
export const SHEIN_COMPETITORS: CompetitorApp[] = [
  {
    name: 'Temu',
    appStoreId: '1609578309',
    googlePlayId: 'com.einnovation.temu',
  },
  {
    name: 'AliExpress',
    appStoreId: '436672029',
    googlePlayId: 'com.alibaba.aliexpresshd',
  },
  {
    name: 'Wish',
    appStoreId: '530621395',
    googlePlayId: 'com.contextlogic.wish',
  },
];

/**
 * Get competitor data from Google Play
 */
export async function getCompetitorGooglePlayData(
  appId: string,
  appName: string
): Promise<CompetitorComparison> {
  try {
    const appInfo = await gplay.app({ appId });

    return {
      app: appName,
      platform: 'googleplay',
      rating: appInfo.score || 0,
      totalRatings: appInfo.ratings || 0,
      totalReviews: appInfo.reviews || 0,
      installs: appInfo.installs || 'N/A',
    };
  } catch (error) {
    console.error(`Failed to fetch Google Play data for ${appName}:`, error);
    return {
      app: appName,
      platform: 'googleplay',
      rating: 0,
      totalRatings: 0,
    };
  }
}

/**
 * Fetch all competitors data
 */
export async function fetchCompetitorsData(
  competitors: CompetitorApp[] = SHEIN_COMPETITORS
): Promise<CompetitorComparison[]> {
  console.error('\n🔍 Fetching competitor data...\n');

  const results: CompetitorComparison[] = [];

  for (const competitor of competitors) {
    if (competitor.googlePlayId) {
      console.error(`  Fetching ${competitor.name} (Google Play)...`);
      const data = await getCompetitorGooglePlayData(competitor.googlePlayId, competitor.name);
      results.push(data);

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.error(`\n✅ Fetched data for ${results.length} competitors\n`);

  return results;
}

/**
 * Generate competitor comparison report
 */
export function generateCompetitorReport(
  sheinData: CompetitorComparison,
  competitorsData: CompetitorComparison[]
): string {
  const lines: string[] = [];

  lines.push('## 📊 Competitor Comparison\n');

  // Create comparison table
  lines.push('| App | Rating | Total Ratings | Total Reviews | Installs |');
  lines.push('|-----|--------|---------------|---------------|----------|');

  // Add SHEIN first (highlighted)
  lines.push(
    `| **${sheinData.app}** (Our App) | **${sheinData.rating.toFixed(1)}** | **${sheinData.totalRatings.toLocaleString()}** | **${(sheinData.totalReviews || 0).toLocaleString()}** | **${sheinData.installs || 'N/A'}** |`
  );

  // Add competitors
  for (const comp of competitorsData) {
    lines.push(
      `| ${comp.app} | ${comp.rating.toFixed(1)} | ${comp.totalRatings.toLocaleString()} | ${(comp.totalReviews || 0).toLocaleString()} | ${comp.installs || 'N/A'} |`
    );
  }

  lines.push('');

  // Analysis
  lines.push('### Key Insights\n');

  // Rating comparison
  const avgCompetitorRating =
    competitorsData.reduce((sum, c) => sum + c.rating, 0) / competitorsData.length;
  const ratingDiff = sheinData.rating - avgCompetitorRating;

  if (ratingDiff > 0) {
    lines.push(
      `✅ **Rating Advantage**: SHEIN's rating (${sheinData.rating.toFixed(1)}) is ${ratingDiff.toFixed(2)} points higher than average competitor rating (${avgCompetitorRating.toFixed(1)})\n`
    );
  } else if (ratingDiff < 0) {
    lines.push(
      `⚠️ **Rating Gap**: SHEIN's rating (${sheinData.rating.toFixed(1)}) is ${Math.abs(ratingDiff).toFixed(2)} points lower than average competitor rating (${avgCompetitorRating.toFixed(1)})\n`
    );
  } else {
    lines.push(
      `➡️ **Rating Parity**: SHEIN's rating matches average competitor rating (${avgCompetitorRating.toFixed(1)})\n`
    );
  }

  // Find best and worst competitor
  const sortedByRating = [...competitorsData].sort((a, b) => b.rating - a.rating);
  if (sortedByRating.length > 0) {
    lines.push(
      `🏆 **Top Competitor**: ${sortedByRating[0].app} (${sortedByRating[0].rating.toFixed(1)}/5.0)\n`
    );
    lines.push(
      `📉 **Lowest Competitor**: ${sortedByRating[sortedByRating.length - 1].app} (${sortedByRating[sortedByRating.length - 1].rating.toFixed(1)}/5.0)\n`
    );
  }

  return lines.join('\n');
}

/**
 * Generate competitor comparison for Telegram
 */
export function formatCompetitorForTelegram(
  sheinData: CompetitorComparison,
  competitorsData: CompetitorComparison[]
): string {
  const lines: string[] = [];

  lines.push('📊 *Competitor Comparison*');
  lines.push('');

  const avgCompetitorRating =
    competitorsData.reduce((sum, c) => sum + c.rating, 0) / competitorsData.length;
  const ratingDiff = sheinData.rating - avgCompetitorRating;

  if (ratingDiff > 0) {
    lines.push(`✅ SHEIN rating: ${sheinData.rating.toFixed(1)} (+${ratingDiff.toFixed(2)} vs avg)`);
  } else if (ratingDiff < 0) {
    lines.push(
      `⚠️ SHEIN rating: ${sheinData.rating.toFixed(1)} (${ratingDiff.toFixed(2)} vs avg)`
    );
  } else {
    lines.push(`➡️ SHEIN rating: ${sheinData.rating.toFixed(1)} (at avg)`);
  }

  lines.push('');
  lines.push('Competitors:');

  for (const comp of competitorsData) {
    const emoji = comp.rating > sheinData.rating ? '🔴' : comp.rating < sheinData.rating ? '🟢' : '🟡';
    lines.push(`${emoji} ${comp.app}: ${comp.rating.toFixed(1)}/5.0`);
  }

  return lines.join('\n');
}
