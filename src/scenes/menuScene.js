export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // Setup background with a dark gradient
        this.createBackground();

        // Create logo/title section
        this.createTitle();

        // Create main menu buttons
        this.createButtons();

        // Create footer text
        this.createFooter();
    }

    createBackground() {
        // Darker background for contrast
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x1a1a1a)
            .setOrigin(0, 0);

        // Add subtle gradient overlay
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0x3a1a3a, 0x3a1a3a, 0x1a1a3a, 0x1a1a3a, 0.4);
        gradient.fillRect(0, 0, this.scale.width, this.scale.height);
    }

    createTitle() {
        // Main title with shadow
        const title = this.add.text(this.scale.width / 2, 120, 'Dark Mayhem', {
            fontSize: '72px',
            fontFamily: 'CustomPixelFont',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add purple glow effect
        title.setStroke('#6b21a8', 8);
        title.setShadow(2, 2, '#2e1065', 2, true, true);

        // Subtitle
        this.add.text(this.scale.width / 2, 200, 'Into the Endless Night', {
            fontSize: '24px',
            fontFamily: 'CustomPixelFont',
            color: '#9ca3af',
            align: 'center'
        }).setOrigin(0.5);
    }

    createButtons() {
        const buttonStyle = {
            fontSize: '24px',
            fontFamily: 'CustomPixelFont',
            color: '#ffffff',
            align: 'center'
        };

        const buttons = [
            { text: 'Start Game', scene: 'MainScene' },
            { text: 'Options', callback: () => this.showOptions() },
            { text: 'Credits', callback: () => this.showCredits() }
        ];

        buttons.forEach((button, index) => {
            const y = 300 + (index * 80);

            // Button background
            const bg = this.add.rectangle(
                this.scale.width / 2,
                y,
                300,
                60,
                0x4a1d96
            ).setInteractive();

            // Button text
            const text = this.add.text(
                this.scale.width / 2,
                y,
                button.text,
                buttonStyle
            ).setOrigin(0.5);

            // Hover effects
            bg.on('pointerover', () => {
                bg.setFillStyle(0x6d28d9);
                text.setScale(1.1);
            });

            bg.on('pointerout', () => {
                bg.setFillStyle(0x4a1d96);
                text.setScale(1);
            });

            bg.on('pointerdown', () => {
                if (button.scene) {
                    this.scene.start(button.scene);
                } else if (button.callback) {
                    button.callback();
                }
            });
        });
    }

    createFooter() {
        this.add.text(this.scale.width / 2, this.scale.height - 40,
            'Press SPACE to Start', {
            fontSize: '18px',
            fontFamily: 'CustomPixelFont',
            color: '#9ca3af'
        }).setOrigin(0.5);

        // Add keyboard control
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('MainScene');
        });
    }
}