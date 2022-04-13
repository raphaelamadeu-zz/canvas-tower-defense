addEventListener("load", () => {
  const canvas = canvas1;
  const ctx = canvas.getContext("2d");

  canvas.width = 900;
  canvas.height = 600;

  // Global
  const cellSize = 100;
  const cellGap = 3;
  const gameGrid = [];
  const defenders = [];
  let numberOfResources = 300;
  const enemies = [];
  const enemiesPosition = [];
  let enemiesInterval = 600;
  let frame = 0;
  let gameOver = false;
  const projectiles = [];
  let score = 0;
  const resources = [];

  // mouse
  const mouse = {
    x: 0,
    y: 0,
    width: 0.1,
    height: 0.1,
  };

  const canvasPosition = canvas.getBoundingClientRect();

  canvas.addEventListener("mousemove", (e) => {
    mouse.x =
      ((e.x - canvasPosition.left) * canvas.width) / canvasPosition.width;
    mouse.y =
      ((e.y - canvasPosition.top) * canvas.height) / canvasPosition.height;
  });

  canvas.addEventListener("mouseleave", () => {
    mouse.x = 0;
    mouse.y = 0;
  });

  // Game board
  const controlsBar = {
    width: canvas.width,
    height: cellSize,
  };

  class Cell {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.height = cellSize;
      this.width = cellSize;
    }
    draw() {
      if (collision(this, mouse)) {
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x, this.y, this.width, this.height);
      }
    }
  }

  function createGrid() {
    for (let y = cellSize; y < canvas.height; y += cellSize) {
      for (let x = 0; x < canvas.width; x += cellSize) {
        gameGrid.push(new Cell(x, y));
      }
    }
  }

  createGrid();

  function handleGameGrid() {
    for (let i = 0; i < gameGrid.length; i++) {
      gameGrid[i].draw();
    }
  }

  // Projectiles
  class Projectile {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 10;
      this.height = 10;
      this.power = 20;
      this.speed = 5;
    }
    update() {
      this.x += this.speed;
    }
    draw() {
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function handleProjectiles() {
    for (let i = 0; i < projectiles.length; i++) {
      projectiles[i].update();
      projectiles[i].draw();

      for (let j = 0; j < enemies.length; j++) {
        if (
          projectiles[i] &&
          enemies[j] &&
          collision(projectiles[i], enemies[j])
        ) {
          enemies[j].health -= projectiles[i].power;
          projectiles.splice(i, 1);
          i--;
        }
      }

      if (projectiles[i] && projectiles[i].x > canvas.width + cellSize) {
        projectiles.splice(i, 1);
        i--;
      }
    }
  }
  // Defenders

  class Defender {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = cellSize;
      this.height = cellSize;
      this.shooting = false;
      this.health = 100;
      this.projectiles = [];
      this.timer = 0;
    }
    draw() {
      ctx.fillStyle = "green";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = "gold";
      ctx.font = "20px arial";
      ctx.fillText(Math.floor(this.health), this.x + 25, this.y + 20);
    }
    update() {
      if (this.shooting) {
        this.timer++;
        if (this.timer % 100 === 0) {
          projectiles.push(new Projectile(this.x + 70, this.y + 50));
        }
      } else {
        this.timer = 0;
      }
    }
  }

  canvas.addEventListener("click", () => {
    const gridPositionX = mouse.x - (mouse.x % cellSize);
    const gridPositionY = mouse.y - (mouse.y % cellSize);

    if (gridPositionY < cellSize) return;

    for (let i = 0; i < defenders.length; i++) {
      if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
        return;
    }

    let defenderCost = 100;
    if (numberOfResources >= defenderCost) {
      defenders.push(new Defender(gridPositionX, gridPositionY));
      numberOfResources -= defenderCost;
    }
  });

  function handleDefenders() {
    for (let i = 0; i < defenders.length; i++) {
      defenders[i].draw();
      defenders[i].update();

      if (enemiesPosition.indexOf(defenders[i].y) !== -1) {
        defenders[i].shooting = true;
      } else {
        defenders[i].shooting = false;
      }

      for (let j = 0; j < enemies.length; j++) {
        if (
          defenders[i] &&
          collision(defenders[i], enemies[j]) &&
          defenders[i].y === enemies[j].y
        ) {
          defenders[i].health -= 0.2;
          enemies[j].movement = 0;
        }
        if (defenders[i] && defenders[i].health <= 0) {
          defenders.splice(i, 1);
          i--;
          enemies[j].movement = enemies[j].speed;
        }
      }
    }
  }
  // Enemies
  class Enemy {
    constructor(verticalPosition) {
      this.x = canvas.width;
      this.y = verticalPosition;
      this.width = cellSize;
      this.height = cellSize;
      this.speed = Math.random() * 0.2 + 0.4;
      this.movement = this.speed;
      this.health = 100;
      this.maxHealth = this.health;
    }
    update() {
      this.x -= this.movement;
    }
    draw() {
      ctx.fillStyle = "red";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = "black";
      ctx.font = "20px Arial";
      ctx.fillText(this.health, this.x + 25, this.y + 20);
    }
  }

  function handleEnemies() {
    for (let i = 0; i < enemies.length; i++) {
      enemies[i].update();
      enemies[i].draw();

      if (enemies[i].health <= 0) {
        let gainedResources = enemies[i].maxHealth / 10;

        numberOfResources += gainedResources;
        score += gainedResources;

        enemiesPosition.splice(enemiesPosition.indexOf(enemies[i].y), 1);
        enemies.splice(i, 1);
        i--;
      }
      if (enemies[i]?.x < 0) gameOver = true;
    }
    if (frame % enemiesInterval === 0) {
      const verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize;
      enemiesPosition.push(verticalPosition);
      enemies.push(new Enemy(verticalPosition));
      if (enemiesInterval > 50) enemiesInterval -= 50;
    }
  }

  // Resources
  const amounts = [20, 30, 40];

  class Resource {
    constructor() {
      this.x = Math.random() * (canvas.width - cellSize);
      this.y = Math.floor(Math.random() * 5 + 1) * cellSize + 25;
      this.width = cellSize * 0.6;
      this.height = cellSize * 0.6;
      this.amount = amounts[Math.floor(Math.random() * amounts.length)];
    }
    draw() {
      ctx.fillStyle = "yellow";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = "black";
      ctx.font = "20px Helvetica";
      ctx.fillText(this.amount, this.x + 15, this.y + 25);
    }
  }

  function handleResources() {
    for (let i = 0; i < resources.length; i++) {
      resources[i].draw();
      if (resources[i] && collision(mouse, resources[i])) {
        numberOfResources += resources[i].amount;
        resources.splice(i, 1);
      }
    }
    if (frame % 500 === 0) {
      resources.push(new Resource());
    }
  }

  // Utilities

  function handleGameStatus() {
    ctx.fillStyle = "gold";
    ctx.font = "30px Arial";
    ctx.fillText(`Resources: ${numberOfResources}`, 20, 50);
    ctx.fillText(`Score: ${score}`, 20, 80);

    if (gameOver) {
      ctx.fillStyle = "black";
      ctx.font = "60px Arial";
      ctx.fillText("GAME OVER", canvas.height / 2 - 50, canvas.width / 2 - 100);
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
    handleGameGrid();
    handleDefenders();
    handleEnemies();
    handleGameStatus();
    handleProjectiles();
    handleResources();
    if (!gameOver) requestAnimationFrame(animate);
    frame++;
  }

  animate();

  function collision(first, second) {
    if (
      !(
        first.x > second.x + second.width ||
        first.x + first.width < second.x ||
        first.y > second.y + second.height ||
        first.y + first.height < second.y
      )
    ) {
      return true;
    }
  }
});
