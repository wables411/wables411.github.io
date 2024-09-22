const config = {
       type: Phaser.AUTO,
       width: 800,
       height: 600,
       parent: 'game-container',
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

   const game = new Phaser.Game(config);

   let player;
   let emojis;
   let cursors;
   let score = 0;
   let scoreText;
   let timeLeft = 120; // 2 minutes
   let timeText;

   function preload() {
       this.load.image('background', 'images/lawbocean1.gif');
       this.load.image('lawb', 'images/69lawbster.png');
       this.load.image('emoji', 'images/clownemoji.png');
   }

   function create() {
       this.add.image(400, 300, 'background');

       player = this.physics.add.sprite(400, 550, 'lawb');
       player.setCollideWorldBounds(true);

       emojis = this.physics.add.group();

       cursors = this.input.keyboard.createCursorKeys();

       scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
       timeText = this.add.text(16, 56, 'Time: 2:00', { fontSize: '32px', fill: '#000' });

       this.time.addEvent({ delay: 1000, callback: updateTimer, callbackScope: this, loop: true });
       this.time.addEvent({ delay: 1500, callback: spawnEmoji, callbackScope: this, loop: true });
   }

   function update() {
       if (cursors.left.isDown) {
           player.setVelocityX(-160);
       } else if (cursors.right.isDown) {
           player.setVelocityX(160);
       } else {
           player.setVelocityX(0);
       }

       this.physics.overlap(player, emojis, collectEmoji, null, this);
   }

   function spawnEmoji() {
       const x = Phaser.Math.Between(0, 800);
       const emoji = emojis.create(x, 0, 'emoji');
       emoji.setBounce(1);
       emoji.setCollideWorldBounds(true);
       emoji.setVelocity(Phaser.Math.Between(-200, 200), 20);
   }

   function collectEmoji(player, emoji) {
       emoji.disableBody(true, true);
       score += 10;
       scoreText.setText('Score: ' + score);
   }

   function updateTimer() {
       timeLeft--;
       const minutes = Math.floor(timeLeft / 60);
       const seconds = timeLeft % 60;
       timeText.setText(`Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);

       if (timeLeft <= 0) {
           this.physics.pause();
           this.add.text(400, 300, 'Game Over', { fontSize: '64px', fill: '#000' }).setOrigin(0.5);
       }
   }
