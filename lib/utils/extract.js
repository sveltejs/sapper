const fs = require('fs-extra');
const app = require('express')();
const compression = require('compression');
const mkdirp = require('mkdirp');
const sapper = require('../index.js');
const serve = require('serve-static');
const Spider = require('node-spider');
const path = require('path');

const { PORT = 3000, OUTPUT_DIR = 'dist' } = process.env;
const { dest } = require('../config.js');

const prefix = `http://localhost:${PORT}`;

/**
 * Returns the full URL of the specified path in the server.
 * @param {string} url The path for which to get the complete URL.
 * @return {string} The full URL.
 */
function getFullUrl(url) {
  if (url.startsWith(prefix)) return url;
  return `${prefix}${url}`;
}

/**
 * Returns the extension on the URL or '' if there is none.
 * @param {string} url The URL.
 * @return {string} The URL's extension or the empty string if the URL has no
 *     extension.
 */
function getExtension(url) {
  const splits = url.split('.');
  let extension = splits[splits.length - 1].trim();
  if (!/^[a-zA-Z0-9]+$/.test(extension) || extension.length > 10) {
    // Clear the extension if it is not alphanumeric or is long enough to
    // signify it may just be a hash value or something.
    extension = '';
  }
  return extension;
}

/**
 * Returns the relative path for the specified URL, adding index.html if the URL
 * ends in `/`. This makes the URL function well in a static site.
 * @param {string} url The URL for which to retrieve the relative path.
 * @return {string} A URL that starts with / that is relative to the server
 *     root. The URL will add index.html if it ends with `/`.
 */
function relativePath(url) {
  if (url.startsWith(prefix)) return relativePath(url.substr(prefix.length));
  if (url.endsWith('/')) url += 'index.html';
  if (getExtension(url) == '') url += '/index.html';
  if (url.startsWith('/')) return url;
  throw new Error('Bad url');
}

/**
 * Returns the Sapper API route for the specified URL path.
 * @param {string} url The absolute or relative URL.
 * @param {string=} apiPrefix The prefix for Sapper server-side routes.
 * @return {string} The URL with /api/ in front.
 */
function apiPath(url, apiPrefix = '/api') {
  if (url.startsWith(prefix)) {
    return `${prefix}${apiPrefix}${url.substr(prefix.length)}`;
  }
  return `${apiPrefix}${url}`;
}

/**
 * Returns whether the specified URL is on the server or an external link.
 * @param {string} url The URL.
 * @return {boolean} True if the URL is on the server.
 */
function filter(url) {
  return url.startsWith('/') || url.startsWith(getFullUrl('/'));
}

/**
 * Retrieves chunk files that are normally cached for offline use in the service
 * worker.
 * @return {!Array<string>}
 */
function getChunkFiles() {
  const clientInfo =
      fs.readJsonSync(path.join(dest, 'stats.client.json'));
  const chunkFiles = clientInfo.assets.map(chunk => `/client/${chunk.name}`);
  return chunkFiles;
}

/**
 * Exports the Sapper app as a static website by starting at the root and
 * crawling pages that are linked, extracting server and client routes, and
 * copying assets.
 * @param {?Array<string>=} includeUrls If non-null, a set of additional URLs to
 *     scrape in the extraction. This should only be set if there are routes
 *     that cannot be reached from the root.
 * @param {?Array<string>=} excludeUrls If non-null, a set of URLs to avoid
 *     scraping in the extraction.
 * @param {string=} apiPrefix The path in which all server-side Sapper routes
 *     are defined. The Sapper template application uses '/api' -- if you
 *     diverge from the template app structure, you will want to change this. If
 *     your server-side Sapper routes span multiple directories, you will have
 *     to specify each file manually with the `includeUrls` param.
 * @param {number=} extractionDir The directory in which to place the extracted
 *     output.
 */
module.exports = function(includeUrls = null, excludeUrls = null,
    apiPrefix = '/api', extractionDir = OUTPUT_DIR) {

  // Clean the output directory and copy assets in.
  fs.removeSync(extractionDir);
  mkdirp.sync(extractionDir);
  fs.copySync('assets', extractionDir);

  // Set up the server.

  // this allows us to do e.g. `fetch('/api/blog')` on the server
  const fetch = require('node-fetch');
  global.fetch = (url, opts) => {
    if (url[0] === '/') url = `http://localhost:${PORT}${url}`;
    return fetch(url, opts);
  };

  app.use(compression({ threshold: 0 }));

  app.use(serve('assets'));

  app.use(sapper());

  // If exclude URLs are set, normalize them.
  if (excludeUrls == null) excludeUrls = [];
  excludeUrls = excludeUrls.map((url) => getFullUrl(url));

  // The crux of the extraction, chaining the traditional server call with a web
  // scraper. The program automatically exits after all the static pages have
  // been scraped from the server that are accessible from the root page (`/`).
  const extractedFiles = []; // keep track of extracted files.

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`listening on port ${PORT} and beginning extraction`);

      const spider = new Spider({
        concurrent: 5,
        delay: 0,
        logs: process.stderr,
        allowDuplicates: false,
        catchErrors: true,
        addReferrer: false,
        xhr: false,
        keepAlive: false,
        error: (err, url) => {
          console.error(`ERROR ${err} at ${url}`);
          reject();
        },
        // Called when there are no more requests
        done: () => {
          server.close(() => {
            console.log('Done!');
            resolve();
          });
        },

        headers: { 'user-agent': 'node-spider' },
        // Use a binary encoding to preserve image files.
        encoding: 'binary'
      });

      // The primary logic to handle a scraped page.
      const handleRequest = (doc) => {
        // Only deal with the page if it is on the server, i.e. it is not an
        // external link.
        if (!filter(doc.url)) return;
        // Skip URL if it is in the exclude list.
        if (excludeUrls.includes(getFullUrl(doc.url))) return;

        // Grab the page's relative path and write the page contents to a local
        // file.
        const relPath = relativePath(doc.url);
        extractedFiles.push(relPath);
        console.log(`GOT ${relPath}`); // static page url
        fs.outputFileSync(path.join(extractionDir, relPath), doc.res.body,
            {encoding: 'binary'});

        /**
         * Resolves and checks if a given URL is local; if so, adds it to the
         * scraping queue.
         * @param {string} url The URL to process.
         */
        const process = (url) => {
          // Remove trailing hash if relevant.
          url = url.split('#')[0];
          // Resolve URL relative to server root.
          url = doc.resolve(url);
          // Crawl more if the URL is on the server.
          if (filter(url)) spider.queue(url, handleRequest);
        };

        const extension = getExtension(relPath);
        if (extension == 'html') {
          // Grab src and href attributes from html pages.
          doc.$('[src]').each((i, elem) => {
            process(doc.$(elem).attr('src'));
          });
          doc.$('[href]').each((i, elem) => {
            process(doc.$(elem).attr('href'));
          });
        }

        if (doc.url.endsWith('/service-worker.js')) {
          // Grab additional routes.
          const chunkFiles = getChunkFiles();
          chunkFiles.forEach(
              (url) => spider.queue(getFullUrl(url), handleRequest));
        }

        if (relPath.endsWith('/index.html') &&
            !relPath.startsWith(`${apiPrefix}/`)) {
          // Attempt to grab the server-side route corresponding to a page that
          // seems to be a basic route.
          spider.queue(apiPath(doc.url, apiPrefix), handleRequest);
        }
      };

      // Start crawling with the document root and the service worker.
      spider.queue(getFullUrl('/'), handleRequest);
      spider.queue(getFullUrl('/service-worker.js'), handleRequest);

      if (includeUrls !== null) {
        includeUrls.forEach(
            (url) => spider.queue(getFullUrl(url), handleRequest));
      }
    });
  });
};
