/**
 * Chart generation using QuickChart API
 * QuickChart is a free service that generates charts from Chart.js configs
 */

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
}

/**
 * Generate sentiment distribution pie chart
 */
export function generateSentimentChartUrl(
  positive: number,
  negative: number,
  neutral: number
): string {
  const chartConfig = {
    type: 'pie',
    data: {
      labels: ['Positive 😊', 'Negative 😞', 'Neutral 😐'],
      datasets: [
        {
          data: [positive, negative, neutral],
          backgroundColor: ['#4ade80', '#f87171', '#94a3b8'],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: 'Sentiment Distribution',
        fontSize: 16,
      },
      plugins: {
        datalabels: {
          display: true,
          color: '#fff',
          font: {
            weight: 'bold',
            size: 14,
          },
          formatter: (value: number, context: any) => {
            const sum = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / sum) * 100).toFixed(1);
            return `${percentage}%`;
          },
        },
      },
    },
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?c=${encodedConfig}&width=500&height=300`;
}

/**
 * Generate rating distribution bar chart
 */
export function generateRatingChartUrl(ratings: {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}): string {
  const chartConfig = {
    type: 'bar',
    data: {
      labels: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'],
      datasets: [
        {
          label: 'Reviews',
          data: [ratings[1], ratings[2], ratings[3], ratings[4], ratings[5]],
          backgroundColor: [
            '#ef4444',
            '#f97316',
            '#eab308',
            '#84cc16',
            '#22c55e',
          ],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: 'Rating Distribution',
        fontSize: 16,
      },
      legend: {
        display: false,
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
      plugins: {
        datalabels: {
          display: true,
          anchor: 'end',
          align: 'top',
          color: '#000',
          font: {
            weight: 'bold',
          },
        },
      },
    },
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?c=${encodedConfig}&width=500&height=300`;
}

/**
 * Generate topic distribution bar chart
 */
export function generateTopicChartUrl(topics: Array<{ topic: string; count: number }>): string {
  const sortedTopics = [...topics].sort((a, b) => b.count - a.count).slice(0, 8);

  const chartConfig = {
    type: 'horizontalBar',
    data: {
      labels: sortedTopics.map((t) => t.topic),
      datasets: [
        {
          label: 'Mentions',
          data: sortedTopics.map((t) => t.count),
          backgroundColor: '#3b82f6',
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: 'Top Issues & Topics',
        fontSize: 16,
      },
      legend: {
        display: false,
      },
      scales: {
        xAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
      plugins: {
        datalabels: {
          display: true,
          anchor: 'end',
          align: 'right',
          color: '#000',
          font: {
            weight: 'bold',
          },
        },
      },
    },
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?c=${encodedConfig}&width=600&height=400`;
}

/**
 * Generate competitor comparison bar chart
 */
export function generateCompetitorChartUrl(competitors: Array<{ name: string; rating: number }>): string {
  const sortedCompetitors = [...competitors].sort((a, b) => b.rating - a.rating);

  const chartConfig = {
    type: 'bar',
    data: {
      labels: sortedCompetitors.map((c) => c.name),
      datasets: [
        {
          label: 'Rating',
          data: sortedCompetitors.map((c) => c.rating),
          backgroundColor: sortedCompetitors.map((c) =>
            c.name === 'SHEIN' ? '#f97316' : '#94a3b8'
          ),
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: 'Competitor Rating Comparison',
        fontSize: 16,
      },
      legend: {
        display: false,
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              max: 5,
            },
          },
        ],
      },
      plugins: {
        datalabels: {
          display: true,
          anchor: 'end',
          align: 'top',
          color: '#000',
          font: {
            weight: 'bold',
          },
          formatter: (value: number) => value.toFixed(1),
        },
      },
    },
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?c=${encodedConfig}&width=600&height=400`;
}

/**
 * Generate all chart URLs for a report
 */
export interface ReportCharts {
  sentimentChart: string;
  ratingChart: string;
  topicChart: string;
}

export function generateReportCharts(stats: {
  positive: number;
  negative: number;
  neutral: number;
  ratings: { 5: number; 4: number; 3: number; 2: number; 1: number };
  topics: Array<{ topic: string; count: number }>;
}): ReportCharts {
  return {
    sentimentChart: generateSentimentChartUrl(stats.positive, stats.negative, stats.neutral),
    ratingChart: generateRatingChartUrl(stats.ratings),
    topicChart: generateTopicChartUrl(stats.topics),
  };
}

/**
 * Add charts to markdown report
 */
export function addChartsToMarkdown(markdown: string, charts: ReportCharts): string {
  const chartsSection = `
## 📊 Visual Analysis

### Sentiment Distribution
![Sentiment Distribution](${charts.sentimentChart})

### Rating Distribution
![Rating Distribution](${charts.ratingChart})

### Top Issues & Topics
![Top Topics](${charts.topicChart})

---

`;

  // Insert charts section after the summary
  const summaryEndIndex = markdown.indexOf('\n## ');
  if (summaryEndIndex !== -1) {
    return (
      markdown.slice(0, summaryEndIndex) +
      '\n' +
      chartsSection +
      markdown.slice(summaryEndIndex)
    );
  }

  return markdown + '\n' + chartsSection;
}
