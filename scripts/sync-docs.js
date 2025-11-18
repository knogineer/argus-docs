#!/usr/bin/env node
/**
 * Automated Documentation Sync
 * Syncs approved docs from source repos, blocks junk files
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const APPROVED_SOURCES = {
  '/mnt/development/README.md': 'guide/index.md',
  '/mnt/development/AI_MASTER_GUIDE.md': 'guide/ai-guide.md',
  '/mnt/development/CODING_GUIDELINES.md': 'guide/coding-guidelines.md',
  '/mnt/development/TYPE_SAFETY_RULES.md': 'guide/type-safety.md',
  '/mnt/development/I18N_AND_ACCESSIBILITY_REQUIREMENTS.md': 'guide/accessibility.md',
  '/mnt/development/DATABASE_CONNECTION_GUIDE.md': 'guide/database.md',
  '/mnt/development/CLOUDFLARE_MANAGEMENT_GUIDE.md': 'guide/deployment.md'
};

const BLOCKED_PATTERNS = [
  /SUMMARY/i,
  /COMPLETE/i,
  /FIXES/i,
  /SESSION/i,
  /PROMPT/i,
  /STATUS/i,
  /AUDIT/i
];

function isJunkDoc(filename) {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(filename));
}

function syncDocs() {
  let synced = 0;
  let blocked = 0;

  for (const [source, dest] of Object.entries(APPROVED_SOURCES)) {
    if (isJunkDoc(source)) {
      console.log(`❌ Blocked: ${source}`);
      blocked++;
      continue;
    }

    if (existsSync(source)) {
      const content = readFileSync(source, 'utf8');
      const destPath = join(process.cwd(), dest);
      writeFileSync(destPath, content);
      console.log(`✅ Synced: ${source} → ${dest}`);
      synced++;
    }
  }

  console.log(`\n📊 Summary: ${synced} synced, ${blocked} blocked`);
}

syncDocs();
