import axios from 'axios';
import type { AppStoreReview, AnalyzedAppStoreReview, SentimentAnalysis } from '../types.js';

const QWEN_API_KEY = process.env.QWEN_API_KEY || '';
const QWEN_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const QWEN_MODEL = 'qwen-plus';

interface QwenAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  explanation: string;
  topics: string[];
}

export async function analyzeReview(review: AppStoreReview): Promise<AnalyzedAppStoreReview> {
  const prompt = `你正在分析 SHEIN 购物应用的 App Store 评论。请分析以下评论并提供：

1. 情感倾向：positive（正面）、negative（负面）或 neutral（中性）
2. 情感分数：-1（非常负面）到 1（非常正面）
3. 主要话题/问题（从以下选择：delivery, quality, price, ui/ux, customer-service, sizing, returns, payment, other）
4. 情感的简要中文解释（1-2句话）

评论内容：
标题：${review.title}
评分：${review.rating}/5
内容：${review.content}

请用JSON格式回复：
{
  "sentiment": "positive|negative|neutral",
  "score": -1 到 1 之间的数值,
  "explanation": "用中文简要解释情感倾向（1-2句话）",
  "topics": ["topic1", "topic2", ...]
}`;

  try {
    const response = await axios.post(
      QWEN_ENDPOINT,
      {
        model: QWEN_MODEL,
        input: {
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        parameters: {
          result_format: 'message',
          temperature: 0.3,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${QWEN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data.output.choices[0].message.content;
    const result: QwenAnalysisResult = parseQwenResponse(content);

    const sentiment: SentimentAnalysis = {
      sentiment: result.sentiment,
      score: result.score,
      confidence: Math.abs(result.score),
      summary: result.explanation,
    };

    return {
      ...review,
      sentiment,
      topics: result.topics,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to analyze review ${review.id}:`, error);

    // Fallback: basic sentiment based on rating
    const fallbackSentiment: SentimentAnalysis = {
      sentiment: review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral',
      score: (review.rating - 3) / 2, // Convert 1-5 to -1 to 1
      confidence: 0.5,
      summary: 'Analysis unavailable (using rating-based fallback)',
    };

    return {
      ...review,
      sentiment: fallbackSentiment,
      topics: ['other'],
      analyzedAt: new Date().toISOString(),
    };
  }
}

function parseQwenResponse(content: string): QwenAnalysisResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        sentiment: parsed.sentiment || 'neutral',
        score: parsed.score || 0,
        explanation: parsed.explanation || '',
        topics: parsed.topics || ['other'],
      };
    }
  } catch (error) {
    console.error('Failed to parse Qwen response:', error);
  }

  // Fallback parsing
  return {
    sentiment: 'neutral',
    score: 0,
    explanation: content.substring(0, 200),
    topics: ['other'],
  };
}

export async function analyzeBatch(
  reviews: AppStoreReview[],
  onProgress?: (current: number, total: number) => void,
  options: {
    concurrent?: boolean;
    concurrency?: number;
  } = {}
): Promise<AnalyzedAppStoreReview[]> {
  const { concurrent = true, concurrency = 5 } = options;

  console.error(`\n🤖 Analyzing ${reviews.length} reviews with Qwen AI...`);
  console.error(`   Mode: ${concurrent ? `Concurrent (${concurrency} at a time)` : 'Sequential'}\n`);

  if (!concurrent) {
    // Original sequential processing
    const analyzed: AnalyzedAppStoreReview[] = [];

    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];

      if (onProgress) {
        onProgress(i + 1, reviews.length);
      }

      console.error(`[${i + 1}/${reviews.length}] Analyzing review from ${review.region}...`);

      const analyzedReview = await analyzeReview(review);
      analyzed.push(analyzedReview);

      // Rate limiting: 500ms between requests
      if (i < reviews.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.error(`\n✅ Analysis complete!\n`);
    return analyzed;
  }

  // Concurrent processing with batching
  const analyzed: AnalyzedAppStoreReview[] = [];
  const total = reviews.length;

  for (let i = 0; i < total; i += concurrency) {
    const batch = reviews.slice(i, i + concurrency);
    const batchStart = i + 1;

    console.error(`📦 Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(total / concurrency)} (reviews ${batchStart}-${Math.min(i + concurrency, total)})...`);

    // Process batch concurrently
    const batchPromises = batch.map(async (review, batchIndex) => {
      try {
        const result = await analyzeReview(review);

        if (onProgress) {
          onProgress(batchStart + batchIndex, total);
        }

        return result;
      } catch (error) {
        console.error(`❌ Failed to analyze review ${review.id}:`, error);
        // Return fallback analysis
        const fallbackSentiment: SentimentAnalysis = {
          sentiment: review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral',
          score: (review.rating - 3) / 2,
          confidence: 0.5,
          summary: '分析失败(使用评分降级处理)',
        };
        return {
          ...review,
          sentiment: fallbackSentiment,
          topics: ['other'],
          analyzedAt: new Date().toISOString(),
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    analyzed.push(...batchResults);

    // Rate limiting between batches
    if (i + concurrency < total) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.error(`\n✅ Analysis complete! Processed ${analyzed.length}/${total} reviews\n`);

  return analyzed;
}
