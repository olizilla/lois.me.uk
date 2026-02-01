import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const url = process.argv[2];

if (!url) {
  console.error('Please provide a URL as the first argument.');
  process.exit(1);
}

async function downloadImage(imgUrl, index) {
  try {
    // Squarespace images often have query parameters for resizing; removes them for full size
    // or keep them if they are essential. Usually they are not essential for the file itself.
    // However, sometimes the 'src' attribute is a dynamic resize URL.
    // Let's try to fetch the URL as provided first.

    const urlObj = new URL(imgUrl);
    // Extract filename from pathname
    let filename = path.basename(urlObj.pathname);
    
    // Fallback if filename is empty or invalid
    if (!filename || filename === '/' || !filename.includes('.')) {
        filename = `image-${index}.jpg`; 
    }

    // Clean filename
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Ensure unique
    let finalPath = path.join(process.cwd(), filename);
    let counter = 1;
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);

    while (fs.existsSync(finalPath)) {
        finalPath = path.join(process.cwd(), `${name}_${counter}${ext}`);
        counter++;
    }

    console.log(`Downloading ${imgUrl} to ${path.basename(finalPath)}...`);

    const response = await fetch(imgUrl);
    if (!response.ok) throw new Error(`Failed to fetch ${imgUrl}: ${response.statusText}`);

    // Use pipeline for proper stream handling
    if (!response.body) throw new Error('No response body');
    
    // fetch body is a ReadableStream (web), pipeline needs Node Generic Stream or Iterable
    // @ts-ignore
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(finalPath));
    // Alternatively for older node versions: await pipeline(response.body, fs.createWriteStream(finalPath));
    // But Readable.fromWeb is safer for fetch API in Node.

    console.log(`Saved ${path.basename(finalPath)}`);

  } catch (error) {
    console.error(`Error downloading ${imgUrl}:`, error.message);
  }
}

async function main() {
  try {
    console.log(`Fetching ${url}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch page: ${res.statusText}`);
    const html = await res.text();

    const $ = cheerio.load(html);
    const images = $('img.thumb-image');

    console.log(`Found ${images.length} images with class "thumb-image".`);

    if (images.length === 0) {
        console.log('No images found.');
        return;
    }
    const downloaded = [];
    let i = 0;
    for (const el of images) {
        // Squarespace images often use data-src for the high res version
        // and src for a tiny placeholder.
        let src = $(el).attr('data-src') || $(el).attr('src');
        
        if (src) {
            // Squarespace data-src often lacks protocol/domain? No, usually it's a full URL or relative.
            // If relative, we need to construct it. But data-src in Squarespace is usually full URL.
            // However, sometimes it doesn't have protocol.
            
            // Handle Squarespace image loader attributes if needed
            // But usually the data-src is the one.
            
            // Check if relative
            if (src.startsWith('//')) {
                src = 'https:' + src;
            } else if (src.startsWith('/')) {
                const u = new URL(url);
                src = `${u.protocol}//${u.host}${src}`;
            }

            // Squarespace specific: data-image-dimensions might avail, but for now just download src
            await downloadImage(src, i++);
            downloaded.push(src);
        }
    }
    downloaded.forEach(x => {
      console.log(`![](${path.basename(x)})`);
    })
    

  } catch (error) {
    console.error('Script failed:', error);
  }
}

main();
