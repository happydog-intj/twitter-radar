// Type definitions for Twitter Radar

export interface TwitterAccount {
  username: string;
  userId?: string;
  priority: 'high' | 'medium' | 'low';
  description?: string;
}

export interface Tweet {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
  createdAt: string;
  metrics?: {
    likeCount: number;
    retweetCount: number;
    replyCount: number;
    impressionCount?: number;
  };
  entities?: {
    hashtags?: string[];
    mentions?: string[];
    urls?: string[];
  };
  referencedTweets?: Array<{
    type: 'retweeted' | 'quoted' | 'replied_to';
    id: string;
  }>;
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // -1 到 1
  confidence: number; // 0 到 1
  summary: string;
}

export interface SheinRelevance {
  isRelevant: boolean;
  confidence: number; // 0 到 1
  reason: string;
  keywords: string[];
}

export interface AnalyzedTweet extends Tweet {
  sentiment: SentimentAnalysis;
  sheinRelevance: SheinRelevance;
  analyzedAt: string;
}

export interface DigestSection {
  title: string;
  tweets: AnalyzedTweet[];
}

export interface Digest {
  date: string;
  summary: {
    totalTweets: number;
    sheinRelated: number;
    sentimentBreakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
  sections: DigestSection[];
  language: 'en' | 'zh';
}

// App Store types
export interface AppStoreReview {
  id: string;
  author: string;
  rating: number; // 1-5
  title: string;
  content: string;
  date: Date;
  version: string;
  region: string;
  regionCode: string;
  voteSum: number;
  voteCount: number;
}

export interface AnalyzedAppStoreReview extends AppStoreReview {
  sentiment: SentimentAnalysis;
  topics: string[]; // 主要话题标签: delivery, quality, price, etc.
  analyzedAt: string;
}

export interface AppStoreRegion {
  code: string; // us, gb, ca, etc.
  name: string;
  language: string;
}

export interface AppStoreConfig {
  appId: string;
  regions: AppStoreRegion[];
  maxReviewsPerRegion: number;
}

export interface AppStoreDigest {
  date: string;
  appInfo: {
    name: string;
    averageRating: number;
    totalReviews: number;
    currentVersion: string;
  };
  summary: {
    totalReviews: number;
    ratingBreakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
    sentimentBreakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
    topTopics: Array<{ topic: string; count: number }>;
  };
  reviewsByRegion: {
    [region: string]: AnalyzedAppStoreReview[];
  };
  language: 'en' | 'zh';
}

// Google Play types
export interface GooglePlayReview {
  id: string;
  userName: string;
  userImage: string;
  rating: number; // 1-5
  text: string;
  date: Date;
  version: string;
  thumbsUp: number;
  replyDate?: Date;
  replyText?: string;
  region: string;
  regionCode: string;
  language: string;
}

export interface AnalyzedGooglePlayReview extends GooglePlayReview {
  sentiment: SentimentAnalysis;
  topics: string[];
  analyzedAt: string;
}

export interface GooglePlayRegion {
  code: string; // us, gb, cn, etc.
  name: string;
  language: string;
}

export interface GooglePlayConfig {
  appId: string;
  regions: GooglePlayRegion[];
  reviewsPerRegion: number;
}

export interface GooglePlayDigest {
  date: string;
  appInfo: {
    name: string;
    averageRating: number;
    totalRatings: number;
    totalReviews: number;
    installs: string;
    currentVersion: string;
  };
  summary: {
    totalReviews: number;
    ratingBreakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
    sentimentBreakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
    topTopics: Array<{ topic: string; count: number }>;
    developerReplies: number;
  };
  reviewsByRegion: {
    [region: string]: AnalyzedGooglePlayReview[];
  };
  language: 'en' | 'zh';
}

export interface Config {
  twitter: {
    accounts: TwitterAccount[];
    maxTweetsPerAccount: number;
    sinceDays: number;
  };
  appStore?: AppStoreConfig;
  googlePlay?: GooglePlayConfig;
  qwen: {
    model: string;
    apiKey: string;
    endpoint?: string;
  };
  shein: {
    keywords: string[];
    brands: string[];
    relatedTerms: string[];
  };
  output: {
    formats: string[];
    createIssues: boolean;
  };
  notifications: {
    telegram?: {
      enabled: boolean;
      botToken?: string;
      chatId?: string;
    };
  };
}
