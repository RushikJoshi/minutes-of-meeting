const Jimp = require("jimp");

async function run() {
  try {
    const img = await Jimp.read("../client/public/logo.png");
    const w = img.bitmap.width;
    const h = img.bitmap.height;
    
    let minX = w, maxX = 0, minY = h, maxY = 0;
    
    // We know from the density map that the 'gj' logo ends around 28% of the width.
    // The text starts after 35%. So we strictly limit the search to the first 30% of the image.
    const limitX = Math.floor(w * 0.30); 
    
    for (let x = 0; x < limitX; x++) {
      for (let y = 0; y < h; y++) {
        const color = img.getPixelColor(x, y);
        const r = (color >> 24) & 255;
        const g = (color >> 16) & 255;
        const b = (color >> 8) & 255;
        
        // Strict threshold to ignore faint noise
        if (r < 220 && g < 220) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    if (minX > maxX || minY > maxY) {
       console.log("Could not find logo boundaries.");
       return;
    }
    
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    
    // Create a square canvas to keep aspect ratio perfect
    const size = Math.max(cropW, cropH);
    // Add 10% padding
    const paddedSize = Math.floor(size * 1.1);
    
    // Create a new image with white background
    const bg = new Jimp(paddedSize, paddedSize, 0xFFFFFFFF);
    
    // Calculate center position
    const px = Math.floor((paddedSize - cropW) / 2);
    const py = Math.floor((paddedSize - cropH) / 2);
    
    img.crop(minX, minY, cropW, cropH);
    bg.composite(img, px, py);
    
    await bg.writeAsync("../client/public/favicon.png");
    console.log(`Favicon created successfully. Bounds: x=${minX}-${maxX}, y=${minY}-${maxY}. Final padded size: ${paddedSize}x${paddedSize}`);
  } catch(e) {
    console.error(e);
  }
}
run();
