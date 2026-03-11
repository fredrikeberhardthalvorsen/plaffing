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
    this.playerBulletGravity = 760;
    this.enemyBulletGravity = 860;

    this.weaponHeatMax = 100;
    this.weaponHeatPerShot = 6;
    this.weaponHeatCoolPerMs = 0.018;
    this.weaponHeatCoolOverheatedPerMs = 0.055;
    this.weaponOverheatLockMs = 1700;

    this.grenadeCooldownMs = 1900;
    this.grenadeFuseMs = 1100;
    this.grenadeMinSpeed = 250;
    this.grenadeSpeed = 760;
    this.grenadeChargeMaxMs = 900;
    this.grenadeBlastRadius = 150;
    this.grenadeShockwaveRadius = 210;
    this.grenadeMaxDamage = 4;
    this.grenadePlayerMaxDamage = 24;

    this.playerMaxHealth = 100;
    this.playerInvulnMs = 560;
    this.enemyContactDamage = 18;
    this.enemyBulletDamage = 12;
    this.enemyShootRange = 560;

    this.comboWindowMs = 2600;
    this.comboMilestoneInterval = 5;
    this.comboMilestoneShake = 0.0036;

    this.skyTwinkleSpeed = 0.0019;
    this.driftCloudCount = 8;
    this.driftCloudSpeedMin = 8;
    this.driftCloudSpeedMax = 24;
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
    this.createGameState();
    this.createCombat();
    this.createEnemies();
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
    this.makeEnemyBulletTexture();
    this.makeGrenadeTexture();
    this.makeGunTexture();
    this.makeEnemyTexture();
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

  makeEnemyBulletTexture() {
    const canvas = this.textures.createCanvas("enemy_bullet", 10, 4);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "#ffccd0";
    ctx.fillRect(3, 1, 5, 2);
    ctx.fillStyle = "#ff6b74";
    ctx.fillRect(8, 1, 2, 2);
    ctx.fillStyle = "#8d1b23";
    ctx.fillRect(0, 1, 3, 2);

    canvas.refresh();
  }

  makeGrenadeTexture() {
    const canvas = this.textures.createCanvas("grenade", 8, 8);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "#48525b";
    ctx.fillRect(1, 2, 6, 5);
    ctx.fillStyle = "#7f8b96";
    ctx.fillRect(2, 3, 4, 3);
    ctx.fillStyle = "#d8a44b";
    ctx.fillRect(3, 0, 2, 2);
    ctx.fillStyle = "#f1dc75";
    ctx.fillRect(3, 1, 2, 1);

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

  makeEnemyTexture() {
    const w = 20;
    const h = 28;
    const canvas = this.textures.createCanvas("enemy", w, h);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;

    const px = (x, y, pw, ph, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, pw, ph);
    };

    ctx.clearRect(0, 0, w, h);

    px(7, 2, 6, 4, "#8a9196");
    px(6, 6, 8, 2, "#c2cad1");

    px(4, 8, 12, 8, "#5f666d");
    px(5, 9, 10, 1, "#8f989f");
    px(4, 16, 12, 2, "#454b52");

    px(4, 10, 2, 6, "#727b83");
    px(14, 10, 2, 6, "#727b83");

    px(6, 18, 3, 8, "#2e3237");
    px(11, 18, 3, 8, "#2e3237");
    px(6, 26, 3, 2, "#4e545b");
    px(11, 26, 3, 2, "#4e545b");

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
    this.makeStarFieldTexture("stars_far", 120, 0.55);
    this.makeStarFieldTexture("stars_near", 70, 0.9);
    this.makeCloudLayerTexture("clouds_far", "#d6eee7", "#aacfc4", 8, 0.28);
    this.makeCloudLayerTexture("clouds_near", "#e8f4f0", "#b8dbd1", 11, 0.4);
    this.makeCloudChunkTexture();
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

    this.starsFar = this.add
      .tileSprite(
        0,
        0,
        this.cameras.main.width,
        this.cameras.main.height,
        "stars_far"
      )
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-38);

    this.starsNear = this.add
      .tileSprite(
        0,
        0,
        this.cameras.main.width,
        this.cameras.main.height,
        "stars_near"
      )
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-36)
      .setAlpha(0.8);

    this.cloudsFar = this.add
      .tileSprite(
        0,
        this.groundY - 520,
        this.worldWidth,
        190,
        "clouds_far"
      )
      .setOrigin(0, 1)
      .setDepth(-34)
      .setAlpha(0.5);

    this.cloudsNear = this.add
      .tileSprite(
        0,
        this.groundY - 480,
        this.worldWidth,
        230,
        "clouds_near"
      )
      .setOrigin(0, 1)
      .setDepth(-32)
      .setAlpha(0.66);

    this.createDriftClouds();

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

  makeCloudChunkTexture() {
    const w = 104;
    const h = 48;
    const canvas = this.textures.createCanvas("cloud_chunk", w, h);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, w, h);

    const puff = (x, y, pw, ph) => {
      ctx.fillStyle = "#a4ccc0";
      ctx.fillRect(x, y + 2, pw, ph);
      ctx.fillStyle = "#e8f4f1";
      ctx.fillRect(x + 1, y, pw - 2, ph - 2);
    };

    puff(8, 18, 24, 13);
    puff(24, 11, 28, 16);
    puff(46, 8, 30, 17);
    puff(70, 14, 24, 14);
    ctx.fillStyle = "#a4ccc0";
    ctx.fillRect(16, 29, 68, 6);
    ctx.fillStyle = "#e8f4f1";
    ctx.fillRect(18, 28, 64, 3);

    canvas.refresh();
  }

  makeStarFieldTexture(key, starCount, brightnessScale) {
    const w = 512;
    const h = 256;
    const canvas = this.textures.createCanvas(key, w, h);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < starCount; i += 1) {
      const x = Phaser.Math.Between(0, w - 1);
      const y = Phaser.Math.Between(0, h - 1);
      const size = Phaser.Math.Between(1, 2);
      const base = Phaser.Math.Between(180, 255);
      const b = Math.round(base * brightnessScale);
      ctx.fillStyle = `rgb(${b},${b},${b + Phaser.Math.Between(0, 15)})`;
      ctx.fillRect(x, y, size, 1);

      if (Phaser.Math.Between(0, 100) > 80) {
        ctx.fillStyle = `rgba(255,255,255,${0.16 * brightnessScale})`;
        ctx.fillRect(x - 1, y, size + 2, 1);
      }
    }

    canvas.refresh();
  }

  makeCloudLayerTexture(key, brightColor, shadeColor, cloudCount, hazeAlpha) {
    const w = 512;
    const h = 180;
    const canvas = this.textures.createCanvas(key, w, h);
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < cloudCount; i += 1) {
      const puffW = Phaser.Math.Between(24, 42);
      const puffH = Phaser.Math.Between(8, 14);
      const x = Phaser.Math.Between(-20, w - 12);
      const y = Phaser.Math.Between(18, h - 48);
      const puffs = Phaser.Math.Between(3, 5);

      for (let p = 0; p < puffs; p += 1) {
        const px = x + p * Phaser.Math.Between(10, 16);
        const py = y + Phaser.Math.Between(-3, 3);
        const pw = puffW + Phaser.Math.Between(-8, 8);
        const ph = puffH + Phaser.Math.Between(-2, 3);

        ctx.fillStyle = shadeColor;
        ctx.fillRect(px, py + 2, pw, ph);
        ctx.fillStyle = brightColor;
        ctx.fillRect(px + 1, py, pw - 2, ph - 2);
      }

      const flatWidth = puffW * puffs - 2;
      ctx.fillStyle = shadeColor;
      ctx.fillRect(x + 5, y + puffH + 2, flatWidth, 4);
      ctx.fillStyle = brightColor;
      ctx.fillRect(x + 6, y + puffH + 1, flatWidth - 2, 2);
    }

    ctx.fillStyle = `rgba(195, 230, 220, ${hazeAlpha})`;
    ctx.fillRect(0, h - 28, w, 28);

    canvas.refresh();
  }

  createDriftClouds() {
    this.driftClouds = [];
    for (let i = 0; i < this.driftCloudCount; i += 1) {
      const scrollFactor = Phaser.Math.FloatBetween(0.17, 0.31);
      const cloud = this.add
        .image(
          Phaser.Math.Between(0, this.worldWidth),
          Phaser.Math.Between(this.groundY - 700, this.groundY - 470),
          "cloud_chunk"
        )
        .setScrollFactor(scrollFactor)
        .setDepth(-33)
        .setAlpha(Phaser.Math.FloatBetween(0.35, 0.62))
        .setScale(Phaser.Math.FloatBetween(1.1, 2.2));

      cloud.cloudSpeed = Phaser.Math.FloatBetween(
        this.driftCloudSpeedMin,
        this.driftCloudSpeedMax
      );
      this.driftClouds.push(cloud);
    }
  }

  updateDriftClouds(delta) {
    const cam = this.cameras.main;
    const dt = delta / 1000;
    const margin = 180;

    for (let i = 0; i < this.driftClouds.length; i += 1) {
      const cloud = this.driftClouds[i];
      cloud.x += cloud.cloudSpeed * dt;

      const sx = cloud.x - cam.scrollX * cloud.scrollFactorX;
      const halfW = (cloud.width * cloud.scaleX) * 0.5;
      if (sx - halfW > cam.width + margin) {
        cloud.x = cam.scrollX * cloud.scrollFactorX - margin - halfW;
        cloud.y = Phaser.Math.Between(this.groundY - 700, this.groundY - 460);
        cloud.cloudSpeed = Phaser.Math.FloatBetween(
          this.driftCloudSpeedMin,
          this.driftCloudSpeedMax
        );
      }
    }
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

  yFromGround(height) {
    return this.groundY - Math.round(height * 0.72);
  }

  createLevel() {
    this.platforms = this.physics.add.staticGroup();

    const addTiles = (startX, y, count) => {
      for (let i = 0; i < count; i += 1) {
        this.platforms.create(startX + i * 48 + 24, y, "tile_stone");
      }
    };

    for (let x = 0; x < this.worldWidth; x += 48 * 8) {
      addTiles(x, this.groundY, 8);
    }

    addTiles(320, this.yFromGround(150), 3);
    addTiles(620, this.yFromGround(240), 4);
    addTiles(1040, this.yFromGround(320), 3);
    addTiles(1420, this.yFromGround(210), 4);
    addTiles(1840, this.yFromGround(280), 3);
    addTiles(2140, this.yFromGround(390), 3);
    addTiles(2460, this.yFromGround(180), 5);
    addTiles(2860, this.yFromGround(260), 3);
    addTiles(3220, this.yFromGround(340), 4);
    addTiles(3650, this.yFromGround(240), 4);
    addTiles(4020, this.yFromGround(310), 3);
    addTiles(4360, this.yFromGround(190), 5);
    addTiles(4780, this.yFromGround(280), 3);
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

  createGameState() {
    this.playerHealth = this.playerMaxHealth;
    this.score = 0;
    this.isPlayerDead = false;
    this.nextPlayerDamageTime = 0;

    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.comboExpiresAt = 0;
  }

  createCombat() {
    this.bullets = this.physics.add.group({
      defaultKey: "bullet",
      maxSize: 400
    });

    this.enemyBullets = this.physics.add.group({
      defaultKey: "enemy_bullet",
      maxSize: 260
    });

    this.grenades = this.physics.add.group({
      defaultKey: "grenade",
      maxSize: 36
    });

    this.nextShootTime = 0;
    this.weaponHeat = 0;
    this.weaponOverheatedUntil = 0;
    this.nextGrenadeTime = 0;
    this.isChargingGrenade = false;
    this.grenadeChargeStartTime = 0;
    this.grenadeChargeRatio = 0;
    this.wasRightButtonDown = false;

    this.fx = this.add.particles(0, 0, "px", {
      speed: { min: 60, max: 260 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.8, end: 0 },
      lifespan: { min: 80, max: 180 },
      quantity: 0,
      blendMode: "ADD"
    });
    this.fx.setDepth(30);

    this.enemyShotFx = this.add.particles(0, 0, "px", {
      speed: { min: 30, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.4, end: 0 },
      lifespan: { min: 70, max: 140 },
      quantity: 0,
      tint: [0xff8b96, 0xff4e58]
    });
    this.enemyShotFx.setDepth(30);

    this.enemyExplosionFx = this.add.particles(0, 0, "px", {
      speed: { min: 120, max: 360 },
      angle: { min: 0, max: 360 },
      scale: { start: 2.6, end: 0 },
      lifespan: { min: 180, max: 300 },
      quantity: 0,
      tint: [0xffd28a, 0xff7a3d, 0xf44336],
      blendMode: "ADD"
    });
    this.enemyExplosionFx.setDepth(40);

    this.grenadeExplosionFx = this.add.particles(0, 0, "px", {
      speed: { min: 130, max: 430 },
      angle: { min: 0, max: 360 },
      scale: { start: 2.8, end: 0 },
      lifespan: { min: 240, max: 380 },
      quantity: 0,
      tint: [0xffefb5, 0xffbf69, 0xff7f3f],
      blendMode: "ADD"
    });
    this.grenadeExplosionFx.setDepth(45);

    this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
      if (!bullet.active) {
        return;
      }
      this.destroyBullet(bullet, true);
    });

    this.physics.add.collider(this.enemyBullets, this.platforms, (bullet) => {
      if (!bullet.active) {
        return;
      }
      this.destroyEnemyBullet(bullet, true);
    });

    this.physics.add.collider(this.grenades, this.platforms, (grenade) => {
      if (grenade.active && grenade.body.speed > 120) {
        this.fx.emitParticleAt(grenade.x, grenade.y, 2);
      }
    });
  }

  createEnemies() {
    this.enemies = this.physics.add.group({ maxSize: 80 });

    const spawnData = [
      { x: 520, height: 150 },
      { x: 760, height: 240 },
      { x: 1070, height: 320 },
      { x: 1500, height: 210 },
      { x: 1880, height: 280 },
      { x: 2230, height: 390 },
      { x: 2520, height: 180 },
      { x: 2950, height: 260 },
      { x: 3310, height: 340 },
      { x: 3720, height: 240 },
      { x: 4100, height: 310 },
      { x: 4470, height: 190 },
      { x: 4870, height: 280 },
      { x: 910, height: 0 },
      { x: 1760, height: 0 },
      { x: 2740, height: 0 },
      { x: 3560, height: 0 },
      { x: 4620, height: 0 }
    ];

    spawnData.forEach((spawn) => this.spawnEnemy(spawn.x, spawn.height));

    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.grenades, this.enemies);

    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      this.handlePlayerBulletEnemy,
      null,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.enemyBullets,
      this.handleEnemyBulletPlayer,
      null,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerTouchEnemy,
      null,
      this
    );
  }

  spawnEnemy(x, height) {
    const y = height > 0 ? this.yFromGround(height) - 38 : this.groundY - 38;
    const enemy = this.enemies.create(x, y, "enemy");
    if (!enemy) {
      return;
    }

    enemy.setCollideWorldBounds(true);
    enemy.setDragX(900);
    enemy.setMaxVelocity(240, 1000);

    enemy.body.setSize(12, 24);
    enemy.body.setOffset(4, 2);

    const armor = Phaser.Math.Between(1, 10);
    const scale = Phaser.Math.Linear(1.7, 2.25, (armor - 1) / 9);

    enemy.maxArmor = armor;
    enemy.armor = armor;
    enemy.baseSpeed = Phaser.Math.Between(65, 120);
    enemy.anchorX = x;
    enemy.patrolRange = Phaser.Math.Between(80, 190);
    enemy.direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    enemy.shootCooldownMs = Phaser.Math.Between(950, 1700);
    enemy.nextShotTime = this.time.now + Phaser.Math.Between(400, 1300);
    enemy.touchDamage = this.enemyContactDamage;

    enemy.setScale(scale);
    enemy.setTint(this.getEnemyTint(enemy.armor));

    enemy.armorText = this.add
      .text(enemy.x, enemy.y - 38, `${enemy.armor}`, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#f3fbff",
        stroke: "#1a1012",
        strokeThickness: 3
      })
      .setOrigin(0.5)
      .setDepth(26);
  }

  getEnemyTint(armor) {
    const clamped = Phaser.Math.Clamp(armor, 1, 10);
    const t = (clamped - 1) / 9;
    const r = Math.round(105 + 145 * t);
    const g = Math.round(225 - 145 * t);
    const b = Math.round(110 - 70 * t);
    return (r << 16) | (g << 8) | b;
  }

  createUi() {
    this.hudText = this.add
      .text(14, 12, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#e6fff2",
        lineSpacing: 5,
        padding: { x: 8, y: 6 },
        backgroundColor: "rgba(8,20,22,0.5)"
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.helpText = this.add
      .text(
        14,
        102,
        "WASD / Arrow keys to move\nSpace, W or Up to jump (double jump)\nMouse to aim, hold LMB to shoot\nHold RMB to charge grenade, release to throw\nR to restart after death",
        {
          fontFamily: "monospace",
          fontSize: "15px",
          color: "#e6fff2",
          lineSpacing: 6,
          padding: { x: 8, y: 6 },
          backgroundColor: "rgba(8,20,22,0.45)"
        }
      )
      .setScrollFactor(0)
      .setDepth(1000);

    this.deathText = this.add
      .text(this.scale.width * 0.5, this.scale.height * 0.42, "YOU DIED\nPress R to restart", {
        fontFamily: "monospace",
        fontSize: "44px",
        align: "center",
        color: "#ffb3b3",
        stroke: "#2c0d11",
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1200)
      .setVisible(false);

    this.comboPopup = this.add
      .text(this.scale.width * 0.5, 72, "", {
        fontFamily: "monospace",
        fontSize: "26px",
        color: "#ffe8a8",
        stroke: "#2c1e0c",
        strokeThickness: 6
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1150)
      .setVisible(false);

    this.grenadeChargeText = this.add
      .text(14, 202, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffe5b4",
        padding: { x: 8, y: 5 },
        backgroundColor: "rgba(26,16,8,0.55)"
      })
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);

    this.grenadeChargeBar = this.add.graphics().setScrollFactor(0).setDepth(1000);

    this.updateUi();
  }

  createInput() {
    if (this.input.mouse) {
      this.input.mouse.disableContextMenu();
    }

    this.keys = this.input.keyboard.addKeys({
      leftA: Phaser.Input.Keyboard.KeyCodes.A,
      rightD: Phaser.Input.Keyboard.KeyCodes.D,
      leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
      rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      jumpSpace: Phaser.Input.Keyboard.KeyCodes.SPACE,
      jumpW: Phaser.Input.Keyboard.KeyCodes.W,
      jumpUp: Phaser.Input.Keyboard.KeyCodes.UP,
      restartR: Phaser.Input.Keyboard.KeyCodes.R
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
    this.updateParallax(time, delta);

    if (this.isPlayerDead) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.restartR)) {
        this.scene.restart();
      }
      return;
    }

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

    this.updateWeaponHeat(time, delta);
    this.updateAimAndWeapon();
    this.updateShooting(time);
    this.updateGrenadeThrowing(time);
    this.updateEnemies(time);
    this.updateBullets(time);
    this.updateEnemyBullets(time);
    this.updateGrenades(time);
    this.updateComboState(time);
    this.updateAnimation(moveDir, onGround);
    this.updateGrenadeChargeIndicator(time);
    this.updateUi(time);
  }

  updateComboState(time) {
    if (this.comboCount > 0 && time >= this.comboExpiresAt) {
      this.resetCombo();
      this.updateUi(time);
    }
  }

  getComboMultiplierForCount(count) {
    return 1 + Math.floor(count / 3) * 0.25;
  }

  formatComboMultiplier(value = this.comboMultiplier) {
    return value.toFixed(2).replace(/\.00$/, "").replace(/0$/, "");
  }

  registerComboKill(time) {
    this.comboCount += 1;
    this.comboMultiplier = this.getComboMultiplierForCount(this.comboCount);
    this.comboExpiresAt = time + this.comboWindowMs;

    if (
      this.comboCount >= this.comboMilestoneInterval &&
      this.comboCount % this.comboMilestoneInterval === 0
    ) {
      this.cameras.main.shake(120, this.comboMilestoneShake);
    }

    if (this.comboCount >= 2) {
      this.showComboPopup();
    }
  }

  resetCombo() {
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.comboExpiresAt = 0;
  }

  showComboPopup() {
    this.tweens.killTweensOf(this.comboPopup);
    this.comboPopup.setText(
      `COMBO x${this.formatComboMultiplier()}  (${this.comboCount})`
    );
    this.comboPopup.setPosition(this.scale.width * 0.5, 72);
    this.comboPopup.setScale(1);
    this.comboPopup.setAlpha(1);
    this.comboPopup.setVisible(true);

    this.tweens.add({
      targets: this.comboPopup,
      y: 54,
      alpha: 0,
      scale: 1.15,
      duration: 420,
      ease: "Cubic.Out",
      onComplete: () => {
        this.comboPopup.setVisible(false);
      }
    });
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
    const pointer = this.input.activePointer;
    if (time < this.weaponOverheatedUntil) {
      return;
    }
    if (!pointer.leftButtonDown()) {
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

    bullet.enableBody(true, spawnX, spawnY, true, true);
    bullet.setRotation(this.aimAngle);
    bullet.setDepth(18);
    bullet.body.allowGravity = true;
    bullet.setGravityY(this.playerBulletGravity - this.physics.world.gravity.y);
    bullet.body.setSize(8, 4, true);
    bullet.setCollideWorldBounds(false);
    bullet.spawnTime = time;

    const speed = 1040;
    this.physics.velocityFromRotation(this.aimAngle, speed, bullet.body.velocity);

    this.fx.emitParticleAt(spawnX, spawnY, 8);

    this.weaponHeat = Math.min(this.weaponHeatMax, this.weaponHeat + this.weaponHeatPerShot);
    if (this.weaponHeat >= this.weaponHeatMax) {
      this.weaponOverheatedUntil = time + this.weaponOverheatLockMs;
      this.fx.emitParticleAt(spawnX, spawnY, 12);
      this.nextShootTime = this.weaponOverheatedUntil;
      return;
    }

    this.nextShootTime = time + this.shootCooldownMs;
  }

  updateWeaponHeat(time, delta) {
    const coolRate =
      time < this.weaponOverheatedUntil
        ? this.weaponHeatCoolOverheatedPerMs
        : this.weaponHeatCoolPerMs;
    this.weaponHeat = Math.max(0, this.weaponHeat - delta * coolRate);
  }

  updateGrenadeThrowing(time) {
    const pointer = this.input.activePointer;
    const rightDown = pointer.rightButtonDown();
    if (rightDown && !this.wasRightButtonDown) {
      this.startGrenadeCharge(time);
    } else if (!rightDown && this.wasRightButtonDown) {
      this.releaseGrenadeThrow(time);
    }
    this.wasRightButtonDown = rightDown;

    if (this.isChargingGrenade) {
      this.grenadeChargeRatio = this.getGrenadeChargeRatio(time);
    }
  }

  startGrenadeCharge(time) {
    if (this.isPlayerDead || time < this.nextGrenadeTime) {
      return;
    }

    this.isChargingGrenade = true;
    this.grenadeChargeStartTime = time;
    this.grenadeChargeRatio = 0;
  }

  releaseGrenadeThrow(time) {
    if (!this.isChargingGrenade) {
      return;
    }

    const chargeRatio = this.getGrenadeChargeRatio(time);
    this.isChargingGrenade = false;
    this.grenadeChargeRatio = 0;
    this.throwGrenade(time, chargeRatio);
  }

  getGrenadeChargeRatio(time) {
    if (!this.isChargingGrenade) {
      return 0;
    }

    return Phaser.Math.Clamp(
      (time - this.grenadeChargeStartTime) / this.grenadeChargeMaxMs,
      0,
      1
    );
  }

  throwGrenade(time, chargeRatio = 1) {
    if (time < this.nextGrenadeTime) {
      return;
    }

    const spawnX = this.player.x + Math.cos(this.aimAngle) * 18;
    const spawnY = this.player.y - 14 + Math.sin(this.aimAngle) * 18;
    const launchAngle = Phaser.Math.Clamp(this.aimAngle, -2.45, 0.6);

    const grenade = this.grenades.get(spawnX, spawnY, "grenade");
    if (!grenade) {
      return;
    }

    grenade.enableBody(true, spawnX, spawnY, true, true);
    grenade.setDepth(19);
    grenade.setRotation(launchAngle);
    grenade.body.allowGravity = true;
    grenade.body.setCircle(4, 0, 0);
    grenade.setCollideWorldBounds(false);
    grenade.setBounce(0.45, 0.28);
    grenade.spawnTime = time;
    grenade.detonateAt = time + this.grenadeFuseMs;

    const launchSpeed = Phaser.Math.Linear(
      this.grenadeMinSpeed,
      this.grenadeSpeed,
      Phaser.Math.Clamp(chargeRatio, 0, 1)
    );
    const liftBoost = Phaser.Math.Linear(95, 170, Phaser.Math.Clamp(chargeRatio, 0, 1));
    this.physics.velocityFromRotation(launchAngle, launchSpeed, grenade.body.velocity);
    grenade.body.velocity.y -= liftBoost;

    this.fx.emitParticleAt(spawnX, spawnY, 5);
    this.nextGrenadeTime = time + this.grenadeCooldownMs;
  }

  updateGrenadeChargeIndicator(time = this.time.now) {
    this.grenadeChargeBar.clear();

    if (!this.isChargingGrenade || this.isPlayerDead) {
      this.grenadeChargeText.setVisible(false);
      return;
    }

    const charge = this.getGrenadeChargeRatio(time);
    const percent = Math.round(charge * 100);
    const x = 14;
    const y = 230;
    const width = 240;
    const height = 18;
    const fillWidth = Math.max(2, (width - 6) * charge);
    const fillColor = charge >= 0.995 ? 0xffde7a : 0xffa45c;

    this.grenadeChargeText.setVisible(true);
    this.grenadeChargeText.setText(`Grenade Charge: ${percent}%`);

    this.grenadeChargeBar.fillStyle(0x081012, 0.7);
    this.grenadeChargeBar.fillRect(x, y, width, height);
    this.grenadeChargeBar.lineStyle(2, 0xb6d7d9, 0.85);
    this.grenadeChargeBar.strokeRect(x, y, width, height);
    this.grenadeChargeBar.fillStyle(fillColor, 0.95);
    this.grenadeChargeBar.fillRect(x + 3, y + 3, fillWidth, height - 6);
  }

  updateEnemies(time) {
    this.enemies.children.each((enemy) => {
      if (!enemy.active) {
        return;
      }

      if (enemy.armorText) {
        enemy.armorText.setPosition(enemy.x, enemy.y - 38);
      }

      if (enemy.body.blocked.left) {
        enemy.direction = 1;
      } else if (enemy.body.blocked.right) {
        enemy.direction = -1;
      }

      if (enemy.x < enemy.anchorX - enemy.patrolRange) {
        enemy.direction = 1;
      } else if (enemy.x > enemy.anchorX + enemy.patrolRange) {
        enemy.direction = -1;
      }

      enemy.setVelocityX(enemy.direction * enemy.baseSpeed);
      enemy.setFlipX(enemy.direction < 0);

      const dx = this.player.x - enemy.x;
      const dy = this.player.y - 12 - enemy.y;
      const inRange = Math.abs(dx) <= this.enemyShootRange && Math.abs(dy) <= 220;
      if (inRange && time >= enemy.nextShotTime) {
        this.enemyShoot(enemy, time);
      }
    });
  }

  enemyShoot(enemy, time) {
    if (!enemy.active) {
      return;
    }

    const angle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y - 10,
      this.player.x,
      this.player.y - 14
    );

    const spawnX = enemy.x + Math.cos(angle) * 18;
    const spawnY = enemy.y - 10 + Math.sin(angle) * 18;

    const bullet = this.enemyBullets.get(spawnX, spawnY, "enemy_bullet");
    if (!bullet) {
      return;
    }

    bullet.enableBody(true, spawnX, spawnY, true, true);
    bullet.setDepth(18);
    bullet.setRotation(angle);
    bullet.body.allowGravity = true;
    bullet.setGravityY(this.enemyBulletGravity - this.physics.world.gravity.y);
    bullet.body.setSize(8, 4, true);
    bullet.setCollideWorldBounds(false);
    bullet.spawnTime = time;

    const speed = 520;
    this.physics.velocityFromRotation(angle, speed, bullet.body.velocity);

    this.enemyShotFx.emitParticleAt(spawnX, spawnY, 5);
    enemy.nextShotTime = time + enemy.shootCooldownMs + Phaser.Math.Between(-150, 220);
  }

  updateBullets(time) {
    this.bullets.children.each((bullet) => {
      if (!bullet.active) {
        return;
      }

      if (bullet.body.speed > 2) {
        bullet.setRotation(Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x));
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

  updateEnemyBullets(time) {
    this.enemyBullets.children.each((bullet) => {
      if (!bullet.active) {
        return;
      }

      if (bullet.body.speed > 2) {
        bullet.setRotation(Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x));
      }

      if (
        time - bullet.spawnTime > 2200 ||
        bullet.x < -40 ||
        bullet.x > this.worldWidth + 40 ||
        bullet.y < -40 ||
        bullet.y > this.worldHeight + 40
      ) {
        this.destroyEnemyBullet(bullet, false);
      }
    });
  }

  updateGrenades(time) {
    this.grenades.children.each((grenade) => {
      if (!grenade.active) {
        return;
      }

      grenade.setRotation(grenade.rotation + grenade.body.velocity.x * 0.0009);

      if (time >= grenade.detonateAt) {
        this.explodeGrenade(grenade);
        return;
      }

      if (
        grenade.x < -80 ||
        grenade.x > this.worldWidth + 80 ||
        grenade.y < -80 ||
        grenade.y > this.worldHeight + 80
      ) {
        this.destroyGrenade(grenade);
      }
    });
  }

  destroyBullet(bullet, withImpactFx) {
    if (withImpactFx) {
      this.fx.emitParticleAt(bullet.x, bullet.y, 6);
    }

    bullet.disableBody(true, true);
  }

  destroyEnemyBullet(bullet, withImpactFx) {
    if (withImpactFx) {
      this.enemyShotFx.emitParticleAt(bullet.x, bullet.y, 4);
    }

    bullet.disableBody(true, true);
  }

  destroyGrenade(grenade) {
    grenade.disableBody(true, true);
  }

  explodeGrenade(grenade) {
    if (!grenade.active) {
      return;
    }

    const x = grenade.x;
    const y = grenade.y;
    this.destroyGrenade(grenade);

    this.grenadeExplosionFx.emitParticleAt(x, y, 34);
    this.showShockwave(x, y);

    this.enemies.children.each((enemy) => {
      if (!enemy.active) {
        return;
      }

      const ex = enemy.x;
      const ey = enemy.y - 10;
      const dx = ex - x;
      const dy = ey - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.grenadeShockwaveRadius) {
        const shockFalloff = 1 - distance / this.grenadeShockwaveRadius;
        const norm = distance > 0.001 ? distance : 1;
        const nx = dx / norm;
        const ny = dy / norm;
        const force = Phaser.Math.Linear(90, 420, shockFalloff);
        this.applyEnemyImpact(enemy, nx * force, ny * force - 140 * shockFalloff);
      }

      if (distance <= this.grenadeBlastRadius) {
        const blastFalloff = 1 - distance / this.grenadeBlastRadius;
        const damage = Math.max(1, Math.round(this.grenadeMaxDamage * blastFalloff));
        this.damageEnemy(enemy, damage);
      }
    });

    if (!this.isPlayerDead) {
      const px = this.player.x;
      const py = this.player.y - 14;
      const dx = px - x;
      const dy = py - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.grenadeShockwaveRadius) {
        const shockFalloff = 1 - distance / this.grenadeShockwaveRadius;
        const norm = distance > 0.001 ? distance : 1;
        const nx = dx / norm;
        const ny = dy / norm;
        const force = Phaser.Math.Linear(120, 470, shockFalloff);

        this.player.setVelocity(
          Phaser.Math.Clamp(this.player.body.velocity.x + nx * force, -620, 620),
          Phaser.Math.Clamp(this.player.body.velocity.y + ny * force - 150 * shockFalloff, -980, 980)
        );
      }

      if (distance <= this.grenadeBlastRadius) {
        const blastFalloff = 1 - distance / this.grenadeBlastRadius;
        const damage = Math.max(3, Math.round(this.grenadePlayerMaxDamage * blastFalloff));
        this.applyPlayerDamage(damage);
      }
    }
  }

  showShockwave(x, y) {
    const ring = this.add
      .circle(x, y, 8, 0xffefbf, 0.25)
      .setStrokeStyle(2, 0xfff6d3, 0.85)
      .setDepth(44);

    this.tweens.add({
      targets: ring,
      radius: this.grenadeShockwaveRadius,
      alpha: 0,
      duration: 260,
      ease: "Quad.Out",
      onComplete: () => {
        ring.destroy();
      }
    });
  }

  handlePlayerBulletEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.active) {
      return;
    }

    const impactDirection = Math.sign(bullet.body.velocity.x) || 1;
    this.destroyBullet(bullet, true);
    this.applyEnemyImpact(enemy, impactDirection * 130, -28);
    this.damageEnemy(enemy, 1);
  }

  applyEnemyImpact(enemy, impulseX, impulseY) {
    if (!enemy.active) {
      return;
    }

    const vx = Phaser.Math.Clamp(enemy.body.velocity.x + impulseX, -420, 420);
    const vy = Phaser.Math.Clamp(enemy.body.velocity.y + impulseY, -900, 780);
    enemy.setVelocity(vx, vy);
  }

  damageEnemy(enemy, amount) {
    if (!enemy.active) {
      return;
    }

    enemy.armor -= amount;

    if (enemy.armorText) {
      enemy.armorText.setText(`${Math.max(0, enemy.armor)}`);
    }

    enemy.setTintFill(0xffffff);
    this.time.delayedCall(50, () => {
      if (enemy.active) {
        enemy.clearTint();
        enemy.setTint(this.getEnemyTint(Math.max(1, enemy.armor)));
      }
    });

    if (enemy.armor <= 0) {
      this.killEnemy(enemy);
    }
  }

  killEnemy(enemy) {
    if (!enemy.active) {
      return;
    }

    this.enemyExplosionFx.emitParticleAt(enemy.x, enemy.y - 10, 24 + enemy.maxArmor * 2);

    if (enemy.armorText) {
      enemy.armorText.destroy();
      enemy.armorText = null;
    }

    this.registerComboKill(this.time.now);
    const points = Math.round(enemy.maxArmor * 10 * this.comboMultiplier);
    this.score += points;
    this.updateUi();
    enemy.disableBody(true, true);
  }

  handleEnemyBulletPlayer(player, bullet) {
    if (!bullet.active || this.isPlayerDead) {
      return;
    }

    const pushDirection = Math.sign(player.x - bullet.x) || 1;
    this.destroyEnemyBullet(bullet, true);
    player.setVelocityX(pushDirection * 240);
    this.applyPlayerDamage(this.enemyBulletDamage);
  }

  handlePlayerTouchEnemy(player, enemy) {
    if (!enemy.active || this.isPlayerDead) {
      return;
    }

    const pushDirection = Math.sign(player.x - enemy.x) || 1;
    player.setVelocityX(pushDirection * 330);
    this.applyPlayerDamage(enemy.touchDamage);
  }

  applyPlayerDamage(amount) {
    if (this.isPlayerDead) {
      return;
    }

    const now = this.time.now;
    if (now < this.nextPlayerDamageTime) {
      return;
    }

    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.nextPlayerDamageTime = now + this.playerInvulnMs;
    this.resetCombo();

    this.player.setTintFill(0xff7b7b);
    this.time.delayedCall(90, () => {
      if (!this.isPlayerDead) {
        this.player.clearTint();
      }
    });

    this.updateUi();

    if (this.playerHealth <= 0) {
      this.handlePlayerDeath();
    }
  }

  handlePlayerDeath() {
    if (this.isPlayerDead) {
      return;
    }

    this.isPlayerDead = true;
    this.isChargingGrenade = false;
    this.grenadeChargeRatio = 0;
    this.playerHealth = 0;
    this.player.clearTint();
    this.player.setTint(0x6d0f18);
    this.player.setVelocity(0, 0);
    this.player.setAcceleration(0, 0);
    this.player.body.enable = false;
    this.weapon.setVisible(false);
    this.deathText.setVisible(true);
    this.updateGrenadeChargeIndicator();
    this.updateUi();
  }

  updateUi(time = this.time.now) {
    const statusText = this.isPlayerDead ? "DEAD" : "ALIVE";
    const overheatRemaining = Math.max(0, this.weaponOverheatedUntil - time);
    const weaponText =
      overheatRemaining > 0
        ? `OVERHEATED ${((overheatRemaining / 1000) | 0) + 1}s`
        : `Heat ${Math.round(this.weaponHeat)}%`;
    const grenadeRemaining = Math.max(0, this.nextGrenadeTime - time);
    const grenadeText = this.isChargingGrenade
      ? `CHARGING ${Math.round(this.getGrenadeChargeRatio(time) * 100)}%`
      : grenadeRemaining > 0
        ? `${(grenadeRemaining / 1000).toFixed(1)}s`
        : "READY";

    const comboRemaining = Math.max(0, this.comboExpiresAt - time);
    const comboText =
      this.comboCount > 0
        ? `x${this.formatComboMultiplier()} (${this.comboCount}) ${(
            comboRemaining / 1000
          ).toFixed(1)}s`
        : "x1";

    this.hudText.setText(
      `Health: ${this.playerHealth}/${this.playerMaxHealth}\nScore: ${this.score}\nCombo: ${comboText}\nStatus: ${statusText}\nWeapon: ${weaponText}\nGrenade: ${grenadeText}`
    );

    this.hudText.setColor(this.comboCount > 0 ? "#fff2c7" : "#e6fff2");
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

  updateParallax(time, delta) {
    const camX = this.cameras.main.scrollX;
    const camY = this.cameras.main.scrollY;
    const twinkle = Math.sin(time * this.skyTwinkleSpeed);
    this.sky.tilePositionX = camX * 0.04;
    this.sky.tilePositionY = camY * 0.02;
    this.sky.alpha = 0.98 + twinkle * 0.02;
    this.starsFar.tilePositionX = camX * 0.02;
    this.starsFar.tilePositionY = camY * 0.01;
    this.starsFar.alpha = 0.56 + twinkle * 0.05;
    this.starsNear.tilePositionX = camX * 0.035;
    this.starsNear.tilePositionY = camY * 0.02;
    this.starsNear.alpha = 0.74 + Math.sin(time * (this.skyTwinkleSpeed * 1.7)) * 0.13;
    this.cloudsFar.tilePositionX = camX * 0.08;
    this.cloudsFar.tilePositionY = Math.sin(time * 0.00012) * 2;
    this.cloudsNear.tilePositionX = camX * 0.14;
    this.cloudsNear.tilePositionY = Math.cos(time * 0.00016) * 2;
    this.bgFar.tilePositionX = camX * 0.12;
    this.bgMid.tilePositionX = camX * 0.22;
    this.bgNear.tilePositionX = camX * 0.34;

    this.updateDriftClouds(delta);
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
