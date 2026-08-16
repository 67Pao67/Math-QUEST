/**
 * Math Quest — Web Tileset System
 * โหลด pixel tileset จาก Kenney (CC0) บน GitHub
 * https://github.com/itsgreggreg/platformerArt_v4
 */
const WebTileset = (() => {
  const BASE = 'https://raw.githubusercontent.com/itsgreggreg/platformerArt_v4/master/png/';
  const TILE = 70;
  const RENDER = 32;

  const images = {};
  let ready = false;
  let loadPromise = null;

  const MANIFEST = {
    ground:       'ground.png',
    groundDirt:   'ground_dirt.png',
    groundCave:   'ground_cave.png',
    block:        'block.png',
    grass:        'grass.png',
    plank:        'plank.png',
    bush:         'bush.png',
    rock:         'rock.png',
    shroom:       'shroom.png',
    hillLong:     'hill_long.png',
    hillShort:    'hill_short.png',
    cloud1:       'cloud_1.png',
    cloud2:       'cloud_2.png',
    cloud3:       'cloud_3.png',
    coinGold:     'coin_gold.png',
    water:        'water.png',
    charSide:     'character/side.png',
    charJump:     'character/jump.png',
    charFront:    'character/front.png',
    slimeNormal:  'enemies/slime_normal.png',
    slimeWalk:    'enemies/slime_walk.png',
    flyNormal:    'enemies/fly_normal.png',
    flyFly:       'enemies/fly_fly.png',
  };

  for (let i = 1; i <= 11; i++) {
    const n = String(i).padStart(4, '0');
    MANIFEST['walk' + i] = 'character/walk/walk' + n + '.png';
  }

  function loadOne(key, path) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { images[key] = img; resolve(true); };
      img.onerror = () => { images[key] = null; resolve(false); };
      img.src = BASE + path;
    });
  }

  function loadAll(onProgress) {
    if (loadPromise) return loadPromise;
    const keys = Object.keys(MANIFEST);
    let done = 0;
    loadPromise = Promise.all(
      keys.map((key) =>
        loadOne(key, MANIFEST[key]).then((ok) => {
          done++;
          if (onProgress) onProgress(done, keys.length, key, ok);
        })
      )
    ).then(() => {
      ready = true;
      return images;
    });
    return loadPromise;
  }

  function img(key) {
    const i = images[key];
    return i && i.complete && i.naturalWidth > 0 ? i : null;
  }

  function drawTile(ctx, key, dx, dy, dw, dh) {
    const source = img(key);
    if (!source) return false;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, dx, dy, dw || RENDER, dh || RENDER);
    return true;
  }

  /** วาดพื้นดิน/หญ้าแบบ tile ซ้ำ */
  function drawGround(ctx, x, y, w, h) {
    const top = img('ground');
    const fill = img('groundDirt') || img('block');
    if (!top) return false;

    ctx.imageSmoothingEnabled = false;
    const cols = Math.ceil(w / RENDER);
    const rows = Math.ceil(h / RENDER);

    for (let cx = 0; cx < cols; cx++) {
      ctx.drawImage(top, x + cx * RENDER, y, RENDER, RENDER);
    }
    if (fill) {
      for (let cy = 1; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          ctx.drawImage(fill, x + cx * RENDER, y + cy * RENDER, RENDER, RENDER);
        }
      }
    }
    return true;
  }

  /** วาดแพลตฟอร์มลอย (plank) */
  function drawPlatform(ctx, x, y, w) {
    const plank = img('plank');
    if (!plank) return false;

    ctx.imageSmoothingEnabled = false;
    const cols = Math.max(1, Math.ceil(w / RENDER));
    for (let cx = 0; cx < cols; cx++) {
      ctx.drawImage(plank, x + cx * RENDER, y, RENDER, RENDER);
    }
    return true;
  }

  /** วาดพื้นดันเจี้ยน */
  function drawCaveGround(ctx, x, y, w, h) {
    const top = img('groundCave') || img('block');
    const fill = img('groundDirt') || img('block');
    if (!top) return false;

    ctx.imageSmoothingEnabled = false;
    const cols = Math.ceil(w / RENDER);
    const rows = Math.ceil(h / RENDER);

    for (let cx = 0; cx < cols; cx++) {
      ctx.drawImage(top, x + cx * RENDER, y, RENDER, RENDER);
    }
    if (fill) {
      for (let cy = 1; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          ctx.drawImage(fill, x + cx * RENDER, y + cy * RENDER, RENDER, RENDER);
        }
      }
    }
    return true;
  }

  /** พื้นหลังป่า parallax */
  function drawForestBG(ctx, camX, cw, ch) {
    const sky = ctx.createLinearGradient(0, 0, 0, ch);
    sky.addColorStop(0, '#87ceeb');
    sky.addColorStop(0.6, '#b8dff5');
    sky.addColorStop(1, '#7ec850');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cw, ch);

    const hills = [
      { key: 'hillLong',  speed: 0.08, yOff: ch * 0.55, scale: 1.4 },
      { key: 'hillShort', speed: 0.18, yOff: ch * 0.62, scale: 1.1 },
    ];

    for (const h of hills) {
      const source = img(h.key);
      if (!source) continue;
      const sw = source.width * h.scale;
      const sh = source.height * h.scale;
      const offset = Math.round(-(camX * h.speed) % sw);
      for (let x = offset - sw; x < cw + sw; x += sw) {
        ctx.drawImage(source, x, h.yOff, sw, sh);
      }
    }

    const clouds = [
      { key: 'cloud1', speed: 0.04, y: 30,  scale: 0.55 },
      { key: 'cloud2', speed: 0.06, y: 70,  scale: 0.45 },
      { key: 'cloud3', speed: 0.03, y: 110, scale: 0.5  },
    ];

    for (const c of clouds) {
      const source = img(c.key);
      if (!source) continue;
      const sw = source.width * c.scale;
      const sh = source.height * c.scale;
      const offset = Math.round(-(camX * c.speed) % sw);
      for (let x = offset - sw; x < cw + sw; x += sw * 1.8) {
        ctx.drawImage(source, x, c.y, sw, sh);
      }
    }
    return true;
  }

  /** พื้นหลังดันเจี้ยน */
  function drawDungeonBG(ctx, camX, cw, ch) {
    ctx.fillStyle = '#0d1020';
    ctx.fillRect(0, 0, cw, ch);

    const wall = img('block') || img('groundCave');
    if (!wall) return false;

    ctx.imageSmoothingEnabled = false;
    const offset = Math.round(-(camX * 0.1) % RENDER);
    for (let x = offset - RENDER; x < cw + RENDER; x += RENDER) {
      for (let y = 0; y < ch; y += RENDER) {
        ctx.drawImage(wall, x, y, RENDER, RENDER);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, cw, ch);
    return true;
  }

  /** วาด prop decoration */
  function drawProp(ctx, key, x, y, scale) {
    const source = img(key);
    if (!source) return false;
    const s = scale || 1;
    const w = source.width * s * (RENDER / TILE);
    const h = source.height * s * (RENDER / TILE);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, x - w / 2, y - h, w, h);
    return true;
  }

  /** เหรียญจาก tileset */
  function drawCoin(ctx, x, y, frame) {
    const source = img('coinGold');
    if (!source) return false;
    const bounce = Math.sin(Date.now() / 300 + x * 0.03) * 2;
    const wobble = [1, 0.75, 0.5, 0.75][frame % 4];
    const cw = RENDER * wobble;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, x + (RENDER - cw) / 2, y + bounce, cw, RENDER);
    return true;
  }

  /** walk animation frames */
  function getWalkFrame(index) {
    return img('walk' + ((index % 11) + 1));
  }

  return {
    BASE, TILE, RENDER,
    loadAll, img, isReady: () => ready,
    drawTile, drawGround, drawPlatform, drawCaveGround,
    drawForestBG, drawDungeonBG, drawProp, drawCoin, getWalkFrame,
  };
})();
