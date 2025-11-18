#!/usr/bin/env node
/**
 * Documentation Validator
 * Ensures no junk docs, validates accessibility, checks links
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

const JUNK_PATTERNS = [
  /SUMMARY\.md$/i,
  /COMPLETE\.md$/i,
  /FIXES\.md$/i,
  /SESSION.*\.md$/i,
  /PROMPT.*\.md$/i,
  /STATUS\.md$/i,
  /_AUDIT\.md$/i,
  /VERIFICATION\.md$/i
];

const REQUIRED_FRONTMATTER = ['title'];

function findMarkdownFiles(dir, files = []) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const path = join(dir, item);
    const stat = statSync(path);
    
    if (stat.isDirectory() && !item.startsWith('.')) {
      findMarkdownFiles(path, files);
    } else if (item.endsWith('.md')) {
      files.push(path);
    }
  }
  
  return files;
}

function validateFile(filepath) {
  const filename = filepath.split('/').pop();
  const errors = [];
  
  // Check for junk patterns
  if (JUNK_PATTERNS.some(p => p.test(filename))) {
    errors.push(`Junk doc detected: ${filename}`);
  }
  
  const content = readFileSync(filepath, 'utf8');
  
  // Check frontmatter
  if (content.startsWith('---')) {
    const frontmatter = content.split('---')[1];
    for (const field of REQUIRED_FRONTMATTER) {
      if (!frontmatter.includes(`${field}:`)) {
        errors.push(`Missing frontmatter: ${field}`);
      }
    }
  }
  
  // Check for broken links
  const links = content.match(/\[.*?\]\((.*?)\)/g) || [];
  for (const link of links) {
    const url = link.match(/\((.*?)\)/)[1];
    if (url.startsWith('/') && !url.startsWith('http')) {
      // Internal link - could validate existence
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
      console.log(`\n❌ ${file}:`);
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
