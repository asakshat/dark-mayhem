import UIManager from "../UImanager";
export default class MenuScene extends Phaser.Scene {
    constructor(scene) {
        super('MenuScene');

    }


    create() {
        // Initialize UI Manager
        this.uiManager = new UIManager();

        // Update UI with menu state
        this.uiManager.updateUI({
            currentScene: 'MenuScene',
            onStartGame: () => {
                this.scene.start('MainScene');
            }
        });

    }

    shutdown() {
        if (this.uiManager) {
            this.uiManager.destroy();
        }
    }
}