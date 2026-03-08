import RSS from 'rss';
import { writeFileSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { OUTPUT_DIR, PUBLIC_DIR } from '../config.js';

export function generateRSSFeed(): void {
  const feed = new RSS({
    title: 'Twitter Radar',
    description: 'Monitor Twitter accounts and analyze posts with AI',
    feed_url: 'https://happydog-intj.github.io/twitter-radar/feed.xml',
    site_url: 'https://happydog-intj.github.io/twitter-radar',
    language: 'en',
    pubDate: new Date(),
  });

  // Read all report files
  const reports = collectReports();

  for (const report of reports) {
    feed.item({
      title: `Twitter Radar - ${report.date}`,
      description: report.content.substring(0, 500) + '...',
      url: `https://happydog-intj.github.io/twitter-radar/${report.date}.html`,
      date: new Date(report.date),
    });
  }

  // Save RSS feed
  mkdirSync(PUBLIC_DIR, { recursive: true });
  const xml = feed.xml({ indent: true });
  writeFileSync(join(PUBLIC_DIR, 'feed.xml'), xml, 'utf8');

  console.log('✅ Generated RSS feed');
}

function collectReports(): Array<{ date: string; content: string }> {
  const reports: Array<{ date: string; content: string }> = [];

  try {
    const months = readdirSync(OUTPUT_DIR).filter((name) => /^\d{4}-\d{2}$/.test(name));

    for (const month of months) {
      const monthDir = join(OUTPUT_DIR, month);
      const files = readdirSync(monthDir).filter((name) => name.endsWith('-en.md'));

      for (const file of files) {
        const date = file.replace('-en.md', '');
        const content = readFileSync(join(monthDir, file), 'utf8');
        reports.push({ date, content });
      }
    }
  } catch (error) {
    console.error('Failed to collect reports:', error);
  }

  return reports.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
}
