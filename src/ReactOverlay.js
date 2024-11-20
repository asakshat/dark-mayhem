import React from 'react';
import { createRoot } from 'react-dom/client';

class ReactOverlay {
    constructor() {
        // Create container for React components
        this.container = document.createElement('div');
        this.container.id = 'react-overlay';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none'; // Let clicks pass through to canvas
        document.body.appendChild(this.container);

        // Initialize React root
        this.root = createRoot(this.container);
    }

    // Method to render React components
    render(component) {
        this.root.render(component);
    }
}

export default ReactOverlay;