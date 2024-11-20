// UIManager.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import StatusBar from './GameUI/StatusBars';
import MenuScreen from './GameUI/MenuScreen';

class UIManager {
    constructor() {
        // Create container for React UI
        this.container = document.createElement('div');
        this.container.id = 'game-ui';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        this.container.style.zIndex = '100';
        document.body.appendChild(this.container);

        // Initialize React root
        this.root = createRoot(this.container);
    }

    updateUI(gameState) {
        const isMenuScene = gameState.currentScene === 'MenuScene';

        // If we're in menu scene, container should accept pointer events
        this.container.style.pointerEvents = isMenuScene ? 'auto' : 'none';

        this.root.render(
            React.createElement(
                React.Fragment,
                null,
                [
                    !isMenuScene && React.createElement(StatusBar, {
                        key: 'status-bar',
                        player: gameState.player,
                        totalEnemiesKilled: gameState.totalEnemiesKilled
                    }),
                    isMenuScene && React.createElement(MenuScreen, {
                        key: 'menu-screen',
                        visible: true,
                        onStartGame: () => {
                            // Clean up menu scene before starting main scene
                            if (gameState.onStartGame) {
                                this.destroy();
                                gameState.onStartGame();
                            }
                        }
                    })
                ].filter(Boolean)
            )
        );
    }

    destroy() {
        this.root.render(null);
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

export default UIManager;