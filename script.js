/* =========================================================================
   3M STUDIO — CORE APPLICATION ENGINE (Vanilla ES6+)
   ========================================================================= */

// =========================================================================
// 1. STATE MANAGER (Centralized LocalStorage Sync)
// =========================================================================
class StateManager {
    constructor() {
        this.prefix = '3m_studio_';
        this.initDefaults();
    }

    initDefaults() {
        if (!this.get('theme')) this.set('theme', 'dark');
        if (!this.get('recent_searches')) this.set('recent_searches', []);
        if (!this.get('tasks')) {
            this.set('tasks', [
                { id: 1, name: 'Bake obsidian mesh texture coordinates', status: 'active' },
                { id: 2, name: 'Calibrate Dolby-Atmos listener positions', status: 'todo' },
                { id: 3, name: 'Integrate WebGPU edge nodes API', status: 'done' }
            ]);
        }
        if (!this.get('profile')) {
            this.set('profile', {
                name: 'Alexander Vance',
                email: 'vance@3mstudio.design',
                role: 'Lead Architect',
                apiKey: '3m_studio_live_5a72d3f9b2c8901ef563e412'
            });
        }
    }

    set(key, val) {
        localStorage.setItem(this.prefix + key, JSON.stringify(val));
    }

    get(key) {
        const item = localStorage.getItem(this.prefix + key);
        try {
            return item ? JSON.parse(item) : null;
        } catch {
            return item;
        }
    }
}

const state = new StateManager();


// =========================================================================
// 2. TOAST SYSTEM (Visual Alert Stack)
// =========================================================================
class ToastManager {
    constructor() {
        this.container = document.getElementById('toast-container');
    }

    show(message, type = 'info', duration = 4000) {
        if (!this.container) return;

        const toast = document.createElement('div');
        toast.className = `toast-item ${type}`;
        
        let icon = 'ℹ';
        if (type === 'success') icon = '✓';
        if (type === 'error') icon = '✗';
        if (type === 'warning') icon = '⚠';

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;

        this.container.appendChild(toast);

        // Auto Close
        setTimeout(() => {
            toast.style.animation = 'toast-slide-in 0.35s reverse ease-out forwards';
            toast.addEventListener('animationend', () => toast.remove());
        }, duration);
    }
}

const toasts = new ToastManager();


// =========================================================================
// 3. MODAL SYSTEM (Focus Trapper Overlay)
// =========================================================================
class ModalManager {
    constructor() {
        this.activeModal = null;
        this.initListeners();
    }

    initListeners() {
        // Overlay close & Escape close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close(this.activeModal.id);
            }
        });

        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close(modal.id);
                }
            });
        });
    }

    open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        this.activeModal = modal;

        // Focus Trapping
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex="0"]');
        if (focusable.length > 0) {
            setTimeout(() => focusable[0].focus(), 100);
        }
    }

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        if (this.activeModal === modal) this.activeModal = null;
    }
}

const modals = new ModalManager();


// =========================================================================
// 4. THEME MANAGER (OS Sync & Persistence)
// =========================================================================
class ThemeManager {
    constructor() {
        this.toggleBtn = document.getElementById('theme-toggle-btn');
        this.init();
    }

    init() {
        const savedTheme = state.get('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'light' || (!savedTheme && !systemPrefersDark)) {
            this.setTheme('light');
        } else {
            this.setTheme('dark');
        }

        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Listen for OS scheme adjustments
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!state.get('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    setTheme(theme) {
        const darkIcon = document.querySelector('.theme-icon-dark');
        const lightIcon = document.querySelector('.theme-icon-light');

        if (theme === 'dark') {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            if (darkIcon) darkIcon.style.display = 'block';
            if (lightIcon) lightIcon.style.display = 'none';
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            if (darkIcon) darkIcon.style.display = 'none';
            if (lightIcon) lightIcon.style.display = 'block';
        }
        state.set('theme', theme);
    }

    toggle() {
        const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        const targetTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(targetTheme);
        toasts.show(`Theme switched to ${targetTheme} mode.`, 'info');
    }
}


// =========================================================================
// 5. GLOBAL SEARCH ENGINE (Client-side Search Index)
// =========================================================================
class SearchEngine {
    constructor() {
        this.modal = document.getElementById('search-modal');
        this.input = document.getElementById('modal-search-input');
        this.resultsContainer = document.getElementById('search-results-list-container');
        this.trigger = document.getElementById('trigger-global-search');
        this.closeBtn = document.getElementById('close-search-modal');
        
        // Internal index values representing platform nodes
        this.index = [
            { title: 'Introduction to Spatial Meshes', category: 'Documentation', link: '#/docs' },
            { title: 'API Authentication Reference', category: 'Documentation', link: '#/docs' },
            { title: 'Creator Pro Subscription Plan', category: 'Pricing', link: '#/pricing' },
            { title: 'Creative Ray-Tracing in WebGL2', category: 'Blog', link: '#/blog' },
            { title: 'VisionOS Spatial glTF Standards', category: 'Blog', link: '#/blog' },
            { title: 'General System FAQ & Credits', category: 'FAQs', link: '#/faq' },
            { title: 'Enterprise Render Cluster setup', category: 'FAQs', link: '#/faq' }
        ];

        this.init();
    }

    init() {
        if (this.trigger) {
            this.trigger.addEventListener('click', () => modals.open('search-modal'));
        }
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => modals.close('search-modal'));
        }
        if (this.input) {
            this.input.addEventListener('input', (e) => this.performSearch(e.target.value));
        }

        // Global Command Palette shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                modals.open('search-modal');
            }
        });
    }

    performSearch(query) {
        if (!this.resultsContainer) return;
        
        if (!query.trim()) {
            this.resultsContainer.innerHTML = `<p class="search-placeholder-text">Type your query to search spatial media indices...</p>`;
            return;
        }

        const filtered = this.index.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        );

        if (filtered.length === 0) {
            this.resultsContainer.innerHTML = `<p class="search-placeholder-text">No matches found for "${query}"</p>`;
            return;
        }

        this.resultsContainer.innerHTML = filtered.map(item => `
            <a href="${item.link}" class="search-result-item" onclick="modals.close('search-modal')">
                <span class="search-result-category">${item.category}</span>
                <span class="search-result-title">${item.title}</span>
            </a>
        `).join('');
    }
}


// =========================================================================
// 6. HIGH PERFORMANCE INTERACTIVE CANVAS (Particle connections)
// =========================================================================
class ParticleBackground {
    constructor() {
        this.canvas = document.getElementById('hero-particles');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 160 };
        this.isActive = true;
        this.maxParticles = 80;
        
        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.animate();

        window.addEventListener('resize', () => this.resize(), { passive: true });
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        }, { passive: true });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 1
            });
        }
    }

    animate() {
        if (!this.isActive) return;
        requestAnimationFrame(() => this.animate());

        // Determine Theme Hue
        const isLightTheme = document.body.classList.contains('light-theme');
        const particleColor = isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
        const lineColor = isLightTheme ? 'rgba(79, 70, 229, 0.05)' : 'rgba(129, 140, 248, 0.05)';

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw and Update Particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;

            // Bounce check
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // Mouse interaction
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist < this.mouse.radius) {
                    const force = (this.mouse.radius - dist) / this.mouse.radius;
                    p.x += (dx / dist) * force * 1.5;
                    p.y += (dy / dist) * force * 1.5;
                }
            }

            this.ctx.fillStyle = particleColor;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw connections
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (dist < 100) {
                    this.ctx.strokeStyle = lineColor;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
    }
}


// =========================================================================
// 7. FORM VALIDATOR (Inline errors & custom notification loops)
// =========================================================================
class FormValidator {
    constructor(formId, successMsg) {
        this.form = document.getElementById(formId);
        this.successMsg = successMsg;
        if (this.form) this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validate()) {
                toasts.show(this.successMsg, 'success');
                this.form.reset();
            } else {
                toasts.show('Please fix outstanding validation errors.', 'error');
            }
        });
    }

    validate() {
        let isValid = true;
        const inputs = this.form.querySelectorAll('input[required], select[required], textarea[required]');

        inputs.forEach(input => {
            const errSpan = document.getElementById(`err-${input.id}`);
            if (!input.value.trim()) {
                this.showError(input, errSpan, 'This field is required.');
                isValid = false;
            } else if (input.type === 'email' && !this.isValidEmail(input.value)) {
                this.showError(input, errSpan, 'Please enter a valid email address.');
                isValid = false;
            } else if (input.id === 'signup-pass' && input.value.length < 8) {
                this.showError(input, errSpan, 'Password must be at least 8 characters.');
                isValid = false;
            } else if (input.id === 'signup-agree' && !input.checked) {
                this.showError(input, errSpan, 'You must agree to the conditions.');
                isValid = false;
            } else {
                this.clearError(input, errSpan);
            }
        });

        return isValid;
    }

    showError(input, span, msg) {
        input.style.borderColor = 'var(--color-error)';
        if (span) {
            span.textContent = msg;
            span.style.display = 'block';
        }
    }

    clearError(input, span) {
        input.style.borderColor = 'var(--border-color)';
        if (span) {
            span.textContent = '';
            span.style.display = 'none';
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}


// =========================================================================
// 8. SPA ROUTER (Hash matching & animation transitions)
// =========================================================================
class Router {
    constructor(app) {
        this.app = app;
        this.appRoot = document.getElementById('app-root');
        this.init();
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        // Load default route on setup
        this.handleRoute();
    }

    handleRoute() {
        const hash = window.location.hash || '#/';
        
        // Trigger exit page transition animation
        if (this.appRoot) {
            this.appRoot.className = 'page-transition-container fade-out';
            
            setTimeout(() => {
                this.renderPage(hash);
                this.appRoot.className = 'page-transition-container fade-in';
                window.scrollTo(0, 0);
            }, 250);
        }
    }

    renderPage(hash) {
        // Router Mappings
        const routes = {
            '#/': 'page-home',
            '#/about': 'page-about',
            '#/pricing': 'page-pricing',
            '#/blog': 'page-blog',
            '#/docs': 'page-docs',
            '#/faq': 'page-faq',
            '#/contact': 'page-contact',
            '#/privacy': 'page-privacy',
            '#/terms': 'page-terms',
            '#/coming-soon': 'page-coming-soon',
            '#/maintenance': 'page-maintenance'
        };

        const templateId = routes[hash];

        // 1. Check for programmatic views first (Dashboard and Admin)
        if (hash === '#/dashboard') {
            this.appRoot.innerHTML = this.getDashboardMarkup();
            this.app.initDashboardLogic();
            this.updateActiveNavLinks(hash);
            return;
        }

        if (hash === '#/admin') {
            this.appRoot.innerHTML = this.getAdminMarkup();
            this.app.initAdminLogic();
            this.updateActiveNavLinks(hash);
            return;
        }

        // 2. Load regular templates
        if (templateId) {
            const template = document.getElementById(templateId);
            if (template) {
                const clone = template.content.cloneNode(true);
                this.appRoot.innerHTML = '';
                this.appRoot.appendChild(clone);
                this.app.initPageInteractions(hash);
                this.updateActiveNavLinks(hash);
                return;
            }
        }

        // 3. Fallback: 404
        const template404 = document.getElementById('page-404');
        if (template404) {
            const clone = template404.content.cloneNode(true);
            this.appRoot.innerHTML = '';
            this.appRoot.appendChild(clone);
        } else {
            this.appRoot.innerHTML = `<h1>Page Not Found</h1><p>Sorry, the route you requested is invalid.</p>`;
        }
        this.updateActiveNavLinks(hash);
    }

    updateActiveNavLinks(hash) {
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    getDashboardMarkup() {
        return `
            <div class="dashboard-layout">
                <aside class="dashboard-sidebar">
                    <div class="dashboard-sidebar-menu">
                        <div class="dash-menu-group">
                            <span class="dash-menu-title">Studio Menu</span>
                            <a href="#/dashboard" class="dash-menu-item active">📊 Workspace Stats</a>
                            <a href="#/docs" class="dash-menu-item">🔌 API Documentation</a>
                            <a href="#/admin" class="dash-menu-item">👑 Team Console</a>
                            <a href="#/" class="dash-menu-item">↩ Exit Studio</a>
                        </div>
                    </div>
                    <div class="user-avatar-bar" style="display:flex; align-items:center; gap:0.5rem; padding:1rem; border-top:1px solid var(--border-color)">
                        <div class="user-avatar-placeholder purple" style="width:32px; height:32px">AV</div>
                        <div style="display:flex; flex-direction:column; text-align:left">
                            <span style="font-size:0.85rem; font-weight:600">Alexander Vance</span>
                            <span style="font-size:0.7rem; color:var(--text-muted)">Lead Architect</span>
                        </div>
                    </div>
                </aside>
                <main class="dashboard-main">
                    <div class="dashboard-header">
                        <div class="dashboard-title-group">
                            <h1>Workspace Dashboard</h1>
                            <p>Real-time analytics and dynamic task management boards.</p>
                        </div>
                        <button class="btn btn-primary btn-glow" id="dashboard-sync-btn">Sync Clusters</button>
                    </div>

                    <div class="dashboard-widgets-grid">
                        <div class="widget-card">
                            <div class="widget-header"><span>Render Cycles</span><span>Month</span></div>
                            <div class="widget-value" id="dash-val-cycles">42,892</div>
                            <div class="widget-change positive">+12.4% vs last month</div>
                        </div>
                        <div class="widget-card">
                            <div class="widget-header"><span>Edge CDN Bandwidth</span><span>Month</span></div>
                            <div class="widget-value">1.24 TB</div>
                            <div class="widget-change positive">+8.2% vs last month</div>
                        </div>
                        <div class="widget-card">
                            <div class="widget-header"><span>GPU Node Cluster Status</span><span>Live</span></div>
                            <div class="widget-value" style="color:var(--color-success)">Healthy</div>
                            <div class="widget-change positive">60 Active Nodes</div>
                        </div>

                        <!-- Simulating SVG Graph Widget -->
                        <div class="widget-card widget-card-wide">
                            <div class="widget-header"><span>GPU Thread Utilizations (Last 12 Hours)</span></div>
                            <div class="chart-container-sim" id="dashboard-svg-chart">
                                <!-- Bars will be generated by script -->
                            </div>
                        </div>

                        <!-- Simulating Active Task Board Widget -->
                        <div class="widget-card">
                            <div class="widget-header"><span>Active Studio Tasks</span></div>
                            <div class="task-list" id="dashboard-task-list">
                                <!-- Tasks will load here -->
                            </div>
                            <div style="display:flex; gap:0.5rem; margin-top:1rem">
                                <input type="text" id="new-task-input" placeholder="Type new task..." style="flex:1; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color); background:rgba(0,0,0,0.1); color:var(--text-primary)">
                                <button class="btn btn-primary btn-small" id="btn-add-task">+</button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }

    getAdminMarkup() {
        return `
            <div class="dashboard-layout">
                <aside class="dashboard-sidebar">
                    <div class="dashboard-sidebar-menu">
                        <div class="dash-menu-group">
                            <span class="dash-menu-title">Admin Management</span>
                            <a href="#/dashboard" class="dash-menu-item">📊 Workspace Stats</a>
                            <a href="#/admin" class="dash-menu-item active">👑 Team Console</a>
                            <a href="#/" class="dash-menu-item">↩ Exit Studio</a>
                        </div>
                    </div>
                </aside>
                <main class="dashboard-main">
                    <div class="dashboard-header">
                        <div class="dashboard-title-group">
                            <h1>Enterprise Console</h1>
                            <p>Manage cluster configurations, team permissions, and platform actions logs.</p>
                        </div>
                    </div>

                    <div class="admin-table-card">
                        <div class="admin-table-header">
                            <h3>Active Team Members</h3>
                            <input type="search" id="admin-user-search" placeholder="Search members..." style="padding:0.4rem 1rem; border-radius:100px; border:1px solid var(--border-color); background:rgba(0,0,0,0.2); color:var(--text-primary)">
                        </div>
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>API Quota</th>
                                </tr>
                            </thead>
                            <tbody id="admin-user-rows">
                                <!-- User records loaded dynamically -->
                            </tbody>
                        </table>
                    </div>

                    <div class="grid grid-cols-2">
                        <div class="widget-card">
                            <h4 class="widget-header"><span>Platform System Logs</span></h4>
                            <div class="activity-list" id="admin-logs-list" style="margin-top: 1rem;">
                                <!-- Live logs -->
                            </div>
                        </div>
                        <div class="widget-card">
                            <h4 class="widget-header"><span>Role Permissions Checklists</span></h4>
                            <div style="display:flex; flex-direction:column; gap:0.75rem; margin-top: 1rem;">
                                <label class="checkbox-custom">
                                    <input type="checkbox" checked disabled> <span>Allow programmatic mesh creation</span>
                                </label>
                                <label class="checkbox-custom">
                                    <input type="checkbox" checked disabled> <span>Allow 8K texture maps uploads</span>
                                </label>
                                <label class="checkbox-custom">
                                    <input type="checkbox"> <span>Allow direct WebGPU kernel injections</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }
}


// =========================================================================
// 9. CORE APPLICATION CORE (Main bootstrapping client)
// =========================================================================
class App {
    constructor() {
        this.theme = null;
        this.search = null;
        this.particles = null;
        this.router = null;
        this.initGlobalElements();
    }

    initGlobalElements() {
        // Init managers
        this.theme = new ThemeManager();
        this.search = new SearchEngine();
        this.particles = new ParticleBackground();

        // Global Nav Drawer trigger
        const menuBtn = document.getElementById('mobile-menu-trigger');
        const menuDrawer = document.getElementById('mobile-menu-drawer');
        if (menuBtn && menuDrawer) {
            menuBtn.addEventListener('click', () => {
                const isOpen = menuDrawer.classList.contains('open');
                menuDrawer.classList.toggle('open', !isOpen);
                menuBtn.classList.toggle('active', !isOpen);
            });
        }

        // Global Announcement Bar handler
        const closeAnnBtn = document.getElementById('close-announcement');
        const annBar = document.getElementById('top-announcement');
        if (closeAnnBtn && annBar) {
            closeAnnBtn.addEventListener('click', () => annBar.remove());
        }

        // Global login/signup modal triggers
        const loginBtn = document.getElementById('nav-login-btn');
        const signupBtn = document.getElementById('nav-signup-btn');
        const closeAuthBtn = document.getElementById('close-auth-modal');
        
        if (loginBtn) loginBtn.addEventListener('click', () => {
            modals.open('auth-modal');
            this.toggleAuthTab('login');
        });
        if (signupBtn) signupBtn.addEventListener('click', () => {
            modals.open('auth-modal');
            this.toggleAuthTab('signup');
        });
        if (closeAuthBtn) closeAuthBtn.addEventListener('click', () => modals.close('auth-modal'));

        // Toggle Tabs inside Auth Modal
        document.querySelectorAll('.auth-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toggleAuthTab(e.target.dataset.tab);
            });
        });

        // Initialize dynamic routers
        this.router = new Router(this);

        // Form Validations
        new FormValidator('login-form', 'Access granted. Redirecting to visual workspace...');
        new FormValidator('signup-form', 'Account created successfully. Welcome to 3M Studio!');
    }

    toggleAuthTab(tabName) {
        document.querySelectorAll('.auth-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        document.querySelectorAll('.auth-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `pane-${tabName}`);
        });
    }

    initPageInteractions(hash) {
        // Page specific event setups
        if (hash === '#/') {
            this.initHomeInteractions();
        } else if (hash === '#/contact') {
            new FormValidator('contact-form', 'Message sent successfully. A specialist will get back to you shortly.');
        } else if (hash === '#/faq') {
            this.initFaqInteractions();
        } else if (hash === '#/blog') {
            this.initBlogInteractions();
        } else if (hash === '#/docs') {
            this.initDocsInteractions();
        } else if (hash === '#/coming-soon') {
            this.initComingSoonCountdown();
            new FormValidator('waitlist-form', 'Added successfully. You will receive credentials shortly.');
        }
    }

    // FAQ Page Accordion Accordions
    initFaqInteractions() {
        document.querySelectorAll('.faq-question-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.parentElement;
                const pane = item.querySelector('.faq-answer-pane');
                const isActive = item.classList.contains('active');
                
                // Close others
                document.querySelectorAll('.faq-accordion-item').forEach(other => {
                    other.classList.remove('active');
                    other.querySelector('.faq-answer-pane').style.maxHeight = null;
                });

                if (!isActive) {
                    item.classList.add('active');
                    pane.style.maxHeight = pane.scrollHeight + 'px';
                }
            });
        });

        // Search Category Tabs
        document.querySelectorAll('.faq-cat-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.faq-cat-btn').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const cat = tab.dataset.faqCat;

                document.querySelectorAll('.faq-accordion-item').forEach(item => {
                    if (cat === 'all' || item.dataset.category === cat) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // Home Sandbox Demo Interactive engine
    initHomeInteractions() {
        // Parallax mockup box mouse movement listener
        const parallaxBox = document.getElementById('dashboard-parallax-box');
        if (parallaxBox) {
            document.addEventListener('mousemove', (e) => {
                const dx = e.clientX - window.innerWidth / 2;
                const dy = e.clientY - window.innerHeight / 2;
                const rx = -(dy / window.innerHeight) * 15;
                const ry = (dx / window.innerWidth) * 15;
                
                // Tilt the 3D frame slightly
                const frame = parallaxBox.querySelector('.dashboard-mockup-frame');
                if (frame) {
                    frame.style.transform = `rotateX(${5 + rx}deg) rotateY(${ry}deg)`;
                }
            });
        }

        // Demo interactive stage tabs
        const previewStage = document.getElementById('demo-stage-view');
        const codeOutput = document.getElementById('demo-json-output');
        
        document.querySelectorAll('.demo-tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.demo-tab-btn').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const selection = tab.dataset.demoTab;

                // Adjust shape CSS styles dynamically
                const shape = previewStage.querySelector('.stage-shape-render');
                shape.className = `stage-shape-render ${selection}-theme`;

                // Update Code block markup
                const codeMockData = {
                    sphere: `{
  "engine": "CinemaRender-v3",
  "primitive": "obsidian-sphere",
  "roughness": 0.04,
  "transmission": 0.95,
  "refractionIndex": 1.48,
  "emissiveMap": "pink-glow-radial",
  "polyCount": 42000,
  "bakedTextures": true
}`,
                    cyber: `{
  "engine": "CinemaRender-v3",
  "primitive": "neon-cyber-prism",
  "roughness": 0.12,
  "transmission": 0.00,
  "emissiveColor": "blue-violet",
  "polyCount": 78000,
  "bakedTextures": true
}`,
                    cloud: `{
  "engine": "CinemaRender-v3",
  "primitive": "fluid-gas-cloud",
  "roughness": 0.85,
  "transmission": 1.00,
  "glowRefractions": 0.92,
  "density": 0.44,
  "bakedTextures": false
}`
                };
                codeOutput.textContent = codeMockData[selection];
            });
        });

        // Slider adjusters
        const roughSlider = document.getElementById('slider-roughness');
        const refractSlider = document.getElementById('slider-refract');
        
        if (roughSlider) {
            roughSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value) / 100;
                toasts.show(`Mesh material roughness changed to: ${val}`, 'info');
            });
        }
        if (refractSlider) {
            refractSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value) / 100;
                toasts.show(`Mesh light refraction index changed to: ${val}`, 'info');
            });
        }

        // Bake trigger
        const bakeBtn = document.getElementById('demo-bake-btn');
        if (bakeBtn) {
            bakeBtn.addEventListener('click', () => {
                toasts.show('Compiling geometry vertices... Please hold.', 'info');
                setTimeout(() => {
                    toasts.show('Mesh textures successfully compiled and pushed to spatial CDN!', 'success');
                }, 2000);
            });
        }

        // Stats Counter animation
        document.querySelectorAll('.stat-number').forEach(item => {
            const limit = parseInt(item.dataset.count);
            let current = 0;
            const step = Math.ceil(limit / 100);
            const interval = setInterval(() => {
                current += step;
                if (current >= limit) {
                    current = limit;
                    clearInterval(interval);
                }
                item.textContent = current.toLocaleString();
            }, 15);
        });

        // Waitlists validations on home
        new FormValidator('newsletter-form', 'Subscription confirmed. Welcome aboard!');
    }

    // Blog reader overlay simulator
    initBlogInteractions() {
        const viewerModal = document.getElementById('blog-viewer-modal');
        const viewerContent = document.getElementById('blog-viewer-content-target');
        const closeViewer = document.getElementById('close-blog-viewer');

        const blogData = {
            '1': {
                title: 'Realtime Ray-Tracing inside WebGL2: How we achieved sub-2ms frame latency',
                category: 'Engineering',
                readTime: '5 min read',
                author: 'Elena Rostova',
                body: '<p>Achieving stable framerates with raytracing in browsers has historically been problematic due to JavaScript bridge delay overhead. At 3M Studio, we bypassed this bottleneck entirely using localized fragment buffer allocations.</p><p>By compiling texture coords and shaders asynchronously on remote GPU nodes and mapping denoiser matrices directly to native WebGL channels, we render refractions in real-time under 2ms bounds.</p>'
            },
            '2': {
                title: 'Designing for VisionOS: Translating glTF files into spatial USDZ configurations',
                category: 'Design',
                readTime: '8 min read',
                author: 'Devon Morris',
                body: '<p>Spatial design introduces new requirements for depth coordinates. Standard game meshes often carry flat elements that look pixelated inside real-world environments.</p><p>We detail our pipeline formulas converting glTF meshes, normalizing light reflections, and packaging them into USDZ files optimized for high-end Vision Pro lenses.</p>'
            },
            '3': {
                title: 'Creating Neural Sound Fields: Dynamic Atmos sounds mapped to prompt events',
                category: 'Tutorials',
                readTime: '12 min read',
                author: 'Alexander Vance',
                body: '<p>Audio is half of any immersive experience. Standard flat ambient audio tracks fail when developers move around generated 3D meshes.</p><p>This tutorial shows you how to bind listener coordinates to physical boundaries and trigger localized collision sound waves dynamically inside the browser render loop.</p>'
            }
        };

        document.querySelectorAll('.blog-read-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.blog-card');
                const id = card.dataset.id;
                const post = blogData[id];

                if (post && viewerContent && viewerModal) {
                    viewerContent.innerHTML = `
                        <div class="viewer-header-meta">
                            <span class="viewer-category">${post.category}</span>
                            <span class="viewer-read-time">${post.readTime}</span>
                        </div>
                        <h2 class="viewer-title">${post.title}</h2>
                        <div class="viewer-author-bar">
                            <div class="viewer-author-avatar">AV</div>
                            <span class="viewer-author-name">${post.author}</span>
                        </div>
                        <div class="viewer-body">${post.body}</div>
                    `;
                    modals.open('blog-viewer-modal');
                }
            });
        });

        if (closeViewer) {
            closeViewer.addEventListener('click', () => modals.close('blog-viewer-modal'));
        }

        // Filtering Cards
        document.querySelectorAll('.blog-cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.blog-cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;

                document.querySelectorAll('.blog-card').forEach(card => {
                    if (filter === 'all' || card.dataset.category === filter) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // Docs Copy clips and API generator
    initDocsInteractions() {
        // Toggle Sidebar pages
        document.querySelectorAll('.docs-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.docs-nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                const targetPane = link.dataset.docPane;
                document.querySelectorAll('.doc-pane-block').forEach(pane => {
                    pane.style.display = (pane.id === `doc-pane-${targetPane}`) ? 'block' : 'none';
                });
            });
        });

        // Copy button trigger
        document.querySelectorAll('.copy-code-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.dataset.code;
                navigator.clipboard.writeText(text).then(() => {
                    toasts.show('Code snippet copied to clipboard!', 'success');
                }).catch(() => {
                    toasts.show('Failed to copy code.', 'error');
                });
            });
        });

        // API Key simulation card inside docs
        const simKeyBtn = document.getElementById('btn-generate-sim-key');
        const keyBox = document.getElementById('simulated-key-box');
        const simConsole = document.getElementById('api-simulator-console');

        if (simKeyBtn && keyBox && simConsole) {
            simKeyBtn.addEventListener('click', () => {
                const randomHex = Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');
                const generatedKey = `3m_studio_live_${randomHex}`;
                keyBox.value = generatedKey;
                
                simConsole.textContent = `[System Init] Resolving edge token nodes...\n[Authentication] Key validated: ${generatedKey}\n[Compute Cluster] Active Node: GPU-US-EAST-492 connected (Status: Healthy)`;
                toasts.show('New live API credential generated.', 'success');
            });
        }
    }

    // Coming soon Countdown
    initComingSoonCountdown() {
        const d = document.getElementById('timer-days');
        const h = document.getElementById('timer-hours');
        const m = document.getElementById('timer-mins');
        const s = document.getElementById('timer-secs');

        if (!d) return;

        let totalSeconds = 7 * 24 * 3600 + 18 * 3600 + 42 * 60 + 59;

        const countdownInterval = setInterval(() => {
            if (totalSeconds <= 0) {
                clearInterval(countdownInterval);
                return;
            }
            totalSeconds--;

            const days = Math.floor(totalSeconds / (24 * 3600));
            const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;

            d.textContent = String(days).padStart(2, '0');
            h.textContent = String(hours).padStart(2, '0');
            m.textContent = String(mins).padStart(2, '0');
            s.textContent = String(secs).padStart(2, '0');
        }, 1000);
    }

    // Dashboard Interactive Logic
    initDashboardLogic() {
        // Sync button
        const syncBtn = document.getElementById('dashboard-sync-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                toasts.show('Connecting to active GPU render nodes...', 'info');
                setTimeout(() => {
                    toasts.show('All cluster connections verified. Sync complete.', 'success');
                    const cycleVal = document.getElementById('dash-val-cycles');
                    if (cycleVal) cycleVal.textContent = '44,912';
                }, 1500);
            });
        }

        // Simulating the dynamic GPU Thread utilization charts
        const chartSim = document.getElementById('dashboard-svg-chart');
        if (chartSim) {
            const chartData = [65, 45, 85, 30, 92, 54, 78, 62, 40, 88, 74, 95];
            chartSim.innerHTML = chartData.map((val, idx) => `
                <div class="chart-bar-sim-wrapper" style="display:flex; flex-direction:column; flex:1; align-items:center;">
                    <div class="chart-bar-sim" style="height:${val}%; width: 100%;" title="Hour ${idx + 1}: ${val}% Utilization"></div>
                    <span class="chart-label-sim">${idx + 1}h</span>
                </div>
            `).join('');
        }

        // Render Tasks board list
        this.renderDashboardTasks();

        // Add task button
        const addTaskBtn = document.getElementById('btn-add-task');
        const taskInput = document.getElementById('new-task-input');
        if (addTaskBtn && taskInput) {
            addTaskBtn.addEventListener('click', () => {
                const name = taskInput.value.trim();
                if (name) {
                    const tasksList = state.get('tasks');
                    const newId = tasksList.length > 0 ? tasksList[tasksList.length - 1].id + 1 : 1;
                    tasksList.push({ id: newId, name: name, status: 'todo' });
                    state.set('tasks', tasksList);
                    taskInput.value = '';
                    this.renderDashboardTasks();
                    toasts.show('Task added to active board.', 'success');
                }
            });
        }
    }

    renderDashboardTasks() {
        const holder = document.getElementById('dashboard-task-list');
        if (!holder) return;

        const tasksList = state.get('tasks');
        if (tasksList.length === 0) {
            holder.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted)">All tasks completed.</p>`;
            return;
        }

        holder.innerHTML = tasksList.map(task => `
            <div class="task-item">
                <span class="task-name" style="${task.status === 'done' ? 'text-decoration: line-through; opacity:0.5;' : ''}">${task.name}</span>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    <span class="task-status-tag ${task.status}">${task.status.toUpperCase()}</span>
                    <button class="btn-check-task" data-id="${task.id}" style="cursor:pointer;">${task.status === 'done' ? '↩' : '✓'}</button>
                    <button class="btn-delete-task" data-id="${task.id}" style="color:var(--color-error); cursor:pointer;">✗</button>
                </div>
            </div>
        `).join('');

        // Attach buttons handlers inside board list
        holder.querySelectorAll('.btn-check-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                const list = state.get('tasks');
                const t = list.find(task => task.id === id);
                if (t) {
                    t.status = t.status === 'done' ? 'todo' : 'done';
                    state.set('tasks', list);
                    this.renderDashboardTasks();
                }
            });
        });

        holder.querySelectorAll('.btn-delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                let list = state.get('tasks');
                list = list.filter(task => task.id !== id);
                state.set('tasks', list);
                this.renderDashboardTasks();
                toasts.show('Task removed.', 'info');
            });
        });
    }

    // Admin Console panel logic
    initAdminLogic() {
        const users = [
            { name: 'Alexander Vance', role: 'admin', status: 'Active', quota: 'Unlimited' },
            { name: 'Elena Rostova', role: 'editor', status: 'Active', quota: '8,400/10,000' },
            { name: 'Devon Morris', role: 'editor', status: 'Inactive', quota: '42/1,000' },
            { name: 'Marta Al-Jamil', role: 'viewer', status: 'Active', quota: '0/50' }
        ];

        this.renderAdminUsers(users);

        // Search logic
        const searchInput = document.getElementById('admin-user-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase();
                const filtered = users.filter(u => u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
                this.renderAdminUsers(filtered);
            });
        }

        // Live systems log console
        const logsBox = document.getElementById('admin-logs-list');
        if (logsBox) {
            const logsData = [
                { time: '03:14:02', user: 'Vance', txt: 'pushed obsidian-mesh to edge CDN-US-EAST' },
                { time: '02:59:12', user: 'Rostova', txt: 'updated lighting parameters on main viewport' },
                { time: '01:42:04', user: 'Morris', txt: 'instantiated spatial key for team testing' }
            ];

            logsBox.innerHTML = logsData.map(log => `
                <div class="activity-item">
                    <div class="activity-avatar">${log.user.slice(0, 2).toUpperCase()}</div>
                    <div class="activity-info">
                        <span class="activity-text"><strong>${log.user}</strong> ${log.txt}</span>
                        <span class="activity-time">${log.time}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    renderAdminUsers(list) {
        const holder = document.getElementById('admin-user-rows');
        if (!holder) return;

        if (list.length === 0) {
            holder.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">No matching members found.</td></tr>`;
            return;
        }

        holder.innerHTML = list.map(u => `
            <tr>
                <td>
                    <div class="admin-user-cell">
                        <div class="admin-user-avatar">${u.name.slice(0, 2).toUpperCase()}</div>
                        <span class="admin-user-name">${u.name}</span>
                    </div>
                </td>
                <td><span class="admin-role-badge ${u.role}">${u.role.toUpperCase()}</span></td>
                <td><span style="color:${u.status === 'Active' ? 'var(--color-success)' : 'var(--text-muted)'}">${u.status}</span></td>
                <td><code style="font-family:var(--font-mono); font-size:0.8rem">${u.quota}</code></td>
            </tr>
        `).join('');
    }
}

// Instantiate App
document.addEventListener('DOMContentLoaded', () => {
    window.appInstance = new App();
});
