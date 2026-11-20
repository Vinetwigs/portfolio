class Portfolio {
    constructor() {
        this.windowManager = new WindowManager();
        this.currentSection = 'home';
        this.cursor = document.getElementById('custom-cursor');
        this.worksData = null;
        
        this.init();
    }
    
    init() {
        this.setupWelcome();
        this.setupMenu();
        this.setupStatusBar();
        this.setupCursor();
        this.setupThreeJS();
        
        setTimeout(() => {
            this.openSection('home');
        }, 1500);
        
        console.log('%c portfolio initialized ', 'background: #000; color: #ff0000; font-family: monospace;');
    }
    
    setupWelcome() {
        const overlay = document.getElementById('welcome-overlay');
        
        const enter = () => {
            if (overlay.classList.contains('hidden')) return;
            
            overlay.classList.add('hidden');
            
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 800);
        };
        
        overlay.addEventListener('click', enter);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                enter();
            }
        });
    }
    
    setupMenu() {
        const menuButtons = document.querySelectorAll('.menu-btn');
        
        menuButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                this.openSection(section);
                
                menuButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
    
    setupStatusBar() {
        const updateTime = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            document.getElementById('system-time').textContent = `${hours}:${minutes}`;
        };
        
        updateTime();
        setInterval(updateTime, 1000);
        
        document.getElementById('status-section').textContent = this.currentSection;
    }
    
    setupCursor() {
        document.addEventListener('mousemove', (e) => {
            this.cursor.style.left = e.clientX + 'px';
            this.cursor.style.top = e.clientY + 'px';
        });
        
        const addHoverEffect = (selector) => {
            document.querySelectorAll(selector).forEach(el => {
                el.addEventListener('mouseenter', () => this.cursor.classList.add('hover'));
                el.addEventListener('mouseleave', () => this.cursor.classList.remove('hover'));
            });
        };
        
        addHoverEffect('button, .window, .work-card, a, .menu-btn');
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        const items = node.querySelectorAll 
                            ? node.querySelectorAll('button, .work-card, a, .menu-btn')
                            : [];
                        items.forEach(el => {
                            el.addEventListener('mouseenter', () => this.cursor.classList.add('hover'));
                            el.addEventListener('mouseleave', () => this.cursor.classList.remove('hover'));
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    setupThreeJS() {
        window.addEventListener('sectionChange', (e) => {
            if (window.neuralEntity) {
                window.neuralEntity.setSection(e.detail);
            }
        });
    }
    
    openSection(section) {
        this.currentSection = section;
        
        document.getElementById('status-section').textContent = section;
        
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });
        
        window.dispatchEvent(new CustomEvent('sectionChange', { detail: section }));
        
        let content;
        let title;
        
        switch(section) {
            case 'home':
                content = SectionContent.home();
                title = 'home';
                break;
            case 'about':
                content = SectionContent.about();
                title = 'about';
                break;
            case 'works':
                content = SectionContent.works();
                title = 'works';
                break;
            case 'contact':
                content = SectionContent.contact();
                title = 'contact';
                break;
            default:
                content = SectionContent.home();
                title = 'home';
        }
        
        const existingWindow = this.windowManager.getWindow(section);
        if (existingWindow) {
            this.windowManager.focusWindow(section);
            return;
        }
        
        this.windowManager.createWindow({
            id: section,
            title: title,
            width: 700,
            height: 500,
            content: content,
            onClose: () => {
                const btn = document.querySelector(`.menu-btn[data-section="${section}"]`);
                if (btn) btn.classList.remove('active');
            }
        });
        
        setTimeout(() => this.attachWorkCardEvents(), 300);
    }
    
    attachWorkCardEvents() {
        // Work card clicks
        document.querySelectorAll('.work-card').forEach(card => {
            card.addEventListener('click', () => {
                const workId = card.dataset.workId;
                this.openWorkDetail(workId);
            });
            
            // Hover - preload first image
            card.addEventListener('mouseenter', () => {
                card.dataset.hovered = 'true';
            });
            
            card.addEventListener('mouseleave', () => {
                card.dataset.hovered = 'false';
            });
        });
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.filterWorks(filter);
            });
        });
    }
    
    filterWorks(filter) {
        const works = SectionContent.loadWorks();
        const filtered = filter === 'all' 
            ? works 
            : works.filter(w => (w.category || 'installation') === filter);
        
        const grid = document.querySelector('.works-grid');
        if (grid) {
            grid.style.opacity = '0';
            
            setTimeout(() => {
                grid.innerHTML = filtered.map(work => SectionContent.renderWorkCard(work)).join('');
                
                grid.style.opacity = '1';
                
                this.attachWorkCardEvents();
            }, 200);
        }
    }
    
    openWorkDetail(workId) {
        const existingWindow = this.windowManager.getWindow('work-' + workId);
        if (existingWindow) {
            this.windowManager.focusWindow('work-' + workId);
            return;
        }
        
        const works = SectionContent.loadWorks();
        const work = works.find(w => w.id === workId);
        
        if (!work) return;
        
        const content = SectionContent.workDetailContent(work);
        
        this.windowManager.createWindow({
            id: 'work-' + workId,
            title: (work.shortTitle || work.title).toLowerCase(),
            width: 800,
            height: 600,
            content: content,
            onClose: () => {}
        });
        
        setTimeout(() => this.attachWorkDetailEvents(), 300);
    }
    
    attachWorkDetailEvents() {
        // Close button
        document.querySelectorAll('.work-detail-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const windowEl = btn.closest('.window');
                if (windowEl) {
                    const windowId = windowEl.dataset.windowId;
                    this.windowManager.closeWindow(windowId);
                }
            });
        });
        
        // Vimeo lazy load
        document.querySelectorAll('.vimeo-play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const vimeoContainer = btn.closest('.work-detail-vimeo');
                const vimeoId = vimeoContainer.dataset.vimeoId;
                
                const iframe = document.createElement('iframe');
                iframe.src = `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`;
                iframe.allow = 'autoplay; fullscreen; picture-in-picture';
                iframe.allowFullscreen = true;
                iframe.loading = 'lazy';
                
                vimeoContainer.innerHTML = '';
                vimeoContainer.appendChild(iframe);
                vimeoContainer.classList.add('loaded');
            });
        });
    }
    
    closeWorkDetail() {
        const detail = document.querySelector('.work-detail');
        if (detail) {
            detail.classList.remove('active');
            setTimeout(() => detail.remove(), 400);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.portfolio = new Portfolio();
});
