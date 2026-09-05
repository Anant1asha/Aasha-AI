const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { inlineSource } = require('inline-source');

/**
 * Aasha Offline HTML Bundler
 * Compiles an H5P content folder and PIE components into the existing v5 HTML file.
 */

async function buildMonolithicHTML(chapterName, originalHtml, h5pJsonStr, pieJsonStr) {
  // Load the original v5 HTML into cheerio to preserve all its original styling and content!
  const $ = cheerio.load(originalHtml);

  // Inject our H5P and PIE scripts into the <head>
  $('head').append(`
      <!-- H5P Standalone wrapper -->
      <script src="dist/h5p-standalone-wrapper.js" inline></script>
      <!-- PIE Player Components -->
      <script src="dist/pie-player-components.js" inline></script>
      <style>
        .v6-interactive-container { margin: 20px auto; border: 2px dashed #3b82f6; border-radius: 8px; padding: 10px; max-width: 400px; background: #fff; }
        .v6-tag { text-align:center; font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
      </style>
  `);

  // Inject the new interactive containers at the bottom of the "screen" div, or at the end of the body
  const screenDiv = $('#screen');
  const injectTarget = screenDiv.length > 0 ? screenDiv : $('body');

  injectTarget.append(`
      <div class="v6-interactive-container">
        <div class="v6-tag">✨ V6 Enhanced H5P Interaction ✨</div>
        <div id="h5p-container"></div>
      </div>
      
      <div class="v6-interactive-container">
        <div class="v6-tag">✨ V6 Enhanced PIE Assessment ✨</div>
        <pie-item-player id="pie-container"></pie-item-player>
      </div>

      <script>
        window.AASHA_OFFLINE_DATA = {
          h5pContent: ${h5pJsonStr},
          pieContent: ${pieJsonStr}
        };

        document.addEventListener('DOMContentLoaded', () => {
           const h5pContainer = document.getElementById('h5p-container');
           if(window.H5PStandalone) {
              try { new H5PStandalone(h5pContainer, window.AASHA_OFFLINE_DATA.h5pContent); } catch(e){}
           }

           const pieContainer = document.getElementById('pie-container');
           if(pieContainer) {
              pieContainer.session = window.AASHA_OFFLINE_DATA.pieContent.session;
              pieContainer.env = { mode: 'gather' };
              pieContainer.model = window.AASHA_OFFLINE_DATA.pieContent.model;
           }
        });
      </script>
  `);

  // Write temporary html
  const tempPath = path.resolve(__dirname, 'temp.html');
  fs.writeFileSync(tempPath, $.html(), 'utf8');

  // Inline all external resources
  try {
    const html = await inlineSource(tempPath, {
      compress: true,
      rootpath: __dirname
    });

    const outputPath = path.resolve(__dirname, '..', '..', 'chapters', `${chapterName.replace(/\s+/g, '_')}.html`);
    fs.writeFileSync(outputPath, html, 'utf8');
    
    fs.unlinkSync(tempPath);
    console.log(`Successfully built Monolithic HTML: ${outputPath}`);
    
  } catch (err) {
    console.error('Error during inlining process:', err);
  }
}

module.exports = { buildMonolithicHTML };
