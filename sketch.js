let ball;
let target;
let score = 0;
let isLaunched = false;

function setup() {
  createCanvas(600, 600);
  resetBall();
  spawnTarget();
}

function draw() {
  background(30);

  // 점수 표시
  fill(255);
  noStroke();
  textSize(20);
  textAlign(LEFT, TOP);
  text(`Score: ${score}`, 20, 20);

  // 타겟 그리기
  fill(255, 80, 80);
  ellipse(target.x, target.y, target.r * 2);

  // 발사 전 조준선 표시
  if (!isLaunched) {
    stroke(255, 150);
    strokeWeight(2);
    line(ball.x, ball.y, mouseX, mouseY);
  } else {
    // 공 이동 및 벽 반사 처리
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.r < 0 || ball.x + ball.r > width) {
      ball.vx *= -1;
    }
    if (ball.y - ball.r < 0) {
      ball.vy *= -1;
    }

    // 바닥에 닿으면 초기화
    if (ball.y - ball.r > height) {
      resetBall();
    }

    // 타겟 충돌 판정
    let d = dist(ball.x, ball.y, target.x, target.y);
    if (d < ball.r + target.r) {
      score++;
      spawnTarget();
    }
  }

  // 공 그리기
  noStroke();
  fill(100, 200, 255);
  ellipse(ball.x, ball.y, ball.r * 2);
}

function mousePressed() {
  if (!isLaunched) {
    let angle = atan2(mouseY - ball.y, mouseX - ball.x);
    let speed = 8;
    ball.vx = cos(angle) * speed;
    ball.vy = sin(angle) * speed;
    isLaunched = true;
  }
}

function resetBall() {
  isLaunched = false;
  ball = {
    x: width / 2,
    y: height - 40,
    r: 12,
    vx: 0,
    vy: 0
  };
}

function spawnTarget() {
  target = {
    x: random(60, width - 60),
    y: random(60, height / 2),
    r: 20
  };
}
