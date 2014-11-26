
var game = new Phaser.Game(800, 600, Phaser.AUTO, 'Projeto_game', {preload: preload, create: create, update: update, render: render});

var land;
var map;
var layer;
var player;
var currentSpeed = 0;
var cursors;
var bullets;
var fireRate = 100;
var nextFire = 0;
var facing = 'down';
var health = 3;
var alive = true;

//inimigos
var enemies;
var enemiesTotal = 0;
var enemiesAlive = 0;
var explosions;


function preload() {
    game.load.tilemap('map', 'textures/features.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('ground_1x1', 'textures/ground_1x1.png');
    game.load.image('earth', 'textures/earth.png');//textura do campo
    game.load.spritesheet('player', 'textures/players.png', 80, 80);
    game.load.image('bullet', 'textures/bullet.png');
    game.load.spritesheet('enemy', 'textures/players.png', 80, 80);
    game.load.spritesheet('kaboom', 'textures/explosion.png', 64, 64, 23);
}

function create() {
    // mapa
    game.world.setBounds(0, 0, 800, 600);
    land = game.add.tileSprite(0, 0, 800, 600, 'earth');
    land.fixedToCamera = true;
    map = game.add.tilemap('map');
    map.addTilesetImage('ground_1x1');
    map.setCollisionBetween(1, 12);
    layer = map.createLayer('Tile Layer 1');

    //inserir player com animação
    player = game.add.sprite(400, 300, 'player');
    player.anchor.setTo(0.5, 0.5);
    player.animations.add('down', [0, 1, 2, 3], 10, true);
    player.animations.add('left', [4, 5, 6, 7], 10, true);
    player.animations.add('right', [8, 9, 10, 11], 10, true);
    player.animations.add('up', [12, 13, 14, 15], 10, true);



    //  Isso vai forçá-lo a desacelerar e limitar sua velocidade
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.drag.set(0.2);
    player.body.maxVelocity.setTo(400, 400);
    player.body.collideWorldBounds = true;

    /*  tiros */
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(3, 'bullet', 0, false);//dispara 3 tiros por vez
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 0.5);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);




    explosions = game.add.group();
    for (var i = 0; i < 10; i++) {
        var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
        explosionAnimation.anchor.setTo(0.5, 0.5);
        explosionAnimation.animations.add('kaboom');
    }

    //inimigos
    enemies = [];
    enemiesTotal = 5;
    enemiesAlive = 5;

    

    for (var i = 0; i < enemiesTotal; i++) {
        enemies.push(new EnemyMonster(i, game, player, coordenada()));
    }


    //insere no topo
    player.bringToTop();
    cursors = game.input.keyboard.createCursorKeys();

}

function update() {

    game.physics.arcade.overlap(layer, bullets, bulletHitWall, null, this); //tiros não passam das paredes
    game.physics.arcade.collide(player, layer);

    //faz o player não ficar "flutuando"
    player.body.velocity.x = 0;
    player.body.velocity.y = 0;

    enemiesAlive = 0;


    for (var i = 0; i < enemies.length; i++) {


        if (enemies[i].alive) {
            enemiesAlive++;
            game.physics.arcade.overlap(enemies[i].monster, player, monsterAttack, null, this);
            game.physics.arcade.overlap(enemies[i].monster, bullets, bulletHitEnemy, null, this);
            game.physics.arcade.collide(enemies[i].monster, layer); //colisão entre inimigo e paredes
            enemies[i].update();
            
            //moveToXY(enemies[i], 400, 400,10);
        }
    }



    //movimentos do player
    if (cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.A)) {
        player.body.velocity.x = -150;
        if (facing !== 'left') {
            player.animations.play('left');
            facing = 'left';
        }
    }
    else if (cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D)) {
        player.body.velocity.x = 150;

        if (facing !== 'right') {
            player.animations.play('right');
            facing = 'right';
        }
    }
    else if (cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.W)) {
        player.body.velocity.y = -150;

        if (facing !== 'up') {
            player.animations.play('up');
            facing = 'up';
        }
    }
    else if (cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S)) {
        player.body.velocity.y = 150;

        if (facing !== 'down') {
            player.animations.play('down');
            facing = 'down';
        }
    } else {
        if (facing !== 'idle') {
            player.animations.stop();

            if (facing === 'left') {
                player.frame = 4;
            }
            else if (facing === 'right') {
                player.frame = 8;
            }
            else if (facing === 'down') {
                player.frame = 0;
            } else {
                player.frame = 12;
            }

            facing = 'idle';
        }
    }

    //player só atira se clicar no mouse e possuir vida
    if (game.input.activePointer.isDown && health > 0) {

        fire();
    }


   




}

//quando atira na parede o fogo não a ultrapassa
function bulletHitWall(bullet) {
    bullet.kill();
}


//destroi inimigo com tiro
function bulletHitEnemy(monster, bullet) {

    bullet.kill();
    var destroyed = enemies[monster.name].damage();
    if (destroyed) {
        var explosionAnimation = explosions.getFirstExists(false);
        explosionAnimation.reset(monster.x, monster.y);
        explosionAnimation.play('kaboom', 30, false, true);

    }
}

function monsterAttack(monster, player) {
    health -= 1;

    if (health <= 0) {
        alive = false;
        player.kill();
        var explosionAnimation = explosions.getFirstExists(false);
        explosionAnimation.reset(player.x, player.y);
        explosionAnimation.play('kaboom', 30, false, true);
    }
    var destroyed = enemies[monster.name].damage();
    if (destroyed) {
        var explosionAnimation = explosions.getFirstExists(false);
        explosionAnimation.reset(monster.x, monster.y);
        explosionAnimation.play('kaboom', 30, false, true);
    }

}


function fire() {
    if (game.time.now > nextFire && bullets.countDead() > 0) {
        nextFire = game.time.now + fireRate;
        var bullet = bullets.getFirstExists(false);
        bullet.reset(player.x, player.y);
        bullet.rotation = game.physics.arcade.moveToPointer(bullet, 1000, game.input.activePointer, 400);
    }
}

function render() {
    game.debug.text('Disparos: ' + bullets.countLiving() + ' / ' + bullets.length, 340, 592);
    game.debug.text('Enemies: ' + enemiesAlive + '/' + enemiesTotal, 260, 22);
    game.debug.text('Health: ' + health + '/' + 3, 430, 22);
}




function coordenada() {
    
    var enemyInitialCoordinate = new Object();

    var sorteio = Math.floor((Math.random() * 6) + 1);

    switch (sorteio) {
        case 1:
            //entrada esquerda
            enemyInitialCoordinate.x = -23;
            enemyInitialCoordinate.y = 300;
            break;
        case 2:
            //entrada direita
            enemyInitialCoordinate.x = 823;
            enemyInitialCoordinate.y = 300;
            break;
        case 3:
            //entrada superior esquerda
            enemyInitialCoordinate.x = 210;
            enemyInitialCoordinate.y = -25;
            break;
        case 4:
            //entrada superior direita
            enemyInitialCoordinate.x = 594;
            enemyInitialCoordinate.y = -25;
            break;
        case 5:
            //entrada inferior esquerda
            enemyInitialCoordinate.x = 210;
            enemyInitialCoordinate.y = 623;
            break;
        case 6:
            //entrada inferior direita
            enemyInitialCoordinate.x = 594;
            enemyInitialCoordinate.y = 623;
            break;
    }



    return enemyInitialCoordinate;
}