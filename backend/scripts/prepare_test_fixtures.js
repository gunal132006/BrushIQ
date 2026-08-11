const fs = require('fs');
const path = require('path');
const { Jimp, rgbaToInt } = require('jimp');

const fixturesDir = path.join(__dirname, '../tests/fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

async function generateFixtures() {
  console.log('Generating realistic binary JPEG/PNG test fixtures with natural texture variance...');

  function addNoiseAndFill(image, x1, y1, w, h, hexColor) {
    const r = (hexColor >>> 24) & 0xFF;
    const g = (hexColor >>> 16) & 0xFF;
    const b = (hexColor >>> 8) & 0xFF;
    const a = hexColor & 0xFF;

    for (let y = y1; y < Math.min(image.bitmap.height, y1 + h); y++) {
      for (let x = x1; x < Math.min(image.bitmap.width, x1 + w); x++) {
        const noise = Math.round(Math.sin(x * 0.3) * Math.cos(y * 0.3) * 20);
        const nr = Math.max(0, Math.min(255, r + noise));
        const ng = Math.max(0, Math.min(255, g + noise));
        const nb = Math.max(0, Math.min(255, b + noise));

        image.setPixelColor(rgbaToInt(nr, ng, nb, a), x, y);
      }
    }
  }

  // 1. Single Real Toothbrush Image
  const tbImg = new Jimp({ width: 300, height: 400, color: 0xD1D5DBFF });
  addNoiseAndFill(tbImg, 0, 0, 300, 400, 0xD1D5DBFF);
  addNoiseAndFill(tbImg, 135, 120, 30, 240, 0x1E40AF2F);
  addNoiseAndFill(tbImg, 140, 70, 20, 50, 0x3B82F6FF);
  addNoiseAndFill(tbImg, 135, 30, 30, 40, 0xFFFFFFFF);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 3; c++) {
      const color = (r % 2 === 0) ? 0x06B6D4FF : 0xFFFFFFFF;
      addNoiseAndFill(tbImg, 138 + c * 8, 33 + r * 7, 6, 6, color);
    }
  }
  await tbImg.write(path.join(fixturesDir, 'single_toothbrush.jpg'));

  // 2. Human Photo
  const humanImg = new Jimp({ width: 300, height: 400, color: 0x93C5FDFF });
  addNoiseAndFill(humanImg, 0, 0, 300, 400, 0x93C5FDFF);
  for (let y = 50; y < 200; y++) {
    for (let x = 80; x < 220; x++) {
      const dx = (x - 150) / 70;
      const dy = (y - 125) / 75;
      if (dx * dx + dy * dy <= 1.0) {
        addNoiseAndFill(humanImg, x, y, 1, 1, 0xE0AC69FF);
      }
    }
  }
  addNoiseAndFill(humanImg, 110, 110, 20, 10, 0x1F2937FF);
  addNoiseAndFill(humanImg, 170, 110, 20, 10, 0x1F2937FF);
  addNoiseAndFill(humanImg, 130, 160, 40, 8, 0x991B1BFF);
  addNoiseAndFill(humanImg, 50, 200, 200, 200, 0x047857FF);
  await humanImg.write(path.join(fixturesDir, 'human.jpg'));

  // 3. Hand Photo
  const handImg = new Jimp({ width: 300, height: 400, color: 0xE5E7EBFF });
  addNoiseAndFill(handImg, 0, 0, 300, 400, 0xE5E7EBFF);
  addNoiseAndFill(handImg, 90, 180, 120, 150, 0xE0AC69FF);
  addNoiseAndFill(handImg, 90, 80, 20, 100, 0xE0AC69FF);
  addNoiseAndFill(handImg, 115, 60, 22, 120, 0xE0AC69FF);
  addNoiseAndFill(handImg, 142, 40, 22, 140, 0xE0AC69FF);
  addNoiseAndFill(handImg, 169, 60, 22, 120, 0xE0AC69FF);
  addNoiseAndFill(handImg, 196, 120, 25, 80, 0xE0AC69FF);
  await handImg.write(path.join(fixturesDir, 'hand.jpg'));

  // 4. Human Holding 1 Toothbrush
  const handTbImg = handImg.clone();
  addNoiseAndFill(handTbImg, 60, 140, 180, 20, 0x2563EBFF);
  addNoiseAndFill(handTbImg, 220, 135, 30, 30, 0xFFFFFFFF);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      addNoiseAndFill(handTbImg, 223 + c * 8, 137 + r * 6, 5, 4, 0x0284C7FF);
    }
  }
  await handTbImg.write(path.join(fixturesDir, 'human_holding_toothbrush.jpg'));

  // 5. Two Toothbrushes
  const twoTbImg = new Jimp({ width: 400, height: 400, color: 0xD1D5DBFF });
  addNoiseAndFill(twoTbImg, 0, 0, 400, 400, 0xD1D5DBFF);
  addNoiseAndFill(twoTbImg, 70, 100, 25, 220, 0xEC4899FF);
  addNoiseAndFill(twoTbImg, 70, 50, 25, 40, 0xFFFFFFFF);
  for (let r = 0; r < 4; r++) addNoiseAndFill(twoTbImg, 73, 53 + r * 8, 18, 5, 0xDB2777FF);

  addNoiseAndFill(twoTbImg, 270, 120, 25, 220, 0x10B981FF);
  addNoiseAndFill(twoTbImg, 270, 70, 25, 40, 0xFFFFFFFF);
  for (let r = 0; r < 4; r++) addNoiseAndFill(twoTbImg, 273, 73 + r * 8, 18, 5, 0x059669FF);
  await twoTbImg.write(path.join(fixturesDir, 'two_toothbrushes.jpg'));

  // 6. Floor
  const floorImg = new Jimp({ width: 300, height: 300, color: 0xD1D5DBFF });
  addNoiseAndFill(floorImg, 0, 0, 300, 300, 0xD1D5DBFF);
  for (let i = 0; i < 300; i += 75) {
    addNoiseAndFill(floorImg, 0, i, 300, 3, 0x4B5563FF);
    addNoiseAndFill(floorImg, i, 0, 3, 300, 0x4B5563FF);
  }
  await floorImg.write(path.join(fixturesDir, 'floor.jpg'));

  // 7. Wall
  const wallImg = new Jimp({ width: 300, height: 300, color: 0xFEF3C7FF });
  addNoiseAndFill(wallImg, 0, 0, 300, 300, 0xFEF3C7FF);
  await wallImg.write(path.join(fixturesDir, 'wall.jpg'));

  // 8. Bottle
  const bottleImg = new Jimp({ width: 300, height: 400, color: 0xD1D5DBFF });
  addNoiseAndFill(bottleImg, 0, 0, 300, 400, 0xD1D5DBFF);
  addNoiseAndFill(bottleImg, 120, 40, 60, 30, 0x1E293BFF);
  addNoiseAndFill(bottleImg, 130, 70, 40, 40, 0x64748BFF);
  addNoiseAndFill(bottleImg, 90, 110, 120, 240, 0x0284C7FF);
  addNoiseAndFill(bottleImg, 100, 170, 100, 80, 0xFFFFFFFF);
  await bottleImg.write(path.join(fixturesDir, 'bottle.jpg'));

  // 9. Phone
  const phoneImg = new Jimp({ width: 300, height: 400, color: 0xE5E7EBFF });
  addNoiseAndFill(phoneImg, 0, 0, 300, 400, 0xE5E7EBFF);
  addNoiseAndFill(phoneImg, 80, 50, 140, 280, 0x111827FF);
  addNoiseAndFill(phoneImg, 90, 70, 120, 240, 0x374151FF);
  addNoiseAndFill(phoneImg, 135, 320, 30, 5, 0x9CA3AFFF);
  await phoneImg.write(path.join(fixturesDir, 'phone.jpg'));

  // 10. Laptop
  const laptopImg = new Jimp({ width: 400, height: 300, color: 0xD1D5DBFF });
  addNoiseAndFill(laptopImg, 0, 0, 400, 300, 0xD1D5DBFF);
  addNoiseAndFill(laptopImg, 60, 30, 280, 160, 0x1E293BFF);
  addNoiseAndFill(laptopImg, 75, 45, 250, 130, 0x3B82F6FF);
  addNoiseAndFill(laptopImg, 40, 190, 320, 90, 0x94A3B8FF);
  addNoiseAndFill(laptopImg, 60, 200, 280, 50, 0x334155FF);
  await laptopImg.write(path.join(fixturesDir, 'laptop.jpg'));

  // 11. Keyboard
  const kbImg = new Jimp({ width: 400, height: 200, color: 0x1E293BFF });
  addNoiseAndFill(kbImg, 0, 0, 400, 200, 0x1E293BFF);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 12; c++) {
      addNoiseAndFill(kbImg, 20 + c * 30, 20 + r * 40, 24, 30, 0x475569FF);
    }
  }
  await kbImg.write(path.join(fixturesDir, 'keyboard.jpg'));

  // 12. Chair
  const chairImg = new Jimp({ width: 300, height: 400, color: 0xD1D5DBFF });
  addNoiseAndFill(chairImg, 0, 0, 300, 400, 0xD1D5DBFF);
  addNoiseAndFill(chairImg, 80, 60, 140, 160, 0xB91C1CFF);
  addNoiseAndFill(chairImg, 70, 220, 160, 30, 0x991B1BFF);
  addNoiseAndFill(chairImg, 90, 250, 15, 120, 0x1E293BFF);
  addNoiseAndFill(chairImg, 195, 250, 15, 120, 0x1E293BFF);
  await chairImg.write(path.join(fixturesDir, 'chair.jpg'));

  // 13. Plant
  const plantImg = new Jimp({ width: 300, height: 400, color: 0xD1D5DBFF });
  addNoiseAndFill(plantImg, 0, 0, 300, 400, 0xD1D5DBFF);
  addNoiseAndFill(plantImg, 100, 250, 100, 100, 0xB45309FF);
  for (let i = 0; i < 8; i++) {
    const lx = 80 + (i % 4) * 35;
    const ly = 100 + Math.floor(i / 4) * 60;
    addNoiseAndFill(plantImg, lx, ly, 45, 45, 0x15803DFF);
  }
  await plantImg.write(path.join(fixturesDir, 'plant.jpg'));

  // 14. Clothes
  const clothesImg = new Jimp({ width: 300, height: 300, color: 0xD1D5DBFF });
  addNoiseAndFill(clothesImg, 0, 0, 300, 300, 0xD1D5DBFF);
  addNoiseAndFill(clothesImg, 50, 50, 200, 200, 0x6D28D9FF);
  await clothesImg.write(path.join(fixturesDir, 'clothes.jpg'));

  // 15. Book
  const bookImg = new Jimp({ width: 300, height: 400, color: 0xD1D5DBFF });
  addNoiseAndFill(bookImg, 0, 0, 300, 400, 0xD1D5DBFF);
  addNoiseAndFill(bookImg, 60, 50, 180, 260, 0xBE123CFF);
  addNoiseAndFill(bookImg, 90, 90, 120, 30, 0xFDE047FF);
  await bookImg.write(path.join(fixturesDir, 'book.jpg'));

  // 16. Paper
  const paperImg = new Jimp({ width: 300, height: 400, color: 0x94A3B8FF });
  addNoiseAndFill(paperImg, 0, 0, 300, 400, 0x94A3B8FF);
  addNoiseAndFill(paperImg, 50, 40, 200, 280, 0xFFFFFFFF);
  for (let i = 0; i < 10; i++) {
    addNoiseAndFill(paperImg, 70, 70 + i * 22, 160, 2, 0xCBD5E1FF);
  }
  await paperImg.write(path.join(fixturesDir, 'paper.jpg'));

  // 17. Dark Image (Brightness < 20)
  const darkImg = new Jimp({ width: 300, height: 300, color: 0x0A0A0AFF });
  await darkImg.write(path.join(fixturesDir, 'dark_image.jpg'));

  // 18. Blurry Image (Low Laplacian variance - smooth gradient without noise)
  const blurImg = new Jimp({ width: 300, height: 300, color: 0x888888FF });
  await blurImg.write(path.join(fixturesDir, 'blurry_image.jpg'));

  console.log('Successfully generated all 18 binary test fixtures!');
}

generateFixtures().catch(err => {
  console.error('Error generating fixtures:', err);
  process.exit(1);
});
