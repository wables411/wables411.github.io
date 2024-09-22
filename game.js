document.createElement = (function(create) {
  return function() {
    var element = create.apply(this, arguments);
    if (element.tagName.toLowerCase() === 'canvas') {
      element.setAttribute('willreadfrequently', '');
    }
    return element;
  };
})(document.createElement);

const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    canvas: document.createElement('canvas'),
    canvasStyle: 'willReadFrequently',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game;
let player;
let emojis;
let score = 0;
let scoreText;
let timeLeft = 120; // 2 minutes
let timeText;
let background;
let isGameOver = true;
let startButton;

function startGame() {
    if (!game) {
        game = new Phaser.Game(config);
    }
}

function preload() {
    this.load.image('lawb', 'images/69lawbster.png');
    this.load.image('emoji', 'images/clownemoji.png');
    this.load.image('background', 'images/oceanfloor.gif');
}

function create() {
    background = this.add.image(400, 300, 'background');
    background.setDisplaySize(config.width, config.height);

    player = this.physics.add.sprite(400, 550, 'lawb');
    player.setCollideWorldBounds(true);
    player.setVisible(false);
    
    emojis = this.physics.add.group();
    
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFF' });
    timeText = this.add.text(16, 56, 'Time: 2:00', { fontSize: '32px', fill: '#FFF' });
    
    scoreText.setVisible(false);
    timeText.setVisible(false);

    startButton = this.add.text(400, 300, 'Start Game', { fontSize: '48px', fill: '#00FF00' })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            startButton.setVisible(false);
            startGameplay.call(this);
        });

    this.input.on('pointermove', function (pointer) {
        if (!isGameOver) {
            player.x = Phaser.Math.Clamp(pointer.x, player.width / 2, config.width - player.width / 2);
        }
    }, this);
}

function startGameplay() {
    isGameOver = false;
    player.setVisible(true);
    scoreText.setVisible(true);
    timeText.setVisible(true);
    score = 0;
    timeLeft = 120;
    scoreText.setText('Score: 0');
    timeText.setText('Time: 2:00');

    this.time.addEvent({ delay: 1000, callback: updateTimer, callbackScope: this, loop: true });
    this.time.addEvent({ delay: 1500, callback: spawnEmoji, callbackScope: this, loop: true });
}

function update() {
    if (!isGameOver) {
        this.physics.overlap(player, emojis, collectEmoji, null, this);
    }
}

function spawnEmoji() {
    if (!isGameOver) {
        const x = Phaser.Math.Between(0, 800);
        const emoji = emojis.create(x, 0, 'emoji');
        emoji.setBounce(0.7);
        emoji.setCollideWorldBounds(true);
        emoji.setVelocity(Phaser.Math.Between(-100, 100), 20);
        
        this.time.addEvent({
            delay: 10000, // 10 seconds
            callback: () => {
                if (emoji.active) {
                    emoji.destroy();
                }
            },
            loop: false
        });
    }
}

function collectEmoji(player, emoji) {
    emoji.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);
}

function updateTimer() {
    if (!isGameOver) {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timeText.setText(`Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        
        if (timeLeft <= 0) {
            gameOver.call(this);
        }
    }
}

function gameOver() {
    isGameOver = true;
    this.physics.pause();
    
    emojis.children.entries.forEach(emoji => {
        emoji.setVelocity(0, 0);
    });
    
    const gameOverText = this.add.text(400, 250, 'Game Over', { fontSize: '64px', fill: '#FF0000' }).setOrigin(0.5);
    const scoreDisplay = this.add.text(400, 320, `Final Score: ${score}`, { fontSize: '32px', fill: '#FFFFFF' }).setOrigin(0.5);
    
    const restartButton = this.add.text(400, 400, 'Restart Game', { fontSize: '32px', fill: '#00FF00' })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.scene.restart();
        });
}

startGame();
