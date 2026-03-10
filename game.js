/* global Phaser */

class PlayScene extends Phaser.Scene {
  constructor() {
    super("play");

    this.worldWidth = 5200;
    this.worldHeight = 1400;
    this.groundY = 1120;

    this.moveSpeed = 340;
    this.groundAccel = 2600;
    this.airAccel = 1800;
    this.jumpVelocity = -690;
    this.jumpCutFactor = 0.55;
    this.coyoteTimeMs = 90;
    this.jumpBufferMs = 120;
    this.maxJumps = 2;
    this.shootCooldownMs = 95;
  }

  preload() {}

  create() {
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.input.setDefaultCursor("crosshair");

    this.createProceduralTextures();
    this.createBackground();
    this.createLevel();
    this.createPlayer();
    this.createCombat();
    this.createUi();
    this.createInput();

    this.cameras.main.startFollow(this.player, true, 0.12, 0.08);
    this.cameras.main.setDeadzone(180, 120);
    this.cameras.main.roundPixels = true;
  }

  createProceduralTextures() {
    const tiny = this.make.graphics({ x: 0, y: 0, add: false });
    tiny.fillStyle(0xffffff, 1);
    tiny.fillRect(0, 0, 2, 2);
    tiny.generateTexture("px", 2, 2);
    tiny.destroy();

    this.makePlatformTexture();
    this.makeBulletTexture();
    this.makeGunTexture();
    this.makePlayerTexture("player_idle", "idle");
    this.makePlayerTexture("player_walk_1", "walk1");
    this.makePlayerTexture("player_walk_2", "walk2");
    this.makePlayerTexture("player_jump", "jump");

    if (!this.anims.exists("player_walk")) {
      this.anims.create({
        key: "player_walk",
        frames: [{ key: "player_walk_1" }, { key: "player_walk_2" }],
        frameRate: 10,
        repeat: -1
      });
    }
  }

  makePlatformTexture() {
    const size = 48;
    const h = 24;
    const canvas = this.textures.createCanvas("tile_stone", size, h);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "#20333a";
    ctx.fillRect(0, 0, size, h);

    ctx.fillStyle = "#33535c";
    ctx.fillRect(0, 0, size, 5);

    ctx.fillStyle = "#4d7a84";
    for (let x = 3; x < size; x += 8) {
      ctx.fillRect(x, 2, 4, 2);
    }

    ctx.fillStyle = "#1a2529";
    for (let x = 0; x < size; x += 12) {
      ctx.fillRect(x, 10, 1, h - 10);
    }
    for (let y = 10; y < h; y += 8) {
      ctx.fillRect(0, y, size, 1);
    }

    canvas.refresh();
  }

  makeBulletTexture() {
    const canvas = this.textures.createCanvas("bullet", 10, 4);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "#ffec9a";
    ctx.fillRect(3, 1, 5, 2);
    ctx.fillStyle = "#ffc64a";
    ctx.fillRect(8, 1, 2, 2);
    ctx.fillStyle = "#f3862d";
    ctx.fillRect(0, 1, 3, 2);

    canvas.refresh();
  }

  makeGunTexture() {
    const canvas = this.textures.createCanvas("gun", 18, 7);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "#242b31";
    ctx.fillRect(2, 2, 10, 3);
    ctx.fillStyle = "#3f4d58";
    ctx.fillRect(12, 2, 4, 2);
    ctx.fillStyle = "#181f24";
    ctx.fillRect(6, 5, 2, 2);
    ctx.fillStyle = "#d6dce1";
    ctx.fillRect(16, 2, 2, 2);

    canvas.refresh();
  }

  makePlayerTexture(key, pose) {
    const w = 20;
    const h = 28;
    const canvas = this.textures.createCanvas(key, w, h);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;

    const px = (x, y, pw, ph, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, pw, ph);
    };

    ctx.clearRect(0, 0, w, h);

    let legOffsetL = 0;
    let legOffsetR = 0;
    let armOffset = 0;

    if (pose === "walk1") {
      legOffsetL = -1;
      legOffsetR = 1;
      armOffset = -1;
    }
    if (pose === "walk2") {
      legOffsetL = 1;
      legOffsetR = -1;
      armOffset = 1;
    }
    if (pose === "jump") {
      legOffsetL = -1;
      legOffsetR = -1;
      armOffset = -1;
    }

    px(7, 2, 6, 5, "#c99973");
    px(8, 1, 4, 1, "#8a5a36");

    px(5, 7, 10, 8, "#2f5aa8");
    px(4 + armOffset, 8, 2, 7, "#2f5aa8");
    px(14 + armOffset, 8, 2, 7, "#2f5aa8");
    px(6, 15, 8, 2, "#4e7ad5");

    px(6 + legOffsetL, 17, 3, 8, "#29353d");
    px(11 + legOffsetR, 17, 3, 8, "#29353d");
    px(6 + legOffsetL, 25, 3, 2, "#4a5963");
    px(11 + legOffsetR, 25, 3, 2, "#4a5963");

    canvas.refresh();
  }

  createBackground() {
    this.makeSkyTexture();
    this.makeMountainTexture("mountains_far", "#12383f", "#0e2c33", 20, 58);
    this.makeMountainTexture("mountains_mid", "#1f4a45", "#173a37", 28, 74);
    this.makeMountainTexture("mountains_near", "#32635a", "#274d46", 36, 94);

    this.sky = this.add
      .tileSprite(
        0,
        0,
        this.cameras.main.width,
        this.cameras.main.height,
        "sky"
      )
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-40);

    this.bgFar = this.add
      .tileSprite(0, this.groundY - 280, this.worldWidth, 220, "mountains_far")
      .setOrigin(0, 1)
      .setDepth(-30);

    this.bgMid = this.add
      .tileSprite(0, this.groundY - 210, this.worldWidth, 230, "mountains_mid")
      .setOrigin(0, 1)
      .setDepth(-20);

    this.bgNear = this.add
      .tileSprite(0, this.groundY - 140, this.worldWidth, 240, "mountains_near")
      .setOrigin(0, 1)
      .setDepth(-10);
  }

  makeSkyTexture() {
    const w = 512;
    const h = 256;
    const canvas = this.textures.createCanvas("sky", w, h);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#102b45");
    grad.addColorStop(0.55, "#1b4f5e");
    grad.addColorStop(1, "#2d7a70");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 60; i += 1) {
      const x = Phaser.Math.Between(0, w - 1);
      const y = Phaser.Math.Between(0, h - 1);
      const b = Phaser.Math.Between(150, 255);
      ctx.fillStyle = `rgb(${b},${b},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }

    canvas.refresh();
  }

  makeMountainTexture(key, topColor, baseColor, stepSize, maxHeight) {
    const w = 512;
    const h = 256;
    const canvas = this.textures.createCanvas(key, w, h);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, h - 110, w, 110);

    ctx.fillStyle = topColor;
    let x = 0;
    while (x < w + stepSize) {
      const hillW = Phaser.Math.Between(stepSize, stepSize * 2);
      const hillH = Phaser.Math.Between(maxHeight / 2, maxHeight);
      ctx.fillRect(x, h - 110 - hillH, hillW, hillH);
      x += hillW - 4;
    }

    canvas.refresh();
  }

  createLevel() {
    this.platforms = this.physics.add.staticGroup();

    const addTiles = (startX, y, count) => {
      for (let i = 0; i < count; i += 1) {
        this.platforms.create(startX + i * 48 + 24, y, "tile_stone");
      }
    };

    const yFromGround = (height) => this.groundY - Math.round(height * 0.72);

    for (let x = 0; x < this.worldWidth; x += 48 * 8) {
      addTiles(x, this.groundY, 8);
    }

    addTiles(320, yFromGround(150), 3);
    addTiles(620, yFromGround(240), 4);
    addTiles(1040, yFromGround(320), 3);
    addTiles(1420, yFromGround(210), 4);
    addTiles(1840, yFromGround(280), 3);
    addTiles(2140, yFromGround(390), 3);
    addTiles(2460, yFromGround(180), 5);
    addTiles(2860, yFromGround(260), 3);
    addTiles(3220, yFromGround(340), 4);
    addTiles(3650, yFromGround(240), 4);
    addTiles(4020, yFromGround(310), 3);
    addTiles(4360, yFromGround(190), 5);
    addTiles(4780, yFromGround(280), 3);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(180, this.groundY - 120, "player_idle");
    this.player.setScale(2);
    this.player.setCollideWorldBounds(true);
    this.player.setDragX(2800);
    this.player.setMaxVelocity(this.moveSpeed, 1000);

    this.player.body.setSize(12, 24);
    this.player.body.setOffset(4, 2);

    this.weapon = this.add.image(this.player.x, this.player.y - 8, "gun");
    this.weapon.setDepth(20);

    this.physics.add.collider(this.player, this.platforms);

    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpsUsed = 0;
  }

  createCombat() {
    this.bullets = this.physics.add.group({
      defaultKey: "bullet",
      maxSize: 400
    });

    this.bullets.children.each((child) => {
      child.body.allowGravity = false;
    });

    this.nextShootTime = 0;

    this.fx = this.add.particles(0, 0, "px", {
      speed: { min: 60, max: 260 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.8, end: 0 },
      lifespan: { min: 80, max: 180 },
      quantity: 0,
      blendMode: "ADD"
    });
    this.fx.setDepth(30);

    this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
      this.destroyBullet(bullet, true);
    });
  }

  createUi() {
    this.uiText = this.add
      .text(
        14,
        12,
        "WASD / Arrow keys to move\nSpace, W or Up to jump (double jump)\nMouse to aim, LMB to shoot",
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#e6fff2",
          lineSpacing: 6,
          padding: { x: 8, y: 6 },
          backgroundColor: "rgba(8,20,22,0.48)"
        }
      )
      .setScrollFactor(0)
      .setDepth(1000);
  }

  createInput() {
    this.keys = this.input.keyboard.addKeys({
      leftA: Phaser.Input.Keyboard.KeyCodes.A,
      rightD: Phaser.Input.Keyboard.KeyCodes.D,
      leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
      rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      jumpSpace: Phaser.Input.Keyboard.KeyCodes.SPACE,
      jumpW: Phaser.Input.Keyboard.KeyCodes.W,
      jumpUp: Phaser.Input.Keyboard.KeyCodes.UP
    });
  }

  isJumpPressed() {
    return (
      Phaser.Input.Keyboard.JustDown(this.keys.jumpSpace) ||
      Phaser.Input.Keyboard.JustDown(this.keys.jumpW) ||
      Phaser.Input.Keyboard.JustDown(this.keys.jumpUp)
    );
  }

  isJumpReleased() {
    return (
      Phaser.Input.Keyboard.JustUp(this.keys.jumpSpace) ||
      Phaser.Input.Keyboard.JustUp(this.keys.jumpW) ||
      Phaser.Input.Keyboard.JustUp(this.keys.jumpUp)
    );
  }

  update(time, delta) {
    const dt = delta;
    const body = this.player.body;
    const onGround = body.blocked.down || body.touching.down;

    if (onGround) {
      this.coyoteTimer = this.coyoteTimeMs;
      if (body.velocity.y >= 0) {
        this.jumpsUsed = 0;
      }
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (this.isJumpPressed()) {
      this.jumpBufferTimer = this.jumpBufferMs;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    const left =
      this.keys.leftA.isDown || this.keys.leftArrow.isDown ? -1 : 0;
    const right =
      this.keys.rightD.isDown || this.keys.rightArrow.isDown ? 1 : 0;
    const moveDir = left + right;

    const accel = onGround ? this.groundAccel : this.airAccel;
    const drag = onGround ? 2800 : 900;
    this.player.setDragX(drag);

    if (moveDir !== 0) {
      this.player.setAccelerationX(moveDir * accel);
    } else {
      this.player.setAccelerationX(0);
    }

    const canGroundJump = onGround || this.coyoteTimer > 0;
    const canAirJump = !canGroundJump && this.jumpsUsed < this.maxJumps;

    if (this.jumpBufferTimer > 0 && (canGroundJump || canAirJump)) {
      this.player.setVelocityY(this.jumpVelocity);
      this.jumpsUsed += 1;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    }

    if (this.isJumpReleased() && this.player.body.velocity.y < -120) {
      this.player.setVelocityY(this.player.body.velocity.y * this.jumpCutFactor);
    }

    if (this.player.y > this.worldHeight + 200) {
      this.player.setPosition(180, this.groundY - 120);
      this.player.setVelocity(0, 0);
      this.jumpsUsed = 0;
    }

    this.updateAimAndWeapon();
    this.updateShooting(time);
    this.updateBullets(time);
    this.updateAnimation(moveDir, onGround);
    this.updateParallax();
  }

  updateAimAndWeapon() {
    const pointer = this.input.activePointer;
    const worldPoint = pointer.positionToCamera(this.cameras.main);
    const shoulderY = this.player.y - 14;
    const shoulderX = this.player.x;
    const angle = Phaser.Math.Angle.Between(
      shoulderX,
      shoulderY,
      worldPoint.x,
      worldPoint.y
    );

    this.aimAngle = angle;
    this.facing = worldPoint.x >= this.player.x ? 1 : -1;

    this.player.setFlipX(this.facing < 0);

    this.weapon.setPosition(
      shoulderX + Math.cos(angle) * 10,
      shoulderY + Math.sin(angle) * 10
    );
    this.weapon.setRotation(angle);
    this.weapon.setFlipY(this.facing < 0);
  }

  updateShooting(time) {
    if (!this.input.activePointer.isDown) {
      return;
    }
    if (time < this.nextShootTime) {
      return;
    }

    const spawnX = this.player.x + Math.cos(this.aimAngle) * 22;
    const spawnY = this.player.y - 14 + Math.sin(this.aimAngle) * 22;

    const bullet = this.bullets.get(spawnX, spawnY, "bullet");
    if (!bullet) {
      return;
    }

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setRotation(this.aimAngle);
    bullet.setDepth(18);
    bullet.body.allowGravity = false;
    bullet.body.setSize(8, 4, true);
    bullet.setCollideWorldBounds(false);
    bullet.spawnTime = time;

    const speed = 1040;
    this.physics.velocityFromRotation(this.aimAngle, speed, bullet.body.velocity);

    this.fx.emitParticleAt(spawnX, spawnY, 8);
    this.nextShootTime = time + this.shootCooldownMs;
  }

  updateBullets(time) {
    this.bullets.children.each((bullet) => {
      if (!bullet.active) {
        return;
      }

      if (
        time - bullet.spawnTime > 1400 ||
        bullet.x < -40 ||
        bullet.x > this.worldWidth + 40 ||
        bullet.y < -40 ||
        bullet.y > this.worldHeight + 40
      ) {
        this.destroyBullet(bullet, false);
      }
    });
  }

  destroyBullet(bullet, withImpactFx) {
    if (withImpactFx) {
      this.fx.emitParticleAt(bullet.x, bullet.y, 6);
    }

    bullet.body.stop();
    bullet.setActive(false);
    bullet.setVisible(false);
  }

  updateAnimation(moveDir, onGround) {
    if (!onGround) {
      if (this.player.texture.key !== "player_jump") {
        this.player.setTexture("player_jump");
      }
      return;
    }

    if (moveDir !== 0 && Math.abs(this.player.body.velocity.x) > 16) {
      this.player.anims.play("player_walk", true);
    } else if (this.player.texture.key !== "player_idle") {
      this.player.anims.stop();
      this.player.setTexture("player_idle");
    }
  }

  updateParallax() {
    const camX = this.cameras.main.scrollX;
    this.sky.tilePositionX = camX * 0.04;
    this.bgFar.tilePositionX = camX * 0.12;
    this.bgMid.tilePositionX = camX * 0.22;
    this.bgNear.tilePositionX = camX * 0.34;
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#081014",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1800 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [PlayScene]
};

new Phaser.Game(config);
