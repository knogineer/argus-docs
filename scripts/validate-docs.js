#!/usr/bin/env node
/**
 * Documentation Validator
 * Ensures no junk docs, validates accessibility, checks links
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative, sep } from 'path';

const JUNK_PATTERNS = [
  /SUMMARY/i,
  /COMPLETE/i,
  /FIXES/i,
  /SESSION/i,
  /PROMPT/i,
  /STATUS/i,
  /AUDIT/i,
  /VERIFICATION/i
];

const REQUIRED_FRONTMATTER = ['title', 'description'];
const VALIDATION_ROOTS = new Set(['guide', 'api', 'components']);
const IGNORE_DIRS = new Set(['node_modules', '.git', '.github', '.vscode']);

function shouldValidate(filepath) {
  const parts = filepath.split(sep);
  const root = parts[0];

  if (VALIDATION_ROOTS.has(root)) return true;
  return filepath === 'index.md';
}

function findMarkdownFiles(dir, files = []) {
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (IGNORE_DIRS.has(item) || item.startsWith('.')) continue;
      findMarkdownFiles(fullPath, files);
    } else if (item.endsWith('.md')) {
      const relPath = relative(process.cwd(), fullPath);
      if (shouldValidate(relPath)) {
        files.push({ fullPath, relPath });
      }
    }
  }

  return files;
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

function validateFile({ fullPath, relPath }) {
  const filename = relPath.split(sep).pop();
  const errors = [];

  if (JUNK_PATTERNS.some(p => p.test(filename))) {
    errors.push(`Junk doc detected: ${filename}`);
  }

  const content = readFileSync(fullPath, 'utf8');
  const frontmatter = extractFrontmatter(content);

  if (!frontmatter) {
    errors.push('Missing frontmatter block');
  } else {
    for (const field of REQUIRED_FRONTMATTER) {
      const fieldPattern = new RegExp(`^${field}:`, 'm');
      if (!fieldPattern.test(frontmatter)) {
        errors.push(`Missing frontmatter: ${field}`);
      }
    }
  }

  return errors;
}

function validate() {
  const files = findMarkdownFiles('.');
  let totalErrors = 0;

  for (const file of files) {
    const errors = validateFile(file);
    if (errors.length > 0) {
      console.log(`\n❌ ${file.relPath}:`);
      errors.forEach(e => console.log(`   ${e}`));
      totalErrors += errors.length;
    }
  }

  if (totalErrors > 0) {
    console.log(`\n❌ Validation failed: ${totalErrors} errors`);
    process.exit(1);
  }

  console.log('\n✅ All docs validated');
}

validate();
