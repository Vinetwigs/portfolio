const WORKS_DATA = [
    {
        "id": "01",
        "title": "Echo Chamber",
        "year": "2025",
        "category": "installation",
        "description": "An interactive sound installation exploring the relationship between physical space and digital presence. Visitors' movements generate audio feedback loops, creating a constantly evolving sonic environment that responds to human presence.",
        "images": [
            "assets/echo-chamber-01.jpg",
            "assets/echo-chamber-02.jpg"
        ],
        "vimeo": "123456789"
    },
    {
        "id": "02",
        "title": "Data Decay",
        "year": "2024",
        "category": "generative",
        "description": "A visual exploration of digital entropy. Raw data streams are transformed into decaying visual patterns, questioning the permanence of our digital memories and the inevitable degradation of information over time.",
        "images": [
            "assets/data-decay-01.jpg",
            "assets/data-decay-02.jpg",
            "assets/data-decay-03.jpg"
        ],
        "vimeo": "987654321"
    },
    {
        "id": "03",
        "title": "Neural Path",
        "year": "2024",
        "category": "generative",
        "description": "Generative artwork created through machine learning processes. The piece visualizes neural network decision-making as abstract geometric forms, bridging the gap between artificial cognition and artistic expression.",
        "images": [
            "assets/neural-path-01.jpg",
            "assets/neural-path-02.jpg"
        ],
        "vimeo": "456789123"
    },
    {
        "id": "04",
        "title": "Void Protocol",
        "year": "2023",
        "category": "installation",
        "description": "Immersive projection mapping installation. The work transforms architectural spaces into living digital entities, where walls breathe and surfaces react to observer attention.",
        "images": [
            "assets/void-protocol-01.jpg",
            "assets/void-protocol-02.jpg",
            "assets/void-protocol-03.jpg",
            "assets/void-protocol-04.jpg"
        ],
        "vimeo": "321654987"
    },
    {
        "id": "05",
        "title": "Signal Lost",
        "year": "2023",
        "category": "sound",
        "description": "Radio frequency interference transformed into visual art. The piece captures and visualizes the invisible electromagnetic noise that permeates our environment, revealing the hidden data landscape of modern existence.",
        "images": [
            "assets/signal-lost-01.jpg",
            "assets/signal-lost-02.jpg"
        ],
        "vimeo": "741852963"
    }
];

class SectionContent {
    static home() {
        return `
            <div class="window-home">
                <h1 class="artist-name">vino</h1>
                <p class="tagline">creating digital experiences at the intersection of art and technology</p>
                <p style="margin-top: 2rem; font-size: 0.8rem; color: var(--red-dim);">
                    click on menu items above to explore
                </p>
            </div>
        `;
    }
    
    static about() {
        return `
            <div class="about-content">
                <div class="about-section">
                    <h3>profile</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">name</span>
                            <span class="info-value">vino</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">role</span>
                            <span class="info-value">new media artist</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">location</span>
                            <span class="info-value">turin, italy</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">active since</span>
                            <span class="info-value">2022</span>
                        </div>
                    </div>
                </div>
                
                <div class="about-section">
                    <h3>biography</h3>
                    <p>
                        i am a new media artist exploring the boundaries between physical and digital realms. 
                        my work investigates themes of memory, identity, and the transformation of human experience 
                        through technological mediation.
                    </p>
                    <p style="margin-top: 1rem;">
                        through installations, generative art, and interactive experiences, i create spaces where 
                        viewers become participants in an ongoing dialogue about our relationship with technology.
                    </p>
                </div>
                
                <div class="about-section">
                    <h3>exhibitions</h3>
                    <p>
                        <strong>2024</strong> — "digital shadows", museum of modern art, berlin<br>
                        <strong>2023</strong> — "neural pathways", tate modern, london<br>
                        <strong>2023</strong> — "data flows", moma ps1, new york<br>
                        <strong>2022</strong> — "void space", centre pompidou, paris
                    </p>
                </div>
                
                <div class="about-section">
                    <h3>skills</h3>
                    <p>
                        creative coding • generative art • installation • vr/ar • 
                        machine learning • projection mapping • sound design
                    </p>
                </div>
            </div>
        `;
    }
    
    static works() {
        return this.renderWorks(WORKS_DATA);
    }
    
    static loadWorks() {
        return WORKS_DATA;
    }
    
    static renderWorks(works) {
        const categories = [...new Set(works.map(w => w.category || 'all'))];
        
        let html = `
            <div class="works-filters">
                <button class="filter-btn active" data-filter="all">all</button>
                ${categories.map(cat => `
                    <button class="filter-btn" data-filter="${cat}">${cat}</button>
                `).join('')}
            </div>
            <div class="works-grid">
        `;
        
        works.forEach((work) => {
            const imgSrc = work.images && work.images.length > 0 
                ? work.images[0] 
                : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect fill="%23000" width="320" height="180"/><text x="50%" y="50%" fill="%23ff0000" text-anchor="middle" dy=".3em" font-family="monospace">no image</text></svg>';
            
            html += `
                <div class="work-card" data-work-id="${work.id}">
                    <div class="work-card-image">
                        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${imgSrc}" alt="${work.title}" loading="lazy">
                    </div>
                    <div class="work-card-title">${work.title}</div>
                    <div class="work-card-meta">
                        <span>${work.year}</span>
                        <span>${work.category || 'installation'}</span>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        return html;
    }
    
    static workDetailContent(work) {
        let html = '';
        
        if (work.images && work.images.length > 0) {
            html += `<div class="work-detail-images">`;
            work.images.forEach(img => {
                html += `<img src="${img}" alt="${work.title}" loading="lazy">`;
            });
            html += `</div>`;
        }
        
        if (work.description) {
            html += `<p class="work-detail-description">${work.description}</p>`;
        }
        
        if (work.vimeo) {
            html += `
                <div class="work-detail-vimeo" data-vimeo-id="${work.vimeo}">
                    <div class="vimeo-placeholder">
                        <button class="vimeo-play-btn" aria-label="Play video">
                            <span class="play-icon">▶</span>
                            <span class="play-text">play video</span>
                        </button>
                    </div>
                </div>
            `;
        }
        
        return html;
    }
    
    static workDetail(work) {
        let html = `
            <div class="work-detail active" data-work="${work.id}">
                <div class="work-detail-content">
                    <div class="work-detail-header">
                        <h2 class="work-detail-title">${work.title} (${work.year})</h2>
                        <button class="work-detail-close" aria-label="Close">×</button>
                    </div>
                    <div class="work-detail-body">
        `;
        
        if (work.images && work.images.length > 0) {
            html += `<div class="work-detail-images">`;
            work.images.forEach(img => {
                html += `<img src="${img}" alt="${work.title}" loading="lazy">`;
            });
            html += `</div>`;
        }
        
        if (work.description) {
            html += `<p class="work-detail-description">${work.description}</p>`;
        }
        
        if (work.vimeo) {
            html += `
                <div class="work-detail-vimeo" data-vimeo-id="${work.vimeo}">
                    <div class="vimeo-placeholder">
                        <button class="vimeo-play-btn" aria-label="Play video">
                            <span class="play-icon">▶</span>
                            <span class="play-text">play video</span>
                        </button>
                    </div>
                </div>
            `;
        }
        
        html += `
                    </div>
                </div>
            </div>
        `;
        
        return html;
    }
    
    static contact() {
        return `
            <div class="contact-content">
                <div class="about-section">
                    <h3>get in touch</h3>
                    <p>
                        available for commissions, collaborations, and exhibitions.
                        open to discussing new projects and creative ideas.
                    </p>
                </div>
                
                <div class="contact-item">
                    <span class="contact-icon">@</span>
                    <a href="mailto:vinopuntoexeo@gmail.com" class="contact-link">vinopuntoexe@gmail.com</a>
                </div>
                
                <div class="contact-item">
                    <span class="contact-icon">◈</span>
                    <span>from naples, currently based in turin, italy</span>
                </div>
                
                <div class="about-section">
                    <h3>social</h3>
                    <div class="social-links">
                        <button class="social-btn" aria-label="Instagram">ig</button>
                        <button class="social-btn" aria-label="Twitter">x</button>
                        <button class="social-btn" aria-label="Vimeo">vi</button>
                        <button class="social-btn" aria-label="GitHub">gh</button>
                    </div>
                </div>
                
                <div class="about-section">
                    <h3>press</h3>
                    <p style="font-size: 0.8rem; color: var(--red-dim);">
                        for press inquiries, please contact:<br>
                        vinopuntoexe@gmail.com
                    </p>
                </div>
            </div>
        `;
    }
}
