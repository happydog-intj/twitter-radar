import { format } from 'date-fns';
import { demoTweets } from './demo-data.js';
import { analyzeBatch } from './analyzers/qwen.js';
import { generateMarkdownReport, saveReport } from './generators/markdown.js';
import { generateRSSFeed } from './generators/rss.js';
import { sendTelegramNotification, formatTelegramMessage } from './notifiers/telegram.js';
import { LANGUAGE } from './config.js';

async function main() {
  console.log('🔭 Twitter Radar - 演示模式');
  console.log('');
  console.log('使用模拟推文数据 + 真实 Qwen AI 分析');
  console.log('='.repeat(50));
  console.log('');

  const today = format(new Date(), 'yyyy-MM-dd');

  try {
    // Step 1: 使用演示数据
    console.log('📊 加载演示推文数据...');
    const tweets = demoTweets;
    console.log(`  ✓ 加载了 ${tweets.length} 条模拟推文`);
    console.log('');

    console.log('演示推文示例：');
    console.log('-'.repeat(50));
    for (let i = 0; i < Math.min(3, tweets.length); i++) {
      console.log(`${i + 1}. @${tweets[i].authorUsername}:`);
      console.log(`   ${tweets[i].text.substring(0, 80)}...`);
      console.log(`   💙 ${tweets[i].metrics?.likeCount} | 🔁 ${tweets[i].metrics?.retweetCount}`);
      console.log('');
    }
    console.log('');

    // Step 2: 使用真实 Qwen AI 分析
    console.log('🧠 使用 Qwen AI 分析推文...');
    console.log('  提示：这将使用真实的 Qwen API 进行情感分析和 SHEIN 相关性判断');
    console.log('');

    const analyzed = await analyzeBatch(tweets);
    console.log(`  ✓ 分析完成 ${analyzed.length} 条推文`);
    console.log('');

    // 显示分析示例
    console.log('分析结果示例：');
    console.log('-'.repeat(50));
    for (let i = 0; i < Math.min(3, analyzed.length); i++) {
      const tweet = analyzed[i];
      console.log(`${i + 1}. @${tweet.authorUsername}:`);
      console.log(`   推文: ${tweet.text.substring(0, 60)}...`);
      console.log(`   情感: ${tweet.sentiment.sentiment} (${tweet.sentiment.score.toFixed(2)})`);
      console.log(`   SHEIN相关: ${tweet.sheinRelevance.isRelevant ? '是' : '否'} (置信度: ${tweet.sheinRelevance.confidence.toFixed(2)})`);
      if (tweet.sheinRelevance.keywords.length > 0) {
        console.log(`   关键词: ${tweet.sheinRelevance.keywords.join(', ')}`);
      }
      console.log('');
    }
    console.log('');

    // Calculate stats
    const sheinRelated = analyzed.filter((t) => t.sheinRelevance.isRelevant);
    const sentiment = {
      positive: analyzed.filter((t) => t.sentiment.sentiment === 'positive').length,
      negative: analyzed.filter((t) => t.sentiment.sentiment === 'negative').length,
      neutral: analyzed.filter((t) => t.sentiment.sentiment === 'neutral').length,
    };

    console.log('📈 分析统计：');
    console.log('-'.repeat(50));
    console.log(`  总推文数: ${analyzed.length}`);
    console.log(`  SHEIN相关: ${sheinRelated.length} (${((sheinRelated.length / analyzed.length) * 100).toFixed(1)}%)`);
    console.log(`  情感分布:`);
    console.log(`    😊 正面: ${sentiment.positive} (${((sentiment.positive / analyzed.length) * 100).toFixed(1)}%)`);
    console.log(`    😐 中性: ${sentiment.neutral} (${((sentiment.neutral / analyzed.length) * 100).toFixed(1)}%)`);
    console.log(`    😞 负面: ${sentiment.negative} (${((sentiment.negative / analyzed.length) * 100).toFixed(1)}%)`);
    console.log('');

    // Step 3: Generate reports
    console.log('📝 生成报告...');
    const languages = LANGUAGE === 'both' ? ['en', 'zh'] : [LANGUAGE];

    for (const lang of languages as Array<'en' | 'zh'>) {
      const markdown = generateMarkdownReport(today, lang, analyzed);
      saveReport(markdown, today, lang);
    }

    // Step 4: Generate RSS feed
    console.log('📡 生成 RSS feed...');
    generateRSSFeed();

    // Step 5: Send notifications
    if (sheinRelated.length > 0) {
      console.log('📬 发送通知...');
      const telegramMessage = formatTelegramMessage(analyzed.length, sheinRelated);
      await sendTelegramNotification(telegramMessage);
    }

    console.log('');
    console.log('='.repeat(50));
    console.log('✅ 演示分析完成！');
    console.log('');
    console.log(`📁 报告已保存到: reports/${today.substring(0, 7)}/`);
    console.log(`📄 查看报告: reports/latest.md`);
    console.log(`📡 RSS feed: public/feed.xml`);
    console.log('');
    console.log('💡 提示: 这是演示模式，使用了模拟推文数据');
    console.log('   配置真实的 Twitter API 后即可获取真实推文');
  } catch (error) {
    console.error('❌ 分析过程出错:', error);
    process.exit(1);
  }
}

main();
