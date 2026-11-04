import { resolve } from 'node:path';
import { loadConfig } from '../config/loader.js';
import { createSQLiteStore } from '../store/sqlite-store.js';
import { generateDashboard } from './generator.js';

const config = loadConfig();
const store = createSQLiteStore(config.store.path);

const outputPath = resolve(config.dashboard.outputPath);
const result = generateDashboard(store, outputPath);
store.close();

console.log(`Dashboard generated: ${result}`);
