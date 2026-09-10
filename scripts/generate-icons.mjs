import sharp from 'sharp';
// Simple typographic app identity, with a safe inset for maskable icon cropping.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#315d53"/><circle cx="256" cy="256" r="164" fill="none" stroke="#8dab99" stroke-width="2"/><text x="256" y="309" text-anchor="middle" font-family="Georgia,serif" font-size="190" fill="#ffffff">s.</text></svg>`;
for (const [size, file] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']]) {
 await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/${file}`);
}
