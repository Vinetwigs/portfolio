class WindowManager {
    constructor() {
        this.container = document.getElementById('windows-container');
        this.template = document.getElementById('window-template');
        this.windows = new Map();
        this.activeWindow = null;
        this.zIndexCounter = 100;
        this.dragState = {
            window: null,
            startX: 0,
            startY: 0,
            offsetX: 0,
            offsetY: 0
        };
        this.resizeState = {
            window: null,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
        
        this.container.addEventListener('mousedown', (e) => {
            const windowEl = e.target.closest('.window');
            if (windowEl) {
                this.focusWindow(windowEl.dataset.windowId);
            }
        });
    }
    
    createWindow(options) {
        const {
            id,
            title = 'window',
            width = 600,
            height = 400,
            x = null,
            y = null,
            content = '',
            onClose = null
        } = options;
        
        if (this.windows.has(id)) {
            this.focusWindow(id);
            return this.windows.get(id).element;
        }
        
        const windowEl = this.template.content.cloneNode(true).querySelector('.window');
        
        windowEl.dataset.windowId = id;
        windowEl.style.width = width + 'px';
        windowEl.style.height = height + 'px';
        
        if (x !== null && y !== null) {
            windowEl.style.left = x + 'px';
            windowEl.style.top = y + 'px';
        } else {
            const offset = this.windows.size * 30;
            windowEl.style.left = (window.innerWidth / 2 - width / 2 + offset) + 'px';
            windowEl.style.top = (window.innerHeight / 2 - height / 2 + offset - 50) + 'px';
        }
        
        windowEl.querySelector('.window-title').textContent = title;
        windowEl.querySelector('.window-content').innerHTML = content;
        
        const header = windowEl.querySelector('.window-header');
        header.addEventListener('mousedown', (e) => this.startDrag(e, windowEl));
        
        const resizeHandle = windowEl.querySelector('.window-resize-handle');
        resizeHandle.addEventListener('mousedown', (e) => this.startResize(e, windowEl));
        
        const closeBtn = windowEl.querySelector('.window-btn.close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(id);
        });
        
        const maxBtn = windowEl.querySelector('.window-btn.maximize');
        maxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.maximizeWindow(id);
        });
        
        this.container.appendChild(windowEl);
        
        const windowData = {
            element: windowEl,
            title: title,
            sectionId: id,
            onClose: onClose,
            isMaximized: false,
            originalRect: null
        };
        
        this.windows.set(id, windowData);
        
        this.focusWindow(id);
        this.updateWindowCount();
        
        windowEl.style.opacity = '0';
        windowEl.style.transform = 'scale(0.95)';
        
        requestAnimationFrame(() => {
            windowEl.style.transition = 'opacity 0.3s, transform 0.3s';
            windowEl.style.opacity = '1';
            windowEl.style.transform = 'scale(1)';
        });
        
        return windowEl;
    }
    
    closeWindow(id) {
        const windowData = this.windows.get(id);
        if (!windowData) return;
        
        const windowEl = windowData.element;
        
        if (windowData.onClose) {
            windowData.onClose();
        }
        
        windowEl.style.transition = 'opacity 0.3s, transform 0.3s';
        windowEl.style.opacity = '0';
        windowEl.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            windowEl.remove();
            this.windows.delete(id);
            
            this.updateWindowCount();
            
            if (this.windows.size > 0) {
                const firstId = this.windows.keys().next().value;
                this.focusWindow(firstId);
            } else {
                // No windows left, reset status
                const sectionEl = document.getElementById('status-section');
                if (sectionEl) {
                    sectionEl.textContent = 'READY';
                }
            }
        }, 300);
    }
    
    updateWindowCount() {
        const countEl = document.getElementById('status-windows');
        if (countEl) {
            countEl.textContent = `windows: ${this.windows.size}`;
        }
    }
    
    maximizeWindow(id) {
        const windowData = this.windows.get(id);
        if (!windowData) return;
        
        const windowEl = windowData.element;
        
        if (windowData.isMaximized) {
            if (windowData.originalRect) {
                windowEl.style.left = windowData.originalRect.x + 'px';
                windowEl.style.top = windowData.originalRect.y + 'px';
                windowEl.style.width = windowData.originalRect.width + 'px';
                windowEl.style.height = windowData.originalRect.height + 'px';
            }
            windowData.isMaximized = false;
        } else {
            windowData.originalRect = {
                x: windowEl.offsetLeft,
                y: windowEl.offsetTop,
                width: windowEl.offsetWidth,
                height: windowEl.offsetHeight
            };
            
            const containerRect = this.container.getBoundingClientRect();
            windowEl.style.left = '0';
            windowEl.style.top = '0';
            windowEl.style.width = containerRect.width + 'px';
            windowEl.style.height = containerRect.height + 'px';
            windowData.isMaximized = true;
        }
    }
    
    focusWindow(id) {
        this.windows.forEach((data, wid) => {
            data.element.classList.remove('active');
        });
        
        const windowData = this.windows.get(id);
        if (windowData) {
            windowData.element.classList.add('active');
            this.activeWindow = id;
            
            // Update footer section text
            const sectionEl = document.getElementById('status-section');
            if (sectionEl) {
                sectionEl.textContent = windowData.title || id;
            }
            
            this.zIndexCounter++;
            windowData.element.style.zIndex = this.zIndexCounter;
        }
    }
    
    startDrag(e, windowEl) {
        if (e.target.closest('.window-btn')) return;
        
        const windowData = Array.from(this.windows.values()).find(w => w.element === windowEl);
        if (!windowData || windowData.isMaximized) return;
        
        this.dragState = {
            window: windowEl,
            startX: e.clientX,
            startY: e.clientY,
            offsetX: windowEl.offsetLeft,
            offsetY: windowEl.offsetTop
        };
        
        windowEl.classList.add('dragging');
    }
    
    startResize(e, windowEl) {
        e.stopPropagation();
        
        const windowData = Array.from(this.windows.values()).find(w => w.element === windowEl);
        if (!windowData || windowData.isMaximized) return;
        
        this.resizeState = {
            window: windowEl,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: windowEl.offsetWidth,
            startHeight: windowEl.offsetHeight
        };
    }
    
    handleMouseMove(e) {
        if (this.dragState.window) {
            const dx = e.clientX - this.dragState.startX;
            const dy = e.clientY - this.dragState.startY;
            
            let newLeft = this.dragState.offsetX + dx;
            let newTop = this.dragState.offsetY + dy;
            
            // Constrain to viewport
            const windowRect = this.dragState.window.getBoundingClientRect();
            const minX = -windowRect.width + 100;
            const maxX = window.innerWidth - 50;
            const minY = 10;
            const maxY = window.innerHeight - 50;
            
            newLeft = Math.max(minX, Math.min(maxX, newLeft));
            newTop = Math.max(minY, Math.min(maxY, newTop));
            
            this.dragState.window.style.left = newLeft + 'px';
            this.dragState.window.style.top = newTop + 'px';
        }
        
        if (this.resizeState.window) {
            const dx = e.clientX - this.resizeState.startX;
            const dy = e.clientY - this.resizeState.startY;
            
            const newWidth = Math.max(300, this.resizeState.startWidth + dx);
            const newHeight = Math.max(200, this.resizeState.startHeight + dy);
            
            this.resizeState.window.style.width = newWidth + 'px';
            this.resizeState.window.style.height = newHeight + 'px';
        }
    }
    
    handleMouseUp() {
        if (this.dragState.window) {
            this.dragState.window.classList.remove('dragging');
            this.dragState.window = null;
        }
        
        this.resizeState.window = null;
    }
    
    getWindow(id) {
        return this.windows.get(id);
    }
    
    updateWindowContent(id, content) {
        const windowData = this.windows.get(id);
        if (windowData) {
            windowData.element.querySelector('.window-content').innerHTML = content;
        }
    }
}
