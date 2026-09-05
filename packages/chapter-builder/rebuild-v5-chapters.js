const fs = require('fs');
const path = require('path');
const { buildMonolithicHTML } = require('./base64-bundler');

/**
 * Aasha Chapter Upgrade Script
 * ----------------------------
 * This script loops through the existing 'standalone_chapters' built on the v5 standard,
 * extracts their core metadata (simulated here), and rebuilds them using the new 
 * offline PIE/H5P pipeline (v6 monolithic HTML) into the 'chapters' directory.
 */

const inputDir = path.resolve(__dirname, '../../standalone_chapters');
const outputDir = path.resolve(__dirname, '../../chapters');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function rebuildAllChapters() {
  console.log('--- Starting V5 to V6 Offline Monolithic HTML Upgrade ---');
  
  if (!fs.existsSync(inputDir)) {
    console.error(`Input directory not found: ${inputDir}`);
    return;
  }

  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.html'));

  if (files.length === 0) {
    console.log('No HTML chapters found to upgrade.');
    return;
  }

  for (const file of files) {
    console.log(`\nProcessing: ${file}`);
    const filePath = path.join(inputDir, file);
    const htmlContent = fs.readFileSync(filePath, 'utf8');

    // Step 1: Extract core content from the v5 HTML
    // In a full implementation, you might parse this HTML with cheerio, 
    // extract the raw text, and send it to the Fastify OpenRouter endpoint 
    // to dynamically generate the H5P and PIE JSON.
    // For this implementation, we will mock the AI-generated JSON structure.
    
    // Extract title (simple regex for demonstration)
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
    const chapterTitle = titleMatch ? titleMatch[1].replace(' — Aasha Learning Ecosystem', '').trim() : file.replace('.html', '');

    // Step 2: Mock AI Generation (Equivalent to calling our Fastify /api/generate endpoints)
    const generatedH5PJson = JSON.stringify({
      title: chapterTitle,
      type: "InteractiveVideo",
      metadata: {
        source: "v5-upgrade",
        gamified: true
      },
      content: {
         intro: "Enhanced Gamified Interaction for " + chapterTitle
      }
    });

    const generatedPieJson = JSON.stringify({
      model: [
        {
          id: "1",
          element: "pie-multiple-choice",
          prompt: "Generated question based on " + chapterTitle
        }
      ],
      session: []
    });

    // Step 3: Bundle using the new Base64 wrapper
    const newFilename = file.replace('.html', '_Enhanced_v6');
    try {
      console.log(`Bundling ${chapterTitle} into single offline HTML payload...`);
      await buildMonolithicHTML(newFilename, htmlContent, generatedH5PJson, generatedPieJson);
    } catch (err) {
      console.error(`Failed to build ${file}:`, err);
    }
  }

  console.log('\n--- Upgrade Complete ---');
}

rebuildAllChapters();
