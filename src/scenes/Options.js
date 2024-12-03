export default class OptionsScene extends Phaser.Scene {
    constructor() {
        super('OptionsScene');
        // Load saved volumes or use defaults
        this.volumes = {
            music: parseFloat(localStorage.getItem('musicVolume')) || 0.8,
            sfx: parseFloat(localStorage.getItem('sfxVolume')) || 0.6
        };
    }

    create() {
        // Create background
        this.createBackground();

        // Title
        this.add.text(this.scale.width / 2, 80, 'Options', {
            fontSize: '48px',
            fontFamily: 'CustomPixelFont',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Create volume sliders
        this.createVolumeControls();

        // Back button
        this.createBackButton();

        // Apply current volumes on scene creation
        this.updateVolumes();
    }

    createBackground() {
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x1a1a1a)
            .setOrigin(0, 0);
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0x3a1a3a, 0x3a1a3a, 0x1a1a3a, 0x1a1a3a, 0.4);
        gradient.fillRect(0, 0, this.scale.width, this.scale.height);
    }

    createVolumeControls() {
        const startY = 200;
        const spacing = 100;

        // Music Volume
        this.createVolumeSlider(
            'Music Volume',
            startY,
            this.volumes.music,
            (value) => {
                this.volumes.music = value;
                localStorage.setItem('musicVolume', value.toString());
                this.updateVolumes();
            }
        );

        // SFX Volume
        this.createVolumeSlider(
            'Sound Effects',
            startY + spacing,
            this.volumes.sfx,
            (value) => {
                this.volumes.sfx = value;
                localStorage.setItem('sfxVolume', value.toString());
                this.updateVolumes();
            }
        );
    }

    createVolumeSlider(label, y, initialValue, onChange) {
        // Label
        this.add.text(this.scale.width / 2 - 200, y, label, {
            fontSize: '24px',
            fontFamily: 'CustomPixelFont',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        // Slider background
        const sliderWidth = 200;
        const sliderHeight = 10;
        const sliderX = this.scale.width / 2 + 50;

        const sliderBg = this.add.rectangle(
            sliderX,
            y,
            sliderWidth,
            sliderHeight,
            0x4a4a4a
        ).setOrigin(0, 0.5);

        // Slider fill
        const sliderFill = this.add.rectangle(
            sliderX,
            y,
            sliderWidth * initialValue,
            sliderHeight,
            0x6d28d9
        ).setOrigin(0, 0.5);

        // Slider handle
        const handle = this.add.rectangle(
            sliderX + (sliderWidth * initialValue),
            y,
            20,
            20,
            0x8b5cf6
        ).setOrigin(0.5)
            .setInteractive({ draggable: true });

        // Make slider interactive
        sliderBg.setInteractive();

        // Handle click on slider background
        sliderBg.on('pointerdown', (pointer) => {
            const value = (pointer.x - sliderX) / sliderWidth;
            this.updateSlider(handle, sliderFill, value, sliderX, sliderWidth);
            onChange(Math.max(0, Math.min(1, value)));
        });

        // Handle drag
        handle.on('drag', (pointer) => {
            const value = (pointer.x - sliderX) / sliderWidth;
            this.updateSlider(handle, sliderFill, value, sliderX, sliderWidth);
            onChange(Math.max(0, Math.min(1, value)));
        });
    }

    updateSlider(handle, fill, value, sliderX, sliderWidth) {
        const clampedValue = Math.max(0, Math.min(1, value));
        handle.x = sliderX + (sliderWidth * clampedValue);
        fill.width = sliderWidth * clampedValue;
    }

    createBackButton() {
        const backButton = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height - 100,
            200,
            50,
            0x4a1d96
        ).setInteractive();

        const backText = this.add.text(
            this.scale.width / 2,
            this.scale.height - 100,
            'Back',
            {
                fontSize: '24px',
                fontFamily: 'CustomPixelFont',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        backButton.on('pointerover', () => {
            backButton.setFillStyle(0x6d28d9);
            backText.setScale(1.1);
        });

        backButton.on('pointerout', () => {
            backButton.setFillStyle(0x4a1d96);
            backText.setScale(1);
        });

        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }

    updateVolumes() {
        // Update volumes for all active scenes
        const scenes = ['MainScene'];
        scenes.forEach(sceneName => {
            const scene = this.scene.get(sceneName);
            if (scene && scene.audio) {
                if (scene.audio.bgMusic) {
                    scene.audio.bgMusic.setVolume(this.volumes.music);
                }
                if (scene.audio.deathSound) {
                    scene.audio.deathSound.setVolume(this.volumes.sfx);
                }
            }
        });
    }
}