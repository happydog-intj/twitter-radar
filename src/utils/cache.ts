import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { AnalyzedAppStoreReview, AnalyzedGooglePlayReview } from '../types.js';

const CACHE_DIR = join(process.cwd(), '.cache');

// Ensure cache directory exists
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Cache for storing analyzed reviews to prevent duplicate processing
 */
export class ReviewCache {
  private cacheFile: string;
  private cache: Set<string>;

  constructor(platform: 'appstore' | 'googleplay') {
    this.cacheFile = join(CACHE_DIR, `${platform}-reviewed-ids.json`);
    this.cache = this.loadCache();
  }

  private loadCache(): Set<string> {
    if (existsSync(this.cacheFile)) {
      try {
        const data = JSON.parse(readFileSync(this.cacheFile, 'utf8'));
        return new Set(data);
      } catch (error) {
        console.error(`Failed to load cache from ${this.cacheFile}:`, error);
        return new Set();
      }
    }
    return new Set();
  }

  private saveCache(): void {
    try {
      writeFileSync(this.cacheFile, JSON.stringify([...this.cache]), 'utf8');
    } catch (error) {
      console.error(`Failed to save cache to ${this.cacheFile}:`, error);
    }
  }

  /**
   * Check if a review has already been processed
   */
  has(reviewId: string): boolean {
    return this.cache.has(reviewId);
  }

  /**
   * Mark a review as processed
   */
  add(reviewId: string): void {
    this.cache.add(reviewId);
    this.saveCache();
  }

  /**
   * Mark multiple reviews as processed
   */
  addBatch(reviewIds: string[]): void {
    reviewIds.forEach((id) => this.cache.add(id));
    this.saveCache();
  }

  /**
   * Filter out already processed reviews
   */
  filterNew<T extends { id: string }>(reviews: T[]): T[] {
    const newReviews = reviews.filter((review) => !this.has(review.id));
    console.error(`📊 Deduplication: ${reviews.length} total, ${newReviews.length} new, ${reviews.length - newReviews.length} duplicates`);
    return newReviews;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clear cache (use with caution)
   */
  clear(): void {
    this.cache.clear();
    this.saveCache();
  }

  /**
   * Clean old entries (keep only last N days worth of reviews)
   */
  cleanOld(daysToKeep: number = 30): void {
    // This is a simple implementation that just limits cache size
    // In production, you'd want to store timestamps and clean by date
    const maxSize = daysToKeep * 500; // Assume ~500 reviews per day
    if (this.cache.size > maxSize) {
      const sorted = [...this.cache];
      this.cache = new Set(sorted.slice(-maxSize));
      this.saveCache();
      console.error(`🧹 Cleaned cache: kept last ${maxSize} entries`);
    }
  }
}

/**
 * Deduplicate reviews from multiple regions
 */
export function deduplicateByContent<T extends { id?: string; title?: string; text?: string; content?: string }>(
  reviews: T[]
): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const review of reviews) {
    // Create a hash from review content
    const content = (review.text || review.content || review.title || '').trim().toLowerCase();
    const hash = content.substring(0, 100); // Use first 100 chars as identifier

    if (!seen.has(hash)) {
      seen.add(hash);
      unique.push(review);
    }
  }

  if (unique.length < reviews.length) {
    console.error(`🔍 Content deduplication: ${reviews.length} → ${unique.length} (removed ${reviews.length - unique.length} duplicates)`);
  }

  return unique;
}
