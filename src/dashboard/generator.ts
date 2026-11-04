import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import type { HealingStore } from '../store/store.js';
import type { DashboardData } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function generateDashboard(store: HealingStore, outputPath: string): string {
  const data: DashboardData = {
    generatedAt: new Date().toISOString(),
    accuracy: store.getAccuracy(),
    classificationSummary: store.getClassificationSummary(),
    timeline: store.getTimeline(30),
    topBrokenSelectors: store.getTopBrokenSelectors(10),
    recentEvents: store.getRecentEvents(20),
  };

  const templateSource = readFileSync(join(__dirname, 'template.html'), 'utf-8');
  const template = Handlebars.compile(templateSource);

  const accuracyPercent = data.accuracy.total > 0
    ? Math.round(data.accuracy.accuracy * 100)
    : 0;

  const html = template({
    ...data,
    accuracyPercent,
    accuracyHigh: data.accuracy.accuracy >= 0.5,
    dataJson: JSON.stringify(data),
  });

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, html, 'utf-8');

  return outputPath;
}
