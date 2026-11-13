let turret;
let bullets = [];
let explosions = [];
let blocks = [];

const BLOCK_SIZE = 28; // 작은 블록 1개의 크기
const COLS = 15;       // 구조물 가로 블록 수
const ROWS = 7;        // 구조물 세로 블록 수

let maxAmmo = 5;       // 제한된 탄환 수 (n개)
let ammo = maxAmmo;
let gameState = 'PLAY'; // 'PLAY', 'WIN', 'LOSE'

function setup() {
  createCanvas(600, 650);
  initGame();
}

function initGame() {
  ammo = maxAmmo;
  bullets = [];
  explosions = [];
  gameState = 'PLAY';

  // 화면 정중앙 하단부 총(포탑) 배치
  turret = {
    x: width / 2,
    y: height - 35,
    angle: -HALF_PI
  };

  buildStructure();
}

// 화면 상단부에 작은 블록 여러 개로 이루어진 큰 구조물 및 코어 생성
function buildStructure() {
  blocks = [];
  let totalW = COLS * BLOCK_SIZE;
  let startX = (width - totalW) / 2;
  let startY = 70;

  // 코어 위치 (구조물 안쪽 중앙 부근)
  let coreCol = floor(COLS / 2);
  let coreRow = 2;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // 구조물 외형을 성벽/요새처럼 다듬기 (일부 모서리 비우기)
      if ((r === ROWS - 1 && (c < 2 || c > COLS - 3)) ||
          (r === ROWS - 2 && (c === 0 || c === COLS - 1))) {
        continue;
      }

      let isCore = (r === coreRow && c === coreCol);
      blocks.push({
        x: startX + c * BLOCK_SIZE,
        y: startY + r * BLOCK_SIZE,
        w: BLOCK_SIZE,
        h: BLOCK_SIZE,
        isCore: isCore,
        alive: true
      });
    }
  }
}

function draw() {
  background(25);

  // 1. 조준선 및 포탑 그리기
  drawTurret();

  // 2. 상단 구조물 블록 및 코어 그리기
  drawBlocks();

  // 3. 탄환 업데이트 (이동, 반사, 3회째 폭발)
  updateBullets();

  // 4. 폭발 이펙트 그리기
  drawExplosions();

  // 5. UI (남은 탄환 수 및 상태 안내)
  drawUI();

  // 6. 승패 판정 확인
  checkGameState();
}

function drawTurret() {
  // 마우스를 향한 각도 계산 (위쪽 방향으로만 조준 제한)
  let dx = mouseX - turret.x;
  let dy = mouseY - turret.y;
  let angle = atan2(dy, dx);
  angle = constrain(angle, -PI + 0.15, -0.15);
  turret.angle = angle;

  // 발사 가능 상태일 때 조준 점선 표시
  if (gameState === 'PLAY' && ammo > 0 && bullets.length === 0) {
    stroke(255, 255, 255, 90);
    strokeWeight(2);
    drawingContext.setLineDash([6, 6]);
    line(turret.x, turret.y, turret.x + cos(angle) * 180, turret.y + sin(angle) * 180);
    drawingContext.setLineDash([]);
  }

  // 총신 및 본체 그리기
  push();
  translate(turret.x, turret.y);
  rotate(turret.angle);
  fill(180);
  noStroke();
  rectMode(CENTER);
  rect(18, 0, 32, 12, 3); // 총신
  pop();

  fill(80, 170, 255);
  stroke(255);
  strokeWeight(2);
  arc(turret.x, turret.y + 10, 54, 54, PI, TWO_PI); // 포탑 베이스
}

function drawBlocks() {
  for (let b of blocks) {
    if (!b.alive) continue;

    if (b.isCore) {
      // 코어 블록 (강조 효과)
      fill(255, 60, 80);
      stroke(255, 200, 200);
      strokeWeight(2);
      rect(b.x, b.y, b.w, b.h, 4);

      // 코어 내부 빛나는 원
      noStroke();
      fill(255, 230, 100);
      ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w * 0.45);
    } else {
      // 일반 구조물 블록
      fill(110, 125, 145);
      stroke(40, 45, 55);
      strokeWeight(1.5);
      rect(b.x, b.y, b.w, b.h, 2);
    }
  }
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    let hit = false;

    // --- X축 이동 및 충돌 체크 ---
    b.x += b.vx;
    if (b.x - b.r < 0) {
      b.x = b.r;
      b.vx *= -1;
      hit = true;
    } else if (b.x + b.r > width) {
      b.x = width - b.r;
      b.vx *= -1;
      hit = true;
    } else {
      for (let blk of blocks) {
        if (blk.alive && circleRectCollide(b.x, b.y, b.r, blk.x, blk.y, blk.w, blk.h)) {
          b.x -= b.vx; // 위치 복구
          b.vx *= -1;
          hit = true;
          break;
        }
      }
    }

    // --- Y축 이동 및 충돌 체크 ---
    b.y += b.vy;
    if (b.y - b.r < 0) {
      b.y = b.r;
      b.vy *= -1;
      hit = true;
    } else {
      for (let blk of blocks) {
        if (blk.alive && circleRectCollide(b.x, b.y, b.r, blk.x, blk.y, blk.w, blk.h)) {
          b.y -= b.vy; // 위치 복구
          b.vy *= -1;
          hit = true;
          break;
        }
      }
    }

    // 충돌 발생 시 처리 (2번까지 튕김, 3번째 폭발)
    if (hit) {
      b.bounces++;
      if (b.bounces >= 3) {
        triggerExplosion(b.x, b.y);
        bullets.splice(i, 1);
        continue;
      }
    }

    // 화면 아래로 벗어난 경우 제거
    if (b.y - b.r > height) {
      bullets.splice(i, 1);
      continue;
    }

    // 탄환 그리기 (남은 튕김 횟수에 따라 색상 변화)
    noStroke();
    if (b.bounces === 0) fill(100, 220, 255);      // 첫 발사: 하늘색
    else if (b.bounces === 1) fill(255, 210, 70);  // 1회 튕김: 노란색
    else fill(255, 100, 50);                       // 2회 튕김 (다음 충돌 시 폭발!): 주황색

    ellipse(b.x, b.y, b.r * 2);

    // 탄환 위에 남은 바운스 표시
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(10);
    text(3 - b.bounces, b.x, b.y);
  }
}

// 3x3 블록 크기(약 가로세로 BLOCK_SIZE * 3) 범위 폭발 처리
function triggerExplosion(ex, ey) {
  let blastSize = BLOCK_SIZE * 3;
  let halfBlast = blastSize / 2;

  // 폭발 시각 효과 추가
  explosions.push({
    x: ex,
    y: ey,
    size: blastSize,
    alpha: 255
  });

  // 폭발 범위(3x3 사각형 영역) 내의 블록 및 코어 파괴
  for (let blk of blocks) {
    if (!blk.alive) continue;
    let blkCenterX = blk.x + blk.w / 2;
    let blkCenterY = blk.y + blk.h / 2;

    if (abs(blkCenterX - ex) <= halfBlast + blk.w / 2 &&
        abs(blkCenterY - ey) <= halfBlast + blk.h / 2) {
      blk.alive = false;
    }
  }
}

function drawExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    let exp = explosions[i];
    rectMode(CENTER);
    fill(255, 140, 30, exp.alpha * 0.6);
    stroke(255, 220, 100, exp.alpha);
    strokeWeight(3);
    rect(exp.x, exp.y, exp.size, exp.size, 8);
    rectMode(CORNER);

    exp.alpha -= 12;
    if (exp.alpha <= 0) {
      explosions.splice(i, 1);
    }
  }
}

function drawUI() {
  // 남은 탄환 아이콘 표시
  fill(255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(16);
  text(`남은 탄환: ${ammo} / ${maxAmmo}`, 20, 20);

  for (let i = 0; i < maxAmmo; i++) {
    if (i < ammo) fill(100, 220, 255);
    else fill(70);
    ellipse(30 + i * 22, 50, 14);
  }

  // 조작 안내
  fill(180);
  textAlign(RIGHT, TOP);
  textSize(13);
  text("2회 반사 후 3회째 충돌 시 3x3 폭발!", width - 20, 20);

  // 게임 종료 오버레이
  if (gameState !== 'PLAY') {
    fill(0, 180);
    rect(0, 0, width, height);

    textAlign(CENTER, CENTER);
    if (gameState === 'WIN') {
      fill(100, 255, 150);
      textSize(36);
      text("MISSION CLEAR!", width / 2, height / 2 - 20);
    } else {
      fill(255, 90, 90);
      textSize(36);
      text("OUT OF AMMO!", width / 2, height / 2 - 20);
    }

    fill(255);
    textSize(18);
    text("클릭하여 다시 시작", width / 2, height / 2 + 30);
  }
}

function checkGameState() {
  if (gameState !== 'PLAY') return;

  // 코어가 파괴되었는지 확인
  let coreAlive = blocks.some(b => b.isCore && b.alive);
  if (!coreAlive) {
    gameState = 'WIN';
    return;
  }

  // 탄환을 모두 소진했고 날아가는 탄환도 없을 때 패배
  if (ammo === 0 && bullets.length === 0 && explosions.length === 0) {
    gameState = 'LOSE';
  }
}

function mousePressed() {
  if (gameState !== 'PLAY') {
    initGame();
    return;
  }

  // 한 번에 한 발씩 발사 (탄환이 남아있을 때만)
  if (ammo > 0 && bullets.length === 0) {
    let speed = 10;
    bullets.push({
      x: turret.x + cos(turret.angle) * 30,
      y: turret.y + sin(turret.angle) * 30,
      r: 7,
      vx: cos(turret.angle) * speed,
      vy: sin(turret.angle) * speed,
      bounces: 0
    });
    ammo--;
  }
}

// 원과 사각형 충돌 감지 보조 함수
function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
  let testX = constrain(cx, rx, rx + rw);
  let testY = constrain(cy, ry, ry + rh);
  let distX = cx - testX;
  let distY = cy - testY;
  return (distX * distX + distY * distY) <= (cr * cr);
}
