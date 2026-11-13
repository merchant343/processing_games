// 게임 설정 상수
final int GRID_COLS = 15;      // 가로 블록 개수
final int GRID_ROWS = 10;      // 세로 블록 개수
final int BLOCK_SIZE = 32;     // 블록 한 칸의 크기 (px)
final int OFFSET_X = 60;       // 구조물 시작 X 좌표
final int OFFSET_Y = 60;       // 구조물 시작 Y 좌표

// 블록 상태 (0: 빈 공간, 1: 일반 블록, 2: 코어)
int[][] grid = new int[GRID_ROWS][GRID_COLS];

// 게임 상태 변수
int ammo = 5;                  // 제한된 탄환 수 (n개)
int gameState = 0;             // 0: 진행 중, 1: 승리, 2: 패배
PVector gunPos;                // 총 위치
Bullet activeBullet = null;    // 현재 발사된 탄환
ArrayList<Explosion> explosions = new ArrayList<Explosion>(); // 폭발 이펙트

void setup() {
  size(600, 750);
  gunPos = new PVector(width / 2, height - 40);
  initLevel();
}

// 레벨 및 블록 구조물 초기화
void initLevel() {
  ammo = 5;
  gameState = 0;
  activeBullet = null;
  explosions.clear();

  // 전체 맵 초기화
  for (int r = 0; r < GRID_ROWS; r++) {
    for (int c = 0; c < GRID_COLS; c++) {
      grid[r][c] = 0;
    }
  }

  // 상단 구조물 생성 (피라미드/요새 형태 예시)
  for (int r = 1; r <= 7; r++) {
    for (int c = 2; c <= 12; c++) {
      // 모서리를 깎아 구조물 형태 만들기
      if (r == 7 && (c < 4 || c > 10)) continue;
      if (r == 6 && (c < 3 || c > 11)) continue;
      grid[r][c] = 1;
    }
  }

  // 구조물 깊숙한 곳에 코어(2) 배치 (직격이 어렵도록 상단에 배치)
  grid[2][7] = 2;
}

void draw() {
  background(25, 28, 36);

  drawGrid();
  drawAimLine();
  drawGun();
  updateAndDrawBullet();
  updateAndDrawExplosions();
  drawUI();
}

// 블록 및 코어 그리기
void drawGrid() {
  stroke(40, 44, 52);
  strokeWeight(1);

  for (int r = 0; r < GRID_ROWS; r++) {
    for (int c = 0; c < GRID_COLS; c++) {
      float x = OFFSET_X + c * BLOCK_SIZE;
      float y = OFFSET_Y + r * BLOCK_SIZE;

      if (grid[r][c] == 1) {
        fill(90, 140, 210); // 일반 블록 색상
        rect(x, y, BLOCK_SIZE, BLOCK_SIZE, 4);
      } else if (grid[r][c] == 2) {
        // 코어 (맥동하는 붉은색 효과)
        float pulse = sin(frameCount * 0.15) * 30;
        fill(230 + pulse, 50, 70);
        rect(x, y, BLOCK_SIZE, BLOCK_SIZE, 6);
        fill(255, 220, 220);
        ellipse(x + BLOCK_SIZE/2, y + BLOCK_SIZE/2, BLOCK_SIZE * 0.4, BLOCK_SIZE * 0.4);
      }
    }
  }
}

// 조준선 그리기 (발사 가능할 때만 표시)
void drawAimLine() {
  if (gameState == 0 && activeBullet == null && ammo > 0) {
    PVector dir = new PVector(mouseX - gunPos.x, mouseY - gunPos.y);
    // 위쪽으로만 조준 가능하도록 제한
    if (dir.y > -20) dir.y = -20;
    dir.normalize();

    stroke(255, 255, 255, 80);
    strokeWeight(2);
    // 점선 효과
    for (int i = 20; i < 250; i += 15) {
      point(gunPos.x + dir.x * i, gunPos.y + dir.y * i);
    }
  }
}

// 중앙 하단 총 그리기
void drawGun() {
  pushMatrix();
  translate(gunPos.x, gunPos.y);
  
  float angle = atan2(mouseY - gunPos.y, mouseX - gunPos.x);
  if (angle > -0.1) angle = -0.1;
  if (angle < -PI + 0.1) angle = -PI + 0.1;
  
  rotate(angle);
  
  // 포신
  fill(180, 190, 200);
  noStroke();
  rect(0, -8, 38, 16, 4);
  popMatrix();

  // 포탑 본체
  fill(120, 130, 145);
  ellipse(gunPos.x, gunPos.y, 44, 44);
}

// 탄환 업데이트 및 렌더링
void updateAndDrawBullet() {
  if (activeBullet != null) {
    activeBullet.update();
    activeBullet.display();

    if (activeBullet.exploded) {
      activeBullet = null;
      checkGameStatus();
    }
  }
}

// 폭발 이펙트 업데이트 및 렌더링
void updateAndDrawExplosions() {
  for (int i = explosions.size() - 1; i >= 0; i--) {
    Explosion e = explosions.get(i);
    e.update();
    e.display();
    if (e.isFinished()) {
      explosions.remove(i);
    }
  }
}

// UI 및 게임 결과 화면
void drawUI() {
  fill(255);
  textSize(18);
  textAlign(LEFT, CENTER);
  text("남은 탄환: " + ammo, 25, height - 35);

  textAlign(RIGHT, CENTER);
  textSize(14);
  fill(180);
  text("2회 반사 / 3회 충돌 시 3x3 폭발", width - 25, height - 35);

  if (gameState != 0) {
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);

    textAlign(CENTER, CENTER);
    if (gameState == 1) {
      fill(100, 255, 130);
      textSize(42);
      text("MISSION CLEAR!", width / 2, height / 2 - 20);
    } else {
      fill(255, 90, 90);
      textSize(42);
      text("OUT OF AMMO!", width / 2, height / 2 - 20);
    }

    fill(255);
    textSize(18);
    text("다시 시작하려면 [R] 키를 누르세요", width / 2, height / 2 + 35);
  }
}

// 코어 파괴 여부 및 탄환 소진 체크
void checkGameStatus() {
  boolean coreExists = false;
  for (int r = 0; r < GRID_ROWS; r++) {
    for (int c = 0; c < GRID_COLS; c++) {
      if (grid[r][c] == 2) {
        coreExists = true;
        break;
      }
    }
  }

  if (!coreExists) {
    gameState = 1; // 승리
  } else if (ammo <= 0) {
    gameState = 2; // 패배
  }
}

// 마우스 클릭으로 발사
void mousePressed() {
  if (gameState == 0 && activeBullet == null && ammo > 0) {
    PVector dir = new PVector(mouseX - gunPos.x, mouseY - gunPos.y);
    if (dir.y > -20) dir.y = -20; // 수평 이하 발사 방지
    dir.normalize();
    dir.mult(11); // 탄환 속도

    activeBullet = new Bullet(gunPos.x, gunPos.y, dir);
    ammo--;
  }
}

// R키로 재시작
void keyPressed() {
  if (key == 'r' || key == 'R') {
    initLevel();
  }
}

// ==========================================
// 탄환 클래스 (2회 반사, 3회 폭발 로직 포함)
// ==========================================
class Bullet {
  PVector pos;
  PVector vel;
  float r = 7;
  int bounceCount = 0;
  boolean exploded = false;

  Bullet(float x, float y, PVector v) {
    pos = new PVector(x, y);
    vel = v;
  }

  void update() {
    // 터널링(빠른 속도로 블록을 뚫고 지나감) 방지를 위해 이동을 4단계로 쪼개서 계산
    int steps = 4;
    PVector stepVel = PVector.div(vel, steps);

    for (int s = 0; s < steps; s++) {
      // 1. X축 이동 및 충돌 검사
      pos.x += stepVel.x;
      if (pos.x - r < 0 || pos.x + r > width) {
        pos.x = constrain(pos.x, r, width - r);
        vel.x *= -1;
        stepVel.x *= -1;
        if (handleImpact(pos.x, pos.y)) return;
      } else if (checkBlockCollision()) {
        pos.x -= stepVel.x;
        vel.x *= -1;
        stepVel.x *= -1;
        if (handleImpact(pos.x, pos.y)) return;
      }

      // 2. Y축 이동 및 충돌 검사
      pos.y += stepVel.y;
      if (pos.y - r < 0) {
        pos.y = r;
        vel.y *= -1;
        stepVel.y *= -1;
        if (handleImpact(pos.x, pos.y)) return;
      } else if (pos.y + r > height) {
        // 바닥에 닿으면 즉시 소멸(폭발) 처리
        triggerExplosion(pos.x, pos.y);
        return;
      } else if (checkBlockCollision()) {
        pos.y -= stepVel.y;
        vel.y *= -1;
        stepVel.y *= -1;
        if (handleImpact(pos.x, pos.y)) return;
      }
    }
  }

  // 블록과의 AABB(사각형-원) 충돌 판정
  boolean checkBlockCollision() {
    for (int row = 0; row < GRID_ROWS; row++) {
      for (int col = 0; col < GRID_COLS; col++) {
        if (grid[row][col] != 0) {
          float bx = OFFSET_X + col * BLOCK_SIZE;
          float by = OFFSET_Y + row * BLOCK_SIZE;

          float closestX = constrain(pos.x, bx, bx + BLOCK_SIZE);
          float closestY = constrain(pos.y, by, by + BLOCK_SIZE);

          float distSq = sq(pos.x - closestX) + sq(pos.y - closestY);
          if (distSq < sq(r)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // 충돌 횟수 처리 (1~2회: 반사 / 3회: 폭발)
  boolean handleImpact(float impactX, float impactY) {
    bounceCount++;
    if (bounceCount >= 3) {
      triggerExplosion(impactX, impactY);
      return true;
    }
    return false;
  }

  // 3x3 블록 범위 폭발 실행
  void triggerExplosion(float ex, float ey) {
    exploded = true;
    explosions.add(new Explosion(ex, ey));

    // 폭발 지점을 그리드 좌표로 변환
    int centerCol = floor((ex - OFFSET_X) / BLOCK_SIZE);
    int centerRow = floor((ey - OFFSET_Y) / BLOCK_SIZE);

    // 중심 기준 -1 ~ +1 (총 3x3 범위) 블록 제거
    for (int r = centerRow - 1; r <= centerRow + 1; r++) {
      for (int c = centerCol - 1; c <= centerCol + 1; c++) {
        if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
          grid[r][c] = 0;
        }
      }
    }
  }

  void display() {
    noStroke();
    // 충돌 횟수에 따라 색상 단계별 변경 (남은 튕김 횟수 직관화)
    if (bounceCount == 0) {
      fill(100, 240, 255); // 초기 상태: 2번 튕김 남음 (하늘색)
    } else if (bounceCount == 1) {
      fill(255, 230, 80);  // 1회 튕김: 1번 튕김 남음 (노란색)
    } else {
      fill(255, 110, 40);  // 2회 튕김: 다음 충돌 시 즉시 폭발 (주황색)
    }
    ellipse(pos.x, pos.y, r * 2, r * 2);
  }
}

// ==========================================
// 폭발 시각 효과 클래스
// ==========================================
class Explosion {
  float x, y;
  float maxRadius = BLOCK_SIZE * 2.1; // 3x3 블록을 덮는 시각적 반경
  int life = 18;
  int maxLife = 18;

  Explosion(float x, float y) {
    this.x = x;
    this.y = y;
  }

  void update() {
    life--;
  }

  void display() {
    float progress = 1.0 - (float)life / maxLife;
    float currentRadius = maxRadius * sin(progress * HALF_PI);
    float alpha = map(life, 0, maxLife, 0, 230);

    noStroke();
    fill(255, 100, 30, alpha);
    ellipse(x, y, currentRadius * 2, currentRadius * 2);

    fill(255, 230, 120, alpha);
    ellipse(x, y, currentRadius * 1.1, currentRadius * 1.1);
  }

  boolean isFinished() {
    return life <= 0;
  }
}
