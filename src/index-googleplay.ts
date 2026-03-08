import 'dotenv/config';
import { format } from 'date-fns';
import { collectGooglePlayReviews, getGooglePlayAppInfo } from './collectors/google-play.js';
import { analyzeBatch } from './analyzers/google-play.js';
import {
  generateGooglePlayReport,
  saveGooglePlayReport,
} from './generators/google-play-markdown.js';
import type { GooglePlayConfig } from './types.js';

// Google Play configuration
const GOOGLE_PLAY_CONFIG: GooglePlayConfig = {
  appId: 'com.zzkko', // SHEIN app package ID
  regions: [
    { code: 'us', name: 'United States', language: 'en' },
    { code: 'gb', name: 'United Kingdom', language: 'en' },
    { code: 'in', name: 'India', language: 'en' },
    { code: 'br', name: 'Brazil', language: 'pt' },
    { code: 'mx', name: 'Mexico', language: 'es' },
  ],
  reviewsPerRegion: 100,
};

async function main() {
  console.log('🚀 Starting SHEIN Google Play Analysis...\n');

  const today = format(new Date(), 'yyyy-MM-dd');

  try {
    // Step 1: Get app info
    console.log('📱 Fetching app information...');
    const appInfo = await getGooglePlayAppInfo(GOOGLE_PLAY_CONFIG.appId);
    console.log(`✅ App: ${appInfo.name}`);
    console.log(`   Rating: ${appInfo.averageRating}/5.0`);
    console.log(`   Total Ratings: ${appInfo.totalRatings.toLocaleString()}`);
    console.log(`   Total Reviews: ${appInfo.totalReviews.toLocaleString()}`);
    console.log(`   Installs: ${appInfo.installs}\n`);

    // Step 2: Collect reviews
    const reviews = await collectGooglePlayReviews(GOOGLE_PLAY_CONFIG);

    if (reviews.length === 0) {
      console.log('❌ No reviews collected. Exiting.');
      return;
    }

    // Step 3: Analyze with Qwen AI
    const analyzed = await analyzeBatch(reviews);

    // Step 4: Generate reports
    console.log('📝 Generating reports...\n');

    // English report
    const englishReport = generateGooglePlayReport(analyzed, today, 'en', appInfo);
    saveGooglePlayReport(englishReport, today, 'en');

    // Chinese report
    const chineseReport = generateGooglePlayReport(analyzed, today, 'zh', appInfo);
    saveGooglePlayReport(chineseReport, today, 'zh');

    // Step 5: Print summary
    console.log('\n📊 Analysis Summary:');
    console.log(`   Total Reviews: ${analyzed.length}`);
    console.log(
      `   Positive: ${analyzed.filter((r) => r.sentiment.sentiment === 'positive').length}`
    );
    console.log(
      `   Neutral: ${analyzed.filter((r) => r.sentiment.sentiment === 'neutral').length}`
    );
    console.log(
      `   Negative: ${analyzed.filter((r) => r.sentiment.sentiment === 'negative').length}`
    );
    console.log(
      `   Developer Replies: ${analyzed.filter((r) => r.replyText).length}`
    );

    // Count topics
    const topicCounts: { [topic: string]: number } = {};
    analyzed.forEach((review) => {
      review.topics.forEach((topic) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    console.log('\n🏷️  Top Topics:');
    Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([topic, count]) => {
        console.log(`   ${topic}: ${count}`);
      });

    console.log('\n✅ Google Play analysis complete!');
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

main();
