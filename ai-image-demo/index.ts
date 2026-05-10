import { generateImage } from 'ai';
import fs from 'node:fs';
import 'dotenv/config';

async function main() {
  const result = await generateImage({
    model: 'google/gemini-3.1-flash-image-preview',
    prompt: 'A futuristic bus driving through a neon city at night, high quality, highly detailed',
  });

  const imageData = result.images ? result.images[0] : result.image;
  if (imageData) {
    fs.writeFileSync('output.png', Buffer.from(imageData.base64 || imageData, 'base64'));
    console.log('Image saved to output.png');
  } else {
    console.log('No image data returned.');
  }
}

main().catch(console.error);
