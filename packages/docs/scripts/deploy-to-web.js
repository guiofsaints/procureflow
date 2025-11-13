#!/usr/bin/env node

/**
 * Deploy Documentation to Web Public Folder
 *
 * This script copies the built documentation from packages/docs/out
 * to packages/web/public/docs so it can be served at /docs route
 * in production.
 */

const fs = require('fs');
const path = require('path');

const DOCS_OUT_DIR = path.resolve(__dirname, '../out');
const WEB_PUBLIC_DOCS_DIR = path.resolve(__dirname, '../../web/public/docs');

console.log('🚀 Deploying documentation to web...\n');

// Check if docs build exists
if (!fs.existsSync(DOCS_OUT_DIR)) {
  console.error('❌ Error: Documentation build not found at:', DOCS_OUT_DIR);
  console.error('   Run "pnpm build" first to generate the documentation.');
  process.exit(1);
}

// Create web/public directory if it doesn't exist
const webPublicDir = path.resolve(__dirname, '../../web/public');
if (!fs.existsSync(webPublicDir)) {
  console.log('📁 Creating web/public directory...');
  fs.mkdirSync(webPublicDir, { recursive: true });
}

// Remove existing docs directory in web/public
if (fs.existsSync(WEB_PUBLIC_DOCS_DIR)) {
  console.log('🗑️  Removing old documentation...');
  fs.rmSync(WEB_PUBLIC_DOCS_DIR, { recursive: true, force: true });
}

// Copy documentation to web/public/docs
console.log('📦 Copying documentation files...');
copyDirectory(DOCS_OUT_DIR, WEB_PUBLIC_DOCS_DIR);

// Fix HTML paths to work with /docs prefix
console.log('🔧 Adjusting paths for /docs serving...');
fixHtmlPaths(WEB_PUBLIC_DOCS_DIR);

console.log('\n✅ Documentation deployed successfully!');
console.log(`   Source: ${DOCS_OUT_DIR}`);
console.log(`   Target: ${WEB_PUBLIC_DOCS_DIR}`);
console.log('\n📚 Documentation will be available at: /docs');

/**
 * Recursively copy directory
 */
function copyDirectory(src, dest) {
  // Create destination directory
  fs.mkdirSync(dest, { recursive: true });

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      copyDirectory(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Fix HTML paths to work with /docs prefix
 */
function fixHtmlPaths(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      fixHtmlPaths(fullPath);
    } else if (entry.name.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf-8');

      // Fix asset paths: /_next/ -> /docs/_next/
      content = content.replace(/href="\/_next\//g, 'href="/docs/_next/');
      content = content.replace(/src="\/_next\//g, 'src="/docs/_next/');

      // Fix pagefind paths: /_pagefind/ -> /docs/_pagefind/
      content = content.replace(
        /href="\/_pagefind\//g,
        'href="/docs/_pagefind/'
      );
      content = content.replace(/src="\/_pagefind\//g, 'src="/docs/_pagefind/');

      // Fix root paths for navigation: href="/ -> href="/docs/
      content = content.replace(/href="\/(?!docs)/g, 'href="/docs/');

      fs.writeFileSync(fullPath, content, 'utf-8');
    } else if (entry.name.endsWith('.js')) {
      // Fix JavaScript bundle paths for pagefind
      let content = fs.readFileSync(fullPath, 'utf-8');

      // Fix pagefind dynamic imports and paths
      content = content.replace(/"\/\_pagefind\//g, '"/docs/_pagefind/');
      content = content.replace(/'\/\_pagefind\//g, "'/docs/_pagefind/");
      content = content.replace(/`\/\_pagefind\//g, '`/docs/_pagefind/');

      fs.writeFileSync(fullPath, content, 'utf-8');
    }
  }
}
