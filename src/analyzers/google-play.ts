import axios from 'axios';
import type { GooglePlayReview, AnalyzedGooglePlayReview, SentimentAnalysis } from '../types.js';

const QWEN_API_KEY = process.env.QWEN_API_KEY || '';
const QWEN_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const QWEN_MODEL = 'qwen-plus';

interface QwenAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  explanation: string;
  topics: string[];
}

export async function analyzeReview(review: GooglePlayReview): Promise<AnalyzedGooglePlayReview> {
  const prompt = `You are analyzing a Google Play review for SHEIN shopping app. Analyze the following review and provide:

1. Sentiment: positive, negative, or neutral
2. Sentiment score: -1 (very negative) to 1 (very positive)
3. Main topics/issues mentioned (choose from: delivery, quality, price, ui/ux, customer-service, sizing, returns, payment, other)
4. Brief explanation of the sentiment

Review:
Rating: ${review.rating}/5
Content: ${review.text}

Respond in JSON format:
{
  "sentiment": "positive|negative|neutral",
  "score": -1 to 1,
  "explanation": "brief explanation in English",
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
  reviews: GooglePlayReview[],
  onProgress?: (current: number, total: number) => void
): Promise<AnalyzedGooglePlayReview[]> {
  const analyzed: AnalyzedGooglePlayReview[] = [];

  console.log(`\n🤖 Analyzing ${reviews.length} reviews with Qwen AI...\n`);

  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];

    if (onProgress) {
      onProgress(i + 1, reviews.length);
    }

    console.log(`[${i + 1}/${reviews.length}] Analyzing review from ${review.region}...`);

    const analyzedReview = await analyzeReview(review);
    analyzed.push(analyzedReview);

    // Rate limiting: 500ms between requests
    if (i < reviews.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`\n✅ Analysis complete!\n`);

  return analyzed;
}
