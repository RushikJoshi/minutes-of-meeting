const Jimp = require("jimp");

async function run() {
  try {
    const img = await Jimp.read("../client/public/logo.png");
    const w = img.bitmap.width;
    const h = img.bitmap.height;
    
    // Find left, right boundaries of each component
    const colDensity = new Array(w).fill(0);
    
    for (let x = 0; x < w; x++) {
      let nonWhite = 0;
      for (let y = 0; y < h; y++) {
        const color = img.getPixelColor(x, y);
        const r = (color >> 24) & 255;
        const g = (color >> 16) & 255;
        const b = (color >> 8) & 255;
        // if not white
        if (r < 250 || g < 250 || b < 250) {
          nonWhite++;
        }
      }
      colDensity[x] = nonWhite;
    }
    
    // Print a simplified density map to console to see the gap
    let map = "";
    for(let i = 0; i < 100; i++) {
       const start = Math.floor(i * w / 100);
       const end = Math.floor((i+1) * w / 100);
       let sum = 0;
       for(let x=start; x<end; x++) sum += colDensity[x];
       map += sum > 10 ? "X" : ".";
    }
    console.log("Density map:", map);
    
  } catch(e) {
    console.error(e);
  }
}
run();
