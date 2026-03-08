// @ts-nocheck - google-play-scraper has incomplete TypeScript definitions
import gplay from 'google-play-scraper';
import type { GooglePlayReview, GooglePlayConfig } from '../types.js';

export async function collectGooglePlayReviews(
  config: GooglePlayConfig
): Promise<GooglePlayReview[]> {
  const reviews: GooglePlayReview[] = [];

  for (const region of config.regions) {
    console.log(`📱 Fetching reviews from ${region.name} Google Play...`);

    try {
      const result = await gplay.reviews({
        appId: config.appId,
        lang: region.language,
        country: region.code,
        sort: gplay.sort.NEWEST,
        num: Math.min(config.reviewsPerRegion, 150), // Max 150 per request
      });

      if (!result.data || result.data.length === 0) {
        console.log(`⚠️  No reviews found for ${region.name}`);
        continue;
      }

      for (const review of result.data) {
        reviews.push({
          id: review.id,
          userName: review.userName,
          userImage: review.userImage,
          rating: review.score,
          text: review.text,
          date: new Date(review.date),
          version: review.version || 'Unknown',
          thumbsUp: review.thumbsUp || 0,
          replyDate: review.replyDate ? new Date(review.replyDate) : undefined,
          replyText: review.replyText || undefined,
          region: region.name,
          regionCode: region.code,
          language: region.language,
        });
      }

      console.log(`✅ Collected ${result.data.length} reviews from ${region.name}`);

      // Rate limiting - wait 3 seconds between regions
      if (config.regions.indexOf(region) < config.regions.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`❌ Failed to fetch reviews from ${region.name}:`, error);
    }
  }

  console.log(`\n📊 Total reviews collected: ${reviews.length}`);
  return reviews;
}

export async function getGooglePlayAppInfo(appId: string): Promise<{
  name: string;
  averageRating: number;
  totalRatings: number;
  totalReviews: number;
  installs: string;
  currentVersion: string;
}> {
  try {
    const app = await gplay.app({ appId });

    return {
      name: app.title,
      averageRating: app.score,
      totalRatings: app.ratings,
      totalReviews: app.reviews,
      installs: app.installs,
      currentVersion: app.version,
    };
  } catch (error) {
    console.error('❌ Failed to fetch app info:', error);
    throw error;
  }
}
