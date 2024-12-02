export default class LevelUpScene extends Phaser.Scene {
    constructor() {
        super('LevelUpScene');
    }

    init(data) {
        this.mainScene = data.mainScene;
        this.player = data.player;
        this.spellProgress = data.spellProgress;
    }

    create() {
        // Pause main scene but keep it visible
        this.mainScene.scene.pause();
        this.mainScene.pauseGameSystems();
        this.mainScene.time.timeScale = 0;

        // Semi-transparent dark overlay
        this.createOverlay();

        // Create level up container
        this.createLevelUpUI();
    }

    createOverlay() {
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
            .setOrigin(0)
            .setDepth(100);
    }

    createLevelUpUI() {
        // Position container at the top with more padding for header
        const container = this.add.container(this.scale.width / 2, 30);
        container.setDepth(101);

        // Create header
        const header = this.createHeader();
        container.add(header);

        // Create upgrade options with increased spacing from header
        const options = this.spellProgress.getUpgradeOptions();
        const cards = this.createUpgradeCards(options);
        // Increase space between header and cards (was 80, now 120)
        cards.setPosition(0, 120);
        container.add(cards);

        // Add "Continue" button after cards
        const continueButton = this.createContinueButton();
        // Position button below cards with spacing
        continueButton.setPosition(0, 120 + (options.length * 90) + 20);
        container.add(continueButton);
    }

    createHeader() {
        const headerContainer = this.add.container(0, 0);

        // Level up text position adjusted
        const levelText = this.add.text(0, 0, 'LEVEL UP!', {
            fontSize: '36px',
            fontFamily: 'CustomPixelFont',
            color: '#fef3c7'
        }).setOrigin(0.5);

        levelText.setStroke('#b45309', 4);
        levelText.setShadow(2, 2, '#92400e', 2, true, true);

        // Level number position adjusted (was 40, now 50)
        const levelNumber = this.add.text(0, 50, `Level ${this.player.level}`, {
            fontSize: '20px',
            fontFamily: 'CustomPixelFont',
            color: '#fef3c7'
        }).setOrigin(0.5);

        headerContainer.add([levelText, levelNumber]);
        return headerContainer;
    }
    createUpgradeCards(options) {
        const cardsContainer = this.add.container(0, 80);

        options.forEach((option, index) => {
            const card = this.createUpgradeCard(option, index);
            // Reduced spacing between cards
            card.setPosition(0, index * 90);
            cardsContainer.add(card);
        });

        return cardsContainer;
    }

    createUpgradeCard(option, index) {
        const cardContainer = this.add.container(0, 0);

        // Smaller card dimensions
        const cardWidth = 350;
        const cardHeight = 100;
        const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x2d1b69)
            .setStrokeStyle(2, 0x4c1d95)
            .setInteractive();

        const content = this.add.container(0, 0);

        // Adjusted icon size and position
        const icon = this.add.text(
            -cardWidth / 2 + 15,
            -cardHeight / 2 + 10,
            option.spell.icon,
            {
                fontSize: '24px',
                fontFamily: 'CustomPixelFont'
            }
        );

        // Adjusted name position and size
        const name = this.add.text(
            -cardWidth / 2 + 50,
            -cardHeight / 2 + 12,
            option.spell.name,
            {
                fontSize: '20px',
                fontFamily: 'CustomPixelFont',
                color: '#ffffff'
            }
        );

        // Adjusted description text
        const desc = this.add.text(
            -cardWidth / 2 + 15,
            -cardHeight / 2 + 40,
            option.description,
            {
                fontSize: '14px',
                fontFamily: 'CustomPixelFont',
                color: '#9ca3af',
                wordWrap: { width: cardWidth - 30 }
            }
        );

        content.add([icon, name, desc]);
        cardContainer.add([bg, content]);

        // Hover effects remain the same
        bg.on('pointerover', () => {
            bg.setFillStyle(0x4c1d95);
            content.setScale(1.02);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x2d1b69);
            content.setScale(1);
        });

        bg.on('pointerdown', () => {
            this.handleUpgradeSelection(option);
        });

        return cardContainer;
    }


    createContinueButton() {
        const button = this.add.container(0, 0);

        // Smaller button
        const buttonWidth = 150;
        const buttonHeight = 40;
        const bg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x4c1d95)
            .setInteractive();

        const text = this.add.text(0, 0, 'Continue', {
            fontSize: '18px',
            fontFamily: 'CustomPixelFont',
            color: '#ffffff'
        }).setOrigin(0.5);

        button.add([bg, text]);

        bg.on('pointerover', () => bg.setFillStyle(0x6d28d9));
        bg.on('pointerout', () => bg.setFillStyle(0x4c1d95));
        bg.on('pointerdown', () => this.resumeGame());

        return button;
    }

    handleUpgradeSelection(option) {
        if (option.type === 'new') {
            this.spellProgress.addNewSpell(option.spell.id);
        } else {
            this.spellProgress.upgradeSpell(option.spellId);
        }
        this.resumeGame();
    }

    resumeGame() {
        // Resume all game systems
        this.mainScene.resumeGameSystems();
        // Reset timeScale back to normal
        this.mainScene.time.timeScale = 1;
        // Resume the main scene
        this.mainScene.scene.resume();
        this.scene.stop();
    }
}