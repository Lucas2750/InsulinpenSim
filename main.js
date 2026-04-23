import './style.css'
const canvas = document.getElementById('assembly-line');
const ctx = canvas.getContext('2d');

let width, height;
const ZOOM_OUT = 0.55;
let pens = [];
let totalScanned = 0;
let totalDefects = 0;

const speedSlider = document.getElementById('speed-slider');
const slideSlider = document.getElementById('slide-slider');
const mistakeSlider = document.getElementById('mistake-slider');
const statsDisplay = document.getElementById('stats');

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const beltY = height / 2 - 20;
const beltHeight = 300;

class PenPackage {
  constructor(startX) {
    this.width = 200;
    this.height = 36;

    this.trayWidth = 180;
    this.trayHeight = 260;

    this.x = startX || -this.trayWidth;

    // Package Position
    this.y = beltY + (Math.random() - 0.5) * (beltHeight - this.trayHeight - 20);

    this.vx = 2 + Math.random() * 2;
    this.vy = (Math.random() - 0.5) * 2;

    // Generate 3 pens per package
    this.pens = [];
    const mistakeProb = parseInt(mistakeSlider.value) / 100;
    const spacing = 55;
    const offsetsX = [-spacing, 0, spacing];

    for (let i = 0; i < 3; i++) {
      let hasLabel = true;
      let labelColor = '#d8e9fbff'; // Distinct off-white to stand out from the pen body
      let isDefect = false;

      if (Math.random() < mistakeProb) {
        isDefect = true;
        if (Math.random() < 0.4) {
          hasLabel = false;
        } else {
          const colors = ['#f44336', '#ffeb3b', '#2196f3'];
          labelColor = colors[Math.floor(Math.random() * colors.length)];
        }
      }

      this.pens.push({
        xOffset: offsetsX[i] + (Math.random() - 0.5) * 15,
        yOffset: (Math.random() - 0.5) * 35,
        rotation: -Math.PI / 2 + (Math.random() - 0.5) * 0.15,
        rollPhase: Math.random() * Math.PI * 2,
        hasLabel,
        labelColor,
        isDefect
      });
    }

    this.counted = false;
  }

  update(speed, slideFactor) {
    // Belt pulls packages
    const targetVx = speed * 3.5;
    this.vx += (targetVx - this.vx) * 0.1;
    this.vy += (0 - this.vy) * 0.1;

    // Brownian motion (vibration)
    const vibration = slideFactor * 0.05;
    this.vx += (Math.random() - 0.5) * vibration * 15; // Massive X vibration front/back
    this.vy += (Math.random() - 0.5) * vibration * 2; // More Y vibration

    this.x += this.vx;
    this.y += this.vy;

    for (const p of this.pens) {
      p.rollPhase += this.vx / 18;
    }

    // Count if reached midway
    if (!this.counted && this.x > width / 2) {
      this.counted = true;
      totalScanned += 3;
      for (const p of this.pens) {
        if (p.isDefect) totalDefects++;
      }
      statsDisplay.innerText = `PENS SCANNED: ${totalScanned} | DEFECTS: ${totalDefects}`;
    }
  }

  draw(ctx) {
    ctx.save();
    const wobble = (this.vy) * 0.01;
    ctx.translate(this.x, this.y);
    ctx.rotate(wobble);

    // Tray background
    ctx.fillStyle = 'rgba(240, 248, 255, 0.15)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.roundRect(-this.trayWidth / 2, -this.trayHeight / 2, this.trayWidth, this.trayHeight, 15);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();

    // Inner tray indent (optional realism)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.beginPath();
    ctx.roundRect(-this.trayWidth / 2 + 8, -this.trayHeight / 2 + 8, this.trayWidth - 16, this.trayHeight - 16, 10);
    ctx.stroke();

    for (const p of this.pens) {
      ctx.save();
      ctx.translate(p.xOffset, p.yOffset);
      ctx.rotate(p.rotation);

      const px = -this.width / 2;
      const py = -this.height / 2;

      // Drop shadow (pen)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(px + 4, py + 4, this.width, this.height, 6);
      ctx.fill();

      // Base Pen Body
      const bodyGrd = ctx.createLinearGradient(0, py, 0, py + this.height);
      bodyGrd.addColorStop(0, '#f2f2f2');
      bodyGrd.addColorStop(0.3, '#ffffff');
      bodyGrd.addColorStop(0.8, '#d9d9d9');
      bodyGrd.addColorStop(1, '#cccccc');

      ctx.fillStyle = bodyGrd;
      ctx.beginPath();
      ctx.roundRect(px, py, this.width, this.height, 6);
      ctx.fill();

      // Label background wrapped 360 degrees
      if (p.hasLabel) {
        ctx.fillStyle = p.labelColor;
        ctx.fillRect(px + 25, py, 105, this.height);

        // Gradient overlay to match the pen's volume
        const labelGrd = ctx.createLinearGradient(0, py, 0, py + this.height);
        labelGrd.addColorStop(0, 'rgba(0,0,0,0.05)');
        labelGrd.addColorStop(0.3, 'rgba(255,255,255,0.4)');
        labelGrd.addColorStop(0.8, 'rgba(0,0,0,0.05)');
        labelGrd.addColorStop(1, 'rgba(0,0,0,0.15)');
        ctx.fillStyle = labelGrd;
        ctx.fillRect(px + 25, py, 105, this.height);
      }

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(px, py, this.width, this.height, 6);
      ctx.clip(); // Clip inner rolling parts

      const offset = Math.sin(p.rollPhase) * this.height * 0.6;
      const isVisible = Math.cos(p.rollPhase) > 0;

      if (isVisible) {
        // Dial mechanism
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.roundRect(px - 15, py + 6 + offset, 20, this.height - 12, 3);
        ctx.fill();
        ctx.fillStyle = '#ccc';
        ctx.fillRect(px - 17, py + 10 + offset, 4, this.height - 20);
      }

      // Draw Label Patterns mapped to the cylinder
      if (p.hasLabel) {
        const cy = py + this.height / 2;
        const R = this.height * 0.45; // slightly reduced radius to avoid edge clipping issues

        const faces = [
          { angle: 0, type: 'lines' },
          { angle: Math.PI * 2 / 3, type: 'barcode' },
          { angle: Math.PI * 4 / 3, type: 'logo' }
        ];

        for (let face of faces) {
          let theta = (p.rollPhase + face.angle) % (Math.PI * 2);
          if (theta < 0) theta += Math.PI * 2;

          let cosT = Math.cos(theta);
          if (cosT > 0) { // Visible on front half
            let sinT = Math.sin(theta);
            let y_center = cy + sinT * R;

            ctx.save();
            ctx.translate(px + 30, y_center);
            ctx.scale(1, cosT); // 3D cylinder squish effect

            if (face.type === 'lines') {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(0, -7, 30, 2);
              ctx.fillRect(0, 0, 45, 2);
              ctx.fillRect(0, 7, 20, 2);
            } else if (face.type === 'barcode') {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
              for (let i = 0; i < 12; i++) {
                let w = [2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1][i];
                ctx.fillRect(10 + i * 3, -6, w, 12);
              }
            } else if (face.type === 'logo') {
              // Medical cross
              ctx.fillStyle = '#e53935';
              ctx.fillRect(5, -2, 10, 4);
              ctx.fillRect(8, -5, 4, 10);

              // Text block
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(22, -2, 35, 4);
            }

            ctx.restore();
          }
        }
      }
      ctx.restore(); // remove clip

      // Cap
      const capWidth = 50;
      const capGrd = ctx.createLinearGradient(0, py, 0, py + this.height);
      capGrd.addColorStop(0, '#2e6b99');
      capGrd.addColorStop(0.3, '#3ca4db');
      capGrd.addColorStop(0.8, '#1e527a');
      capGrd.addColorStop(1, '#113552');

      ctx.fillStyle = capGrd;
      ctx.beginPath();
      ctx.roundRect(px + this.width - capWidth, py, capWidth, this.height, 4);
      ctx.fill();

      // Specular Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 2, this.width - 4, this.height * 0.25, 4);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }
}

let lastTime = performance.now();
let spawnTimer = 0;
let beltPosition = 0;

function drawConveyorBelt(beltPos) {
  const logicalLeft = width / 2 - (width / 2) / ZOOM_OUT - 200;
  const logicalRight = width / 2 + (width / 2) / ZOOM_OUT + 200;
  const beltDrawWidth = logicalRight - logicalLeft;

  // Base track (Industrial grey/metal rim)
  ctx.fillStyle = '#40444a';
  ctx.fillRect(logicalLeft, beltY - beltHeight / 2 - 10, beltDrawWidth, beltHeight + 20);

  // Belt surface (Dark rubber)
  ctx.fillStyle = '#222529';
  ctx.fillRect(logicalLeft, beltY - beltHeight / 2, beltDrawWidth, beltHeight);

  // Moving segments / dirt pattern to show movement
  ctx.save();
  ctx.beginPath();
  ctx.rect(logicalLeft, beltY - beltHeight / 2, beltDrawWidth, beltHeight);
  ctx.clip();

  const segmentWidth = 150;
  const offset = beltPos % segmentWidth;

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#2b2f33';

  const startX = logicalLeft - (logicalLeft % segmentWidth) + offset - segmentWidth;
  for (let x = startX; x < logicalRight + segmentWidth; x += segmentWidth) {
    ctx.beginPath();
    ctx.moveTo(x, beltY - beltHeight / 2);
    ctx.lineTo(x, beltY + beltHeight / 2);
    ctx.stroke();

    // Add subtle belt wear/texture
    ctx.fillStyle = 'rgba(255,255,255,0.015)';
    ctx.fillRect(x + 20, beltY - beltHeight / 2 + 20, 30, beltHeight - 40);
  }
  ctx.restore();
}

function updateTime() {
  const now = new Date();
  document.getElementById('timestamp').innerText = now.toISOString().replace('T', ' ').slice(0, 19);
}
setInterval(updateTime, 1000);
updateTime();

function animate(time) {
  const dt = time - lastTime;
  lastTime = time;

  // Floor
  ctx.resetTransform();
  ctx.fillStyle = '#e1e3e6'; // Clean factory floor color
  ctx.fillRect(0, 0, width, height);

  // Non-linear speed mapping giving fine control at low speeds
  const rawSpeed = parseFloat(speedSlider.value) / 100;
  const speed = Math.pow(rawSpeed, 2) * 6 + 0.2;

  const slideFactor = parseFloat(slideSlider.value);

  // Apply Camera Zoom
  ctx.translate(width / 2, beltY);
  ctx.scale(ZOOM_OUT, ZOOM_OUT);
  ctx.translate(-width / 2, -beltY);

  const targetVx = speed * 3.5;
  beltPosition += targetVx;

  drawConveyorBelt(beltPosition);

  const logicalLeft = width / 2 - (width / 2) / ZOOM_OUT;
  const logicalRight = width / 2 + (width / 2) / ZOOM_OUT;

  // Spawner for GROUPS of 3 as packages
  const baseInterval = 3500; // Increased to provide a realistic gap between packages
  const currentInterval = baseInterval / Math.max(0.5, speed);

  spawnTimer += dt;
  if (spawnTimer >= currentInterval) {
    const newPack = new PenPackage(logicalLeft - 250);
    let canSpawn = true;
    for (const p of pens) {
      if (Math.abs(p.x - newPack.x) < (p.trayWidth + newPack.trayWidth) / 2 + 10 &&
        Math.abs(p.y - newPack.y) < (p.trayHeight + newPack.trayHeight) / 2 + 10) {
        canSpawn = false;
        break;
      }
    }
    if (canSpawn) {
      pens.push(newPack);
      spawnTimer = 0;
    }
  }

  // Update logic
  for (let i = pens.length - 1; i >= 0; i--) {
    pens[i].update(speed, slideFactor);
  }

  // Resolve Collisions
  const iterations = 3;
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < pens.length; i++) {
      const p = pens[i];
      // Belt bounds
      const minY = beltY - beltHeight / 2 + p.trayHeight / 2;
      const maxY = beltY + beltHeight / 2 - p.trayHeight / 2;
      if (p.y < minY) { p.y = minY; p.vy = Math.max(0, p.vy); }
      if (p.y > maxY) { p.y = maxY; p.vy = Math.min(0, p.vy); }

      for (let j = i + 1; j < pens.length; j++) {
        const p1 = pens[i];
        const p2 = pens[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;

        const minX = (p1.trayWidth + p2.trayWidth) / 2 + 8;
        const minY_dist = (p1.trayHeight + p2.trayHeight) / 2 + 8;

        if (Math.abs(dx) < minX && Math.abs(dy) < minY_dist) {
          const overlapX = minX - Math.abs(dx);
          const overlapY = minY_dist - Math.abs(dy);

          if (overlapX < overlapY) {
            const sign = dx > 0 ? 1 : -1;
            p1.x += (overlapX / 2) * sign;
            p2.x -= (overlapX / 2) * sign;
            p1.vx += sign * 1.5;
            p2.vx -= sign * 1.5;
          } else {
            const sign = dy > 0 ? 1 : -1;
            p1.y += (overlapY / 2) * sign;
            p2.y -= (overlapY / 2) * sign;
            p1.vy += sign * 1.5;
            p2.vy -= sign * 1.5;
          }
        }
      }
    }
  }

  // Draw and cleanup
  for (let i = pens.length - 1; i >= 0; i--) {
    const pen = pens[i];
    pen.draw(ctx);

    // Cleanup
    if (pen.x > logicalRight + 250) {
      pens.splice(i, 1);
    }
  }

  // Real-time camera artifact noise? (Very subtle)
  ctx.resetTransform();
  ctx.fillStyle = 'rgba(0,0,0,0.02)';
  ctx.fillRect(0, 0, width, height);

  requestAnimationFrame(animate);
}

// Start
requestAnimationFrame(animate);
