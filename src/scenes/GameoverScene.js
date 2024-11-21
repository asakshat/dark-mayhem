export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.totalKills = data.totalKills || 0;
        this.wavesCompleted = data.wavesCompleted || 0;
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#000000');

        // Create container for centered content
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Game Over text
        this.add.text(centerX, centerY - 100, 'GAME OVER', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#ff0000',
            align: 'center'
        }).setOrigin(0.5);

        // Stats
        this.add.text(centerX, centerY, `Enemies Killed: ${this.totalKills}`, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(centerX, centerY + 50, `Waves Completed: ${this.wavesCompleted}`, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Retry button
        const retryButton = this.add.rectangle(
            centerX,
            centerY + 150,
            200,
            50,
            0x6666ff
        ).setInteractive();

        this.add.text(centerX, centerY + 150, 'Play Again', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Button interactions
        retryButton.on('pointerover', () => {
            retryButton.setFillStyle(0x8888ff);
        });

        retryButton.on('pointerout', () => {
            retryButton.setFillStyle(0x6666ff);
        });

        retryButton.on('pointerdown', () => {
            retryButton.setFillStyle(0x4444ff);
        });

        retryButton.on('pointerup', () => {
            this.scene.stop('MainScene');
            this.scene.stop('GameOverScene');

            this.scene.start('MainScene', { isRestart: true });
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.stop('MainScene');
            this.scene.stop('GameOverScene');
            this.scene.start('MainScene', { isRestart: true });
        });

        this.add.text(centerX, centerY + 220, 'Press SPACE or click button to play again', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#888888',
            align: 'center'
        }).setOrigin(0.5);
    }
    shutdown() {
        this.input.keyboard.removeAllListeners();
    }
}