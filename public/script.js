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
        if (!this.get('files')) {
            this.set('files', [
                { name: 'obsidian-mesh.gltf', type: 'model', size: '4.2 MB', icon: '📦' },
                { name: 'ambient-theme.wav', type: 'audio', size: '1.8 MB', icon: '🎵' },
                { name: 'spin-rotation.js', type: 'code', size: '12 KB', icon: '📄' },
                { name: 'config-settings.json', type: 'json', size: '2 KB', icon: '⚙️' }
            ]);
        }
        if (!this.get('notifications')) {
            this.set('notifications', [
                { id: 1, title: 'GPU Cluster US-EAST synced successfully.', time: 'Just now', read: false },
                { id: 2, title: 'New member Marta Al-Jamil joined as viewer.', time: '1 hour ago', read: true },
                { id: 3, title: 'API deployment pipeline completed.', time: '2 hours ago', read: true }
            ]);
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
        
        // Internal index values representing platform nodes and commands
        this.index = [
            { title: 'Introduction to Spatial Meshes', category: 'Documentation', link: '#/docs' },
            { title: 'API Authentication Reference', category: 'Documentation', link: '#/docs' },
            { title: 'Creator Pro Subscription Plan', category: 'Pricing', link: '#/pricing' },
            { title: 'Creative Ray-Tracing in WebGL2', category: 'Blog', link: '#/blog' },
            { title: 'VisionOS Spatial glTF Standards', category: 'Blog', link: '#/blog' },
            { title: 'General System FAQ & Credits', category: 'FAQs', link: '#/faq' },
            { title: 'Enterprise Render Cluster setup', category: 'FAQs', link: '#/faq' },
            { title: '/theme - Toggle Dark/Light Mode', category: 'Command', link: 'action:theme' },
            { title: '/settings - Open Workspace Settings', category: 'Command', link: '#/dashboard?tab=settings' },
            { title: '/dashboard - Open Workspace Dashboard', category: 'Command', link: '#/dashboard' },
            { title: '/admin - Open Enterprise Team Console', category: 'Command', link: '#/admin' },
            { title: '/reset - Clear LocalDatabase caches', category: 'Command', link: 'action:reset' }
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
            this.resultsContainer.innerHTML = `<p class="search-placeholder-text">Type your query or /command to search spatial indices...</p>`;
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

        this.resultsContainer.innerHTML = filtered.map(item => {
            const isAction = item.link.startsWith('action:');
            const clickHandler = isAction 
                ? `event.preventDefault(); window.appInstance.executeCommand('${item.link.split(':')[1]}'); modals.close('search-modal');`
                : `modals.close('search-modal');`;
            return `
                <a href="${isAction ? '#' : item.link}" class="search-result-item" onclick="${clickHandler}">
                    <span class="search-result-category">${item.category}</span>
                    <span class="search-result-title">${item.title}</span>
                </a>
            `;
        }).join('');
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
        let hash = window.location.hash || '#/';
        let queryParams = null;
        if (hash.includes('?')) {
            const parts = hash.split('?');
            hash = parts[0];
            queryParams = new URLSearchParams(parts[1]);
        }
        
        // Trigger exit page transition animation
        if (this.appRoot) {
            this.appRoot.className = 'page-transition-container fade-out';
            
            setTimeout(() => {
                this.renderPage(hash, queryParams);
                this.appRoot.className = 'page-transition-container fade-in';
                window.scrollTo(0, 0);
            }, 250);
        }
    }

    renderPage(hash, queryParams) {
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
            '#/maintenance': 'page-maintenance',
            '#/ai-chat': 'page-ai-chat'
        };

        const templateId = routes[hash];

        // 1. Check for programmatic views first (Dashboard and Admin)
        if (hash === '#/dashboard') {
            this.appRoot.innerHTML = this.getDashboardMarkup();
            const tab = queryParams ? queryParams.get('tab') : 'analytics';
            this.app.initDashboardLogic(tab);
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
            <div class="workspace-layout">
                <aside class="workspace-sidebar">
                    <div class="dashboard-sidebar-menu">
                        <div class="dash-menu-group">
                            <span class="dash-menu-title">Studio Core</span>
                            <button class="dash-menu-item active" data-workspace-tab="analytics">📊 Analytics Board</button>
                            <button class="dash-menu-item" data-workspace-tab="ai-studio">🤖 AI Creative Studio</button>
                            <button class="dash-menu-item" data-workspace-tab="files">📁 Storage Files</button>
                            <button class="dash-menu-item" data-workspace-tab="settings">⚙️ Studio Settings</button>
                            <button class="dash-menu-item" data-workspace-tab="notifications">🔔 Notifications</button>
                            <a href="#/admin" class="dash-menu-item">👑 Team Console</a>
                            <a href="#/" class="dash-menu-item">↩ Exit Studio</a>
                        </div>
                    </div>
                    <div class="user-avatar-bar" style="display:flex; align-items:center; gap:0.5rem; padding:1rem; border-top:1px solid var(--border-color)">
                        <div class="user-avatar-placeholder purple" id="workspace-user-avatar" style="width:32px; height:32px">AV</div>
                        <div style="display:flex; flex-direction:column; text-align:left">
                            <span id="workspace-user-name" style="font-size:0.85rem; font-weight:600">Alexander Vance</span>
                            <span id="workspace-user-role" style="font-size:0.7rem; color:var(--text-muted)">Lead Architect</span>
                        </div>
                    </div>
                </aside>
                <main class="workspace-main" id="workspace-content-pane">
                    <!-- Dynamic pane content loaded on tab select -->
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

        // Global Notifications Modal triggers
        const notifBtn = document.getElementById('trigger-notifications');
        const closeNotifBtn = document.getElementById('close-notifications-modal');
        const clearAllNotifs = document.getElementById('btn-clear-all-notifications');
        
        if (notifBtn) notifBtn.addEventListener('click', () => {
            modals.open('notifications-modal');
            this.renderNotificationsList();
            this.markNotificationsAsRead();
        });
        if (closeNotifBtn) closeNotifBtn.addEventListener('click', () => modals.close('notifications-modal'));
        if (clearAllNotifs) clearAllNotifs.addEventListener('click', () => {
            state.set('notifications', []);
            this.renderNotificationsList();
            this.updateNotificationsBadge();
            toasts.show('All notifications cleared.', 'info');
        });

        // Initialize PWA Service Worker & Install flow
        this.initPWAInstaller();
        this.updateNotificationsBadge();

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
        } else if (hash === '#/ai-chat') {
            this.initAiChatLogic();
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

                const shape = previewStage.querySelector('.stage-shape-render');
                shape.className = `stage-shape-render ${selection}-theme`;

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

        // 1. Announcement Countdown Timer
        const countdownEl = document.getElementById('announcement-countdown');
        if (countdownEl) {
            let targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 7);
            
            const updateTimer = () => {
                const now = new Date().getTime();
                const distance = targetDate.getTime() - now;
                if (distance < 0) {
                    countdownEl.textContent = "00:00:00:00";
                    return;
                }
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                const pad = (num) => String(num).padStart(2, '0');
                countdownEl.textContent = `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
            };
            updateTimer();
            setInterval(updateTimer, 1000);
        }

        // 2. AI Studio Preview
        const homeAiPrompt = document.getElementById('home-ai-prompt-input');
        const homeAiBtn = document.getElementById('btn-home-ai-generate');
        const homeAiStatus = document.getElementById('home-ai-output-status');
        const homeAiResult = document.getElementById('home-ai-output-result');
        const homeAiContent = document.getElementById('home-ai-result-content');
        const homeAiHistory = document.getElementById('home-ai-history-list');

        if (homeAiBtn && homeAiPrompt) {
            homeAiBtn.addEventListener('click', () => {
                const promptVal = homeAiPrompt.value.trim();
                if (!promptVal) {
                    toasts.show('Please describe an asset first.', 'warning');
                    return;
                }

                homeAiStatus.textContent = 'Analyzing prompt and generating geometry nodes...';
                homeAiStatus.style.display = 'block';
                homeAiResult.style.display = 'none';
                homeAiBtn.disabled = true;

                setTimeout(() => {
                    homeAiStatus.style.display = 'none';
                    homeAiResult.style.display = 'block';
                    homeAiContent.textContent = '';
                    
                    const mockOutputs = {
                        drone: `{\n  "object": "cyberpunk-drone",\n  "polygons": 142000,\n  "textures": ["carbon-fiber-matte", "glass-sensor-lens"],\n  "colliders": "active-box-3d",\n  "status": "ready"\n}`,
                        sphere: `{\n  "object": "glass-refractive-sphere",\n  "polygons": 64000,\n  "refraction": 1.54,\n  "lightStates": "neon-radial-pink",\n  "status": "ready"\n}`,
                        default: `{\n  "status": "completed",\n  "sourcePrompt": "${promptVal}",\n  "renderedAssets": 1,\n  "renderTimeMs": 420,\n  "assetUrl": "/cdn/assets/neural_node_mock.glb"\n}`
                    };

                    const selectedOutput = promptVal.toLowerCase().includes('drone') ? mockOutputs.drone : 
                                           (promptVal.toLowerCase().includes('sphere') ? mockOutputs.sphere : mockOutputs.default);

                    let charIndex = 0;
                    const typeChar = () => {
                        if (charIndex < selectedOutput.length) {
                            homeAiContent.textContent += selectedOutput.charAt(charIndex);
                            charIndex++;
                            setTimeout(typeChar, 10);
                        } else {
                            homeAiBtn.disabled = false;
                            toasts.show('Asset compilation succeeded!', 'success');
                            
                            const newHistoryItem = document.createElement('div');
                            newHistoryItem.style.fontSize = '0.8rem';
                            newHistoryItem.style.padding = '0.5rem';
                            newHistoryItem.style.borderRadius = '6px';
                            newHistoryItem.style.cursor = 'pointer';
                            newHistoryItem.textContent = `⚡ ${promptVal.slice(0, 25)}${promptVal.length > 25 ? '...' : ''}`;
                            newHistoryItem.addEventListener('click', () => {
                                homeAiPrompt.value = promptVal;
                            });
                            homeAiHistory.insertBefore(newHistoryItem, homeAiHistory.firstChild);
                        }
                    };
                    typeChar();
                }, 1500);
            });

            if (homeAiHistory) {
                homeAiHistory.querySelectorAll('div').forEach(item => {
                    item.addEventListener('click', () => {
                        homeAiPrompt.value = item.textContent.replace(/[📦🎵📄]/g, '').trim();
                    });
                });
            }
        }

        // 3. Templates Grid rendering, search, and category filtering
        const templatesGrid = document.getElementById('home-templates-grid');
        const searchInput = document.getElementById('home-template-search');
        const filterContainer = document.getElementById('home-template-filters');

        if (templatesGrid) {
            const mockTemplates = [
                { id: 't1', title: 'Obsidian Cube Grid', category: 'model', type: '3D Mesh', stats: '24K Polys', imageText: '📦' },
                { id: 't2', title: 'Dolby Atmos Spatial Rain', category: 'audio', type: 'Sound Field', stats: '96kHz Binaural', imageText: '🔊' },
                { id: 't3', title: 'Matrix Ray-Trace Shader', category: 'code', type: 'WebGL Script', stats: 'WebGL2 GLSL', imageText: '⚡' },
                { id: 't4', title: 'Cyberpunk Hover Bike', category: 'model', type: '3D Mesh', stats: '112K Polys', imageText: '📦' },
                { id: 't5', title: 'Synthwave Night beat', category: 'audio', type: 'Sound Field', stats: '48kHz Dolby-atmos', imageText: '🔊' },
                { id: 't6', title: 'Liquid Holographic Glass', category: 'code', type: 'WebGL Script', stats: 'WebGPU WGSL', imageText: '⚡' }
            ];

            let activeFilter = 'all';
            let searchQuery = '';

            const renderTemplates = () => {
                const filtered = mockTemplates.filter(item => {
                    const matchesCategory = activeFilter === 'all' || item.category === activeFilter;
                    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          item.type.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesCategory && matchesSearch;
                });

                if (filtered.length === 0) {
                    templatesGrid.innerHTML = `<div style="grid-column:1/-1; padding:3rem; text-align:center; color:var(--text-muted);">No matching templates found.</div>`;
                    return;
                }

                templatesGrid.innerHTML = filtered.map(t => `
                    <div class="feature-card" style="display:flex; flex-direction:column; justify-content:space-between; height:100%; text-align:left; background:var(--bg-secondary); border:1px solid var(--border-color); padding:1.5rem; border-radius:var(--radius-md);">
                        <div>
                            <div style="font-size:2rem; margin-bottom:1rem;">${t.imageText}</div>
                            <span style="font-size:0.75rem; font-weight:700; color:var(--color-purple); text-transform:uppercase;">${t.type}</span>
                            <h4 style="font-size:1.1rem; font-weight:600; margin:0.25rem 0 0.5rem 0;">${t.title}</h4>
                            <p style="font-size:0.85rem; color:var(--text-muted);">${t.stats}</p>
                        </div>
                        <button class="btn btn-outline btn-small w-full" style="margin-top:1.5rem;" onclick="toasts.show('Previewing template: ${t.title}...', 'info')">Preview Template</button>
                    </div>
                `).join('');
            };

            renderTemplates();

            if (filterContainer) {
                filterContainer.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', () => {
                        filterContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        activeFilter = btn.dataset.filter;
                        renderTemplates();
                    });
                });
            }

            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    searchQuery = e.target.value;
                    renderTemplates();
                });
            }
        }

        // 4. Pricing monthly/yearly switcher
        const billingToggle = document.getElementById('home-billing-toggle');
        if (billingToggle) {
            billingToggle.addEventListener('change', (e) => {
                const isYearly = e.target.checked;
                document.querySelectorAll('.tier-price').forEach(el => {
                    el.textContent = isYearly ? el.dataset.yearly : el.dataset.monthly;
                });
                toasts.show(isYearly ? 'Switched to Yearly pricing (20% discount applied).' : 'Switched to Monthly pricing.', 'info');
            });
        }

        // 5. FAQ accordions and FAQ search filters
        const faqSearchInput = document.getElementById('home-faq-search');
        const faqItems = document.querySelectorAll('#home-faq-list .accordion-item');

        if (faqItems.length > 0) {
            faqItems.forEach(item => {
                const header = item.querySelector('.accordion-header');
                const content = item.querySelector('.accordion-content');
                const arrow = item.querySelector('.accordion-arrow');

                if (header && content) {
                    header.addEventListener('click', () => {
                        faqItems.forEach(otherItem => {
                            if (otherItem !== item) {
                                otherItem.querySelector('.accordion-content').style.maxHeight = null;
                                otherItem.querySelector('.accordion-arrow').style.transform = 'rotate(0deg)';
                            }
                        });

                        if (content.style.maxHeight) {
                            content.style.maxHeight = null;
                            arrow.style.transform = 'rotate(0deg)';
                        } else {
                            content.style.maxHeight = content.scrollHeight + "px";
                            arrow.style.transform = 'rotate(180deg)';
                        }
                    });
                }
            });

            if (faqSearchInput) {
                faqSearchInput.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase().trim();
                    faqItems.forEach(item => {
                        const title = item.querySelector('.accordion-header').textContent.toLowerCase();
                        const answer = item.querySelector('.accordion-content').textContent.toLowerCase();
                        
                        if (title.includes(query) || answer.includes(query)) {
                            item.style.display = 'block';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            }
        }

        // Waitlists validations on home
        // Waitlists validations on home
        new FormValidator('newsletter-form', 'Subscription confirmed. Welcome aboard!');
    }

    initAiChatLogic() {
        const conversationsKey = '3m_studio_chats';
        let conversations = JSON.parse(localStorage.getItem(conversationsKey)) || [];
        let activeChatId = null;
        let isGenerating = false;
        let activeReader = null;
        let uploadedImageBase64 = null;
        let uploadedImageName = null;

        // Binding Dom Elements
        const messagesContainer = document.getElementById('chat-messages-container');
        const welcomePane = document.getElementById('chat-welcome-pane');
        const promptTextarea = document.getElementById('chat-prompt-textarea');
        const sendBtn = document.getElementById('btn-chat-send');
        const modelSelect = document.getElementById('chat-model-select');
        const activeTitle = document.getElementById('chat-active-title');
        
        const historyList = document.getElementById('chat-history-list');
        const pinnedList = document.getElementById('chat-pinned-list');
        const searchInput = document.getElementById('chat-search-input');
        const newChatBtn = document.getElementById('btn-chat-new');
        const clearAllBtn = document.getElementById('btn-chat-clear-all');
        const exportBtn = document.getElementById('btn-chat-export');
        const importBtn = document.getElementById('btn-chat-import');
        const importFileInput = document.getElementById('chat-import-file');
        
        const fileInput = document.getElementById('chat-file-input');
        const attachBtn = document.getElementById('btn-chat-attach');
        const imgPreviewBox = document.getElementById('chat-image-preview-box');
        const imgPreviewImg = document.getElementById('chat-image-preview-img');
        const imgPreviewName = document.getElementById('chat-image-preview-name');
        const imgPreviewRemove = document.getElementById('btn-chat-image-remove');
        
        const micBtn = document.getElementById('btn-chat-mic');
        const tokenCountEl = document.getElementById('chat-token-count');
        const charCountEl = document.getElementById('chat-char-count');
        
        const settingsToggle = document.getElementById('btn-chat-settings-toggle');
        const settingsDrawer = document.getElementById('chat-settings-drawer');
        const settingsClose = document.getElementById('btn-chat-settings-close');
        
        const settingSystem = document.getElementById('chat-setting-system');
        const settingTemp = document.getElementById('chat-setting-temp');
        const settingTokens = document.getElementById('chat-setting-tokens');
        const settingTopp = document.getElementById('chat-setting-topp');
        const settingStream = document.getElementById('chat-setting-stream');
        const settingMemory = document.getElementById('chat-setting-memory');
        
        const valTemp = document.getElementById('chat-val-temp');
        const valTokens = document.getElementById('chat-val-tokens');
        const valTopp = document.getElementById('chat-val-topp');

        // State Helpers
        const saveChats = () => {
            localStorage.setItem(conversationsKey, JSON.stringify(conversations));
        };

        const generateId = () => 'chat-' + Math.random().toString(36).substr(2, 9);

        // Markdown formatter with line numbers & actions
        const formatMarkdown = (text) => {
            if (!text) return '';
            let html = text;
            html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
            const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
            html = html.replace(codeBlockRegex, (match, lang, code) => {
                const uniqueId = 'code-' + Math.random().toString(36).substr(2, 9);
                const language = lang || 'javascript';
                return `
                    <div class="code-block-container" style="border: 1px solid var(--border-color); border-radius: 8px; margin: 1rem 0; overflow: hidden; background: var(--bg-primary); font-family: var(--font-mono); font-size: 0.85rem; text-align: left;">
                        <div class="code-block-header" style="background: var(--bg-secondary); padding: 0.5rem 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted); user-select:none;">
                            <span style="font-weight: 700; text-transform: uppercase;">${language}</span>
                            <div style="display: flex; gap: 0.75rem;">
                                <button onclick="navigator.clipboard.writeText(this.closest('.code-block-container').querySelector('.code-raw-content').value).then(() => toasts.show('Code copied', 'success'))" style="background: none; border: none; color: inherit; cursor: pointer;">Copy</button>
                                <button onclick="window.appInstance.downloadCode('${language}', this.closest('.code-block-container').querySelector('.code-raw-content').value)" style="background: none; border: none; color: inherit; cursor: pointer;">Download</button>
                                <button onclick="const pre = this.closest('.code-block-container').querySelector('pre'); pre.style.whiteSpace = pre.style.whiteSpace === 'pre' ? 'pre-wrap' : 'pre'" style="background: none; border: none; color: inherit; cursor: pointer;">Wrap</button>
                                <button onclick="const content = this.closest('.code-block-container').querySelector('.code-body-wrapper'); content.style.display = content.style.display === 'none' ? 'block' : 'none'; this.textContent = content.style.display === 'none' ? 'Expand' : 'Collapse';" style="background: none; border: none; color: inherit; cursor: pointer;">Collapse</button>
                            </div>
                        </div>
                        <div class="code-body-wrapper">
                            <input type="hidden" class="code-raw-content" value="${code}">
                            <pre style="margin: 0; padding: 1rem; overflow-x: auto; white-space: pre; font-family: inherit; line-height: 1.5; color: var(--text-primary);"><code style="font-family: inherit;">${code}</code></pre>
                        </div>
                    </div>
                `;
            });
            
            html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/\*([\s\S]*?)\*/g, '<em>$1</em>');
            html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.06); padding: 0.15rem 0.35rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.85em;">$1</code>');
            html = html.replace(/\n/g, '<br>');
            return html;
        };

        // Render Conversation List
        const renderHistory = () => {
            if (!historyList || !pinnedList) return;
            const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

            const listItems = conversations.filter(c => c.title.toLowerCase().includes(query));

            const buildHtml = (item) => `
                <div class="chat-history-item ${item.id === activeChatId ? 'active' : ''}" data-chat-id="${item.id}" style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0.75rem; border-radius:8px; cursor:pointer; font-size:0.85rem; margin-bottom:0.25rem; transition: background 0.2s; position:relative;" onmouseover="this.querySelector('.chat-item-actions').style.display='flex'" onmouseout="this.querySelector('.chat-item-actions').style.display='none'">
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; text-align:left;" class="chat-item-title">${item.title}</span>
                    <div class="chat-item-actions" style="display:none; gap:0.25rem; align-items:center;">
                        <button class="btn-chat-pin-toggle" style="background:none; border:none; color:var(--text-muted); padding:0; cursor:pointer; font-size:0.8rem;" title="Pin Chat">${item.pinned ? '📌' : '📍'}</button>
                        <button class="btn-chat-rename-toggle" style="background:none; border:none; color:var(--text-muted); padding:0; cursor:pointer; font-size:0.8rem;" title="Rename Chat">✏️</button>
                        <button class="btn-chat-delete-toggle" style="background:none; border:none; color:var(--color-error); padding:0; cursor:pointer; font-size:0.8rem;" title="Delete Chat">&times;</button>
                    </div>
                </div>
            `;

            pinnedList.innerHTML = listItems.filter(c => c.pinned).map(buildHtml).join('') || `<span style="font-size:0.75rem; color:var(--text-muted); padding:0.5rem 0.75rem; display:block; text-align:left;">No pinned chats</span>`;
            historyList.innerHTML = listItems.filter(c => !c.pinned).map(buildHtml).join('') || `<span style="font-size:0.75rem; color:var(--text-muted); padding:0.5rem 0.75rem; display:block; text-align:left;">No recent chats</span>`;

            // Bind Event listeners
            document.querySelectorAll('.chat-history-item').forEach(el => {
                const chatId = el.dataset.chatId;

                el.addEventListener('click', (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    switchActiveChat(chatId);
                });

                // Double click to rename
                el.addEventListener('dblclick', () => {
                    triggerRename(chatId);
                });

                // Actions handlers
                el.querySelector('.btn-chat-pin-toggle').addEventListener('click', () => {
                    const chat = conversations.find(c => c.id === chatId);
                    if (chat) {
                        chat.pinned = !chat.pinned;
                        saveChats();
                        renderHistory();
                    }
                });

                el.querySelector('.btn-chat-rename-toggle').addEventListener('click', () => {
                    triggerRename(chatId);
                });

                el.querySelector('.btn-chat-delete-toggle').addEventListener('click', () => {
                    if (confirm('Delete this conversation?')) {
                        deleteChat(chatId);
                    }
                });
            });
        };

        const triggerRename = (chatId) => {
            const chat = conversations.find(c => c.id === chatId);
            if (!chat) return;
            const newTitle = prompt('Rename conversation:', chat.title);
            if (newTitle && newTitle.trim()) {
                chat.title = newTitle.trim();
                saveChats();
                renderHistory();
                if (chatId === activeChatId) {
                    activeTitle.textContent = chat.title;
                }
            }
        };

        const deleteChat = (chatId) => {
            conversations = conversations.filter(c => c.id !== chatId);
            saveChats();
            if (activeChatId === chatId) {
                activeChatId = conversations.length > 0 ? conversations[0].id : null;
            }
            renderHistory();
            loadActiveMessages();
        };

        // Switch Active chat
        const switchActiveChat = (chatId) => {
            activeChatId = chatId;
            renderHistory();
            loadActiveMessages();
        };

        // Load Active Messages in Chat Box
        const loadActiveMessages = () => {
            if (!messagesContainer) return;
            messagesContainer.innerHTML = '';
            
            const chat = conversations.find(c => c.id === activeChatId);
            if (!chat || chat.messages.length === 0) {
                welcomePane.style.display = 'flex';
                activeTitle.textContent = 'New Conversation';
                return;
            }

            welcomePane.style.display = 'none';
            activeTitle.textContent = chat.title;

            chat.messages.forEach(msg => {
                appendMessageToContainer(msg.role, msg.content, msg.images, msg.timestamp, false);
            });
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        // UI Append Message bubble helper
        const appendMessageToContainer = (role, content, images, timestamp, isStreaming = false) => {
            welcomePane.style.display = 'none';
            
            const isUser = role === 'user';
            const bubbleId = isStreaming ? 'streaming-bubble' : 'msg-' + Math.random().toString(36).substr(2, 9);
            
            let existingBubble = document.getElementById(bubbleId);
            if (existingBubble) {
                existingBubble.querySelector('.message-text').innerHTML = formatMarkdown(content);
                return;
            }

            const wrapper = document.createElement('div');
            wrapper.id = bubbleId;
            wrapper.style.display = 'flex';
            wrapper.style.justifyContent = isUser ? 'flex-end' : 'flex-start';
            wrapper.style.width = '100%';

            const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            // Image tag markup
            let imageMarkup = '';
            if (images && images.length > 0) {
                imageMarkup = images.map(img => `
                    <div style="margin-bottom:0.5rem; max-width:200px;">
                        <img src="${img}" style="width:100%; border-radius:6px; border:1px solid var(--border-color); object-fit:cover;">
                    </div>
                `).join('');
            }

            // Actions row markup
            const actionsMarkup = isUser ? '' : `
                <div style="display:flex; gap:0.75rem; margin-top:0.5rem; font-size:0.75rem; color:var(--text-muted); user-select:none;">
                    <button class="btn-msg-copy" style="background:none; border:none; color:inherit; cursor:pointer;" onclick="navigator.clipboard.writeText(this.closest('.msg-bubble').querySelector('.msg-raw').value).then(() => toasts.show('Response copied', 'success'))">📋 Copy</button>
                    <button class="btn-msg-read" style="background:none; border:none; color:inherit; cursor:pointer;">🔊 Read Aloud</button>
                    <button class="btn-msg-like" style="background:none; border:none; color:inherit; cursor:pointer;">👍 Like</button>
                    <button class="btn-msg-dislike" style="background:none; border:none; color:inherit; cursor:pointer;">👎 Dislike</button>
                    <button class="btn-msg-retry" style="background:none; border:none; color:inherit; cursor:pointer;">🔄 Retry</button>
                </div>
            `;

            wrapper.innerHTML = `
                <div class="msg-bubble" style="max-width: 75%; text-align: left; padding: 1rem 1.25rem; border-radius: 12px; background: ${isUser ? 'var(--surface-primary)' : 'var(--bg-secondary)'}; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 0.25rem; position:relative;">
                    <input type="hidden" class="msg-raw" value="${content}">
                    <span style="font-size:0.65rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.02em;">${isUser ? 'You' : 'Assistant'}</span>
                    ${imageMarkup}
                    <div class="message-text" style="font-size:0.9rem; line-height:1.6; color:var(--text-primary); word-break:break-word;">${formatMarkdown(content)}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.25rem;">
                        <span style="font-size:0.65rem; color:var(--text-muted);">${timeStr}</span>
                    </div>
                    ${actionsMarkup}
                </div>
            `;

            // Bind read aloud voice synthesize button
            if (!isUser) {
                const readBtn = wrapper.querySelector('.btn-msg-read');
                if (readBtn) {
                    readBtn.addEventListener('click', () => {
                        if (window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                            const utterance = new SpeechSynthesisUtterance(content);
                            window.speechSynthesis.speak(utterance);
                            toasts.show('Reading response aloud...', 'info');
                        }
                    });
                }
                const likeBtn = wrapper.querySelector('.btn-msg-like');
                if (likeBtn) {
                    likeBtn.addEventListener('click', () => {
                        likeBtn.textContent = '👍 Liked';
                        toasts.show('Feedback recorded.', 'success');
                    });
                }
                const retryBtn = wrapper.querySelector('.btn-msg-retry');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        regenerateResponse();
                    });
                }
            }

            messagesContainer.appendChild(wrapper);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        // Textarea Input Autosizing & counters
        if (promptTextarea) {
            promptTextarea.addEventListener('input', () => {
                promptTextarea.style.height = 'auto';
                promptTextarea.style.height = promptTextarea.scrollHeight + 'px';
                
                const val = promptTextarea.value;
                charCountEl.textContent = val.length;
                tokenCountEl.textContent = Math.ceil(val.length / 4);

                sendBtn.disabled = val.trim().length === 0 && !uploadedImageBase64;
            });

            // Enter key binding
            promptTextarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!sendBtn.disabled) {
                        triggerSendMessage();
                    }
                }
            });
        }

        // Attach Image parsing
        if (attachBtn && fileInput) {
            attachBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    toasts.show('Only image files are supported for visual analysis.', 'warning');
                    return;
                }

                uploadedImageName = file.name;
                const reader = new FileReader();
                reader.onload = (event) => {
                    uploadedImageBase64 = event.target.result;
                    imgPreviewImg.src = uploadedImageBase64;
                    imgPreviewName.textContent = file.name;
                    imgPreviewBox.style.display = 'flex';
                    sendBtn.disabled = false;
                };
                reader.readAsDataURL(file);
            });

            if (imgPreviewRemove) {
                imgPreviewRemove.addEventListener('click', () => {
                    uploadedImageBase64 = null;
                    uploadedImageName = null;
                    imgPreviewBox.style.display = 'none';
                    fileInput.value = '';
                    sendBtn.disabled = promptTextarea.value.trim().length === 0;
                });
            }
        }

        // Speech Recognition voice dictation
        if (micBtn) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onstart = () => {
                    micBtn.textContent = '🛑';
                    toasts.show('Listening... Speak now.', 'info');
                };

                recognition.onerror = () => {
                    toasts.show('Voice input recognition error.', 'error');
                    micBtn.textContent = '🎤';
                };

                recognition.onend = () => {
                    micBtn.textContent = '🎤';
                };

                recognition.onresult = (event) => {
                    const result = event.results[0][0].transcript;
                    promptTextarea.value += result;
                    promptTextarea.dispatchEvent(new Event('input'));
                };

                micBtn.addEventListener('click', () => {
                    if (micBtn.textContent === '🛑') {
                        recognition.stop();
                    } else {
                        recognition.start();
                    }
                });
            } else {
                micBtn.style.display = 'none';
            }
        }

        // Trigger Send message
        const triggerSendMessage = async () => {
            if (isGenerating) return;

            const text = promptTextarea.value.trim();
            if (!text && !uploadedImageBase64) return;

            // Initialize active chat session if none exists
            if (!activeChatId) {
                const newId = generateId();
                const newChat = {
                    id: newId,
                    title: text ? (text.slice(0, 24) + (text.length > 24 ? '...' : '')) : 'Image Upload ' + new Date().toLocaleTimeString(),
                    messages: [],
                    pinned: false
                };
                conversations.unshift(newChat);
                activeChatId = newId;
                saveChats();
                renderHistory();
            }

            const currentChat = conversations.find(c => c.id === activeChatId);
            if (!currentChat) return;

            // Load attached images
            const imagesList = uploadedImageBase64 ? [uploadedImageBase64] : [];
            const timestamp = new Date().toISOString();

            // Append User message to local state
            const userMsg = { role: 'user', content: text, images: imagesList, timestamp };
            currentChat.messages.push(userMsg);
            
            // Clear input box
            promptTextarea.value = '';
            promptTextarea.style.height = 'auto';
            charCountEl.textContent = 0;
            tokenCountEl.textContent = 0;
            uploadedImageBase64 = null;
            uploadedImageName = null;
            imgPreviewBox.style.display = 'none';
            fileInput.value = '';
            sendBtn.disabled = true;

            loadActiveMessages();

            // Set loading indicators
            isGenerating = true;
            appendMessageToContainer('assistant', 'Thinking...', null, null, true);

            // Fetch settings params
            const system = settingSystem ? settingSystem.value : '';
            const temp = parseFloat(settingTemp.value) / 100;
            const maxTokens = parseInt(settingTokens.value);
            const topp = parseFloat(settingTopp.value) / 100;
            const stream = settingStream ? settingStream.checked : true;
            const memoryVal = settingMemory ? settingMemory.value : '20';
            const model = modelSelect.value;

            // Limit conversation context messages by memory setting
            let contextMessages = [...currentChat.messages];
            if (memoryVal !== 'unlimited') {
                const limit = parseInt(memoryVal);
                contextMessages = contextMessages.slice(-limit);
            }

            try {
                const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: contextMessages,
                        model,
                        temperature: temp,
                        maxTokens,
                        topP: topp,
                        stream,
                        systemPrompt: system
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }

                // Delete streaming thinking indicator placeholder
                const indicator = document.getElementById('streaming-bubble');
                if (indicator) indicator.remove();

                let assistantResponseText = '';

                if (stream && response.body) {
                    // Start reading stream
                    appendMessageToContainer('assistant', '', null, null, true);
                    const reader = response.body.getReader();
                    activeReader = reader;
                    const decoder = new TextDecoder('utf-8');

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        
                        // Parse Event-Stream lines
                        const lines = chunk.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const dataStr = line.slice(6).trim();
                                if (dataStr === '[DONE]') continue;
                                try {
                                    const parsed = JSON.parse(dataStr);
                                    if (parsed.text) {
                                        assistantResponseText += parsed.text;
                                        appendMessageToContainer('assistant', assistantResponseText, null, null, true);
                                    }
                                } catch (e) {
                                    // Raw text fallback
                                    assistantResponseText += dataStr;
                                    appendMessageToContainer('assistant', assistantResponseText, null, null, true);
                                }
                            }
                        }
                    }
                } else {
                    const data = await response.json();
                    assistantResponseText = data.text || '';
                }

                // Save final assistant response to history
                const finalAssistantBubble = document.getElementById('streaming-bubble');
                if (finalAssistantBubble) finalAssistantBubble.remove();

                const assistantMsg = { role: 'assistant', content: assistantResponseText, timestamp: new Date().toISOString() };
                currentChat.messages.push(assistantMsg);
                saveChats();
                loadActiveMessages();

            } catch (err) {
                console.error(err);
                toasts.show('Generation failed: ' + err.message, 'error');
                const indicator = document.getElementById('streaming-bubble');
                if (indicator) indicator.remove();
                
                // Add error fallback
                const errorMsg = { role: 'assistant', content: `Sorry, there was a connection error to the AI provider. Details: ${err.message}`, timestamp: new Date().toISOString() };
                currentChat.messages.push(errorMsg);
                saveChats();
                loadActiveMessages();
            } finally {
                isGenerating = false;
                activeReader = null;
            }
        };

        const regenerateResponse = () => {
            const currentChat = conversations.find(c => c.id === activeChatId);
            if (!currentChat || currentChat.messages.length < 2) return;
            // Pop the last assistant response
            if (currentChat.messages[currentChat.messages.length - 1].role === 'assistant') {
                currentChat.messages.pop();
            }
            saveChats();
            triggerSendMessage();
        };

        // Binding sidebar actions
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                const newId = generateId();
                const newChat = {
                    id: newId,
                    title: 'New Conversation',
                    messages: [],
                    pinned: false
                };
                conversations.unshift(newChat);
                activeChatId = newId;
                saveChats();
                renderHistory();
                loadActiveMessages();
            });
        }

        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (confirm('Clear all conversation history? This cannot be undone.')) {
                    conversations = [];
                    activeChatId = null;
                    saveChats();
                    renderHistory();
                    loadActiveMessages();
                }
            });
        }

        // Search conversations title filter
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                renderHistory();
            });
        }

        // Export history
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const blob = new Blob([JSON.stringify(conversations, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `3m_studio_chat_export_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toasts.show('Chat history exported successfully.', 'success');
            });
        }

        // Import history
        if (importBtn && importFileInput) {
            importBtn.addEventListener('click', () => importFileInput.click());
            importFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const imported = JSON.parse(event.target.result);
                        if (Array.isArray(imported)) {
                            conversations = [...imported, ...conversations];
                            saveChats();
                            renderHistory();
                            if (conversations.length > 0) {
                                switchActiveChat(conversations[0].id);
                            }
                            toasts.show('Chat history imported successfully.', 'success');
                        } else {
                            throw new Error('Invalid format: file should be a JSON array of chats');
                        }
                    } catch (err) {
                        toasts.show('Import failed: ' + err.message, 'error');
                    }
                };
                reader.readAsText(file);
            });
        }

        // Settings toggle drawers
        if (settingsToggle && settingsDrawer && settingsClose) {
            settingsToggle.addEventListener('click', () => {
                settingsDrawer.style.display = settingsDrawer.style.display === 'none' ? 'flex' : 'none';
            });
            settingsClose.addEventListener('click', () => {
                settingsDrawer.style.display = 'none';
            });
        }

        // Slider value update triggers
        if (settingTemp && valTemp) {
            settingTemp.addEventListener('input', (e) => {
                valTemp.textContent = (parseFloat(e.target.value) / 100).toFixed(1);
            });
        }
        if (settingTokens && valTokens) {
            settingTokens.addEventListener('input', (e) => {
                valTokens.textContent = e.target.value;
            });
        }
        if (settingTopp && valTopp) {
            settingTopp.addEventListener('input', (e) => {
                valTopp.textContent = (parseFloat(e.target.value) / 100).toFixed(1);
            });
        }

        // Bind sample prompt clicks
        document.querySelectorAll('.welcome-sample-prompt').forEach(el => {
            el.addEventListener('click', () => {
                promptTextarea.value = el.textContent.replace(/"/g, '');
                promptTextarea.dispatchEvent(new Event('input'));
                promptTextarea.focus();
            });
        });

        // Initialize lists rendering
        renderHistory();
        if (conversations.length > 0) {
            switchActiveChat(conversations[0].id);
        } else {
            loadActiveMessages();
        }
    }

    downloadCode(lang, code) {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `3m_script.${lang === 'javascript' ? 'js' : (lang === 'html' ? 'html' : (lang === 'css' ? 'css' : 'txt'))}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
    initDashboardLogic(defaultTab = 'analytics') {
        this.switchWorkspaceTab(defaultTab);

        // Sidebar tab selector events delegation
        const sidebar = document.querySelector('.workspace-sidebar');
        if (sidebar) {
            sidebar.querySelectorAll('[data-workspace-tab]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.workspaceTab === defaultTab);
            });
            
            sidebar.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-workspace-tab]');
                if (btn) {
                    const tabName = btn.dataset.workspaceTab;
                    sidebar.querySelectorAll('[data-workspace-tab]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.switchWorkspaceTab(tabName);
                }
            });
        }
    }

    switchWorkspaceTab(tabName) {
        this.currentWorkspaceTab = tabName;
        const pane = document.getElementById('workspace-content-pane');
        if (!pane) return;

        if (tabName === 'analytics') {
            pane.innerHTML = this.getAnalyticsPaneHTML();
            this.initAnalyticsPane();
        } else if (tabName === 'ai-studio') {
            pane.innerHTML = this.getAISpacePaneHTML();
            this.initAISpacePane();
        } else if (tabName === 'files') {
            pane.innerHTML = this.getFileExplorerPaneHTML();
            this.initFileExplorerPane();
        } else if (tabName === 'settings') {
            pane.innerHTML = this.getSettingsPaneHTML();
            this.initSettingsPane();
        } else if (tabName === 'notifications') {
            pane.innerHTML = this.getNotificationsPaneHTML();
            this.initNotificationsPane();
        }
    }

    /* =========================================================================
       ANALYTICS TAB MODULE
       ========================================================================= */
    getAnalyticsPaneHTML() {
        return `
            <div class="dashboard-header" style="padding: 1.5rem 2rem; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                <div class="dashboard-title-group" style="text-align:left;">
                    <h1 style="font-size:1.5rem; margin:0;">Workspace Analytics</h1>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin: 0.25rem 0 0 0;">Real-time performance metrics and dynamic thread trackers.</p>
                </div>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-outline btn-small" id="btn-export-workspace-json">Export JSON</button>
                    <button class="btn btn-primary btn-small" id="dashboard-sync-btn">Sync Clusters</button>
                </div>
            </div>
            <div class="workspace-pane" style="padding:2rem;">
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
                    <div class="widget-card widget-card-wide">
                        <div class="widget-header"><span>GPU Thread Utilizations (Last 12 Hours)</span></div>
                        <div class="chart-container-sim" id="dashboard-svg-chart"></div>
                    </div>
                    <div class="widget-card">
                        <div class="widget-header"><span>Active Studio Tasks</span></div>
                        <div class="task-list" id="dashboard-task-list"></div>
                        <div style="display:flex; gap:0.5rem; margin-top:1rem">
                            <input type="text" id="new-task-input" placeholder="Type new task..." style="flex:1; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color); background:rgba(0,0,0,0.1); color:var(--text-primary)">
                            <button class="btn btn-primary btn-small" id="btn-add-task">+</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initAnalyticsPane() {
        const syncBtn = document.getElementById('dashboard-sync-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                toasts.show('Connecting to active GPU render nodes...', 'info');
                setTimeout(() => {
                    toasts.show('All cluster connections verified. Sync complete.', 'success');
                    const cycleVal = document.getElementById('dash-val-cycles');
                    if (cycleVal) cycleVal.textContent = '44,912';
                    this.addSimulatedNotification('GPU Cluster synchronizations successfully completed.');
                }, 1500);
            });
        }

        const exportBtn = document.getElementById('btn-export-workspace-json');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const tasks = state.get('tasks');
                this.exportData('json', tasks, 'studio-tasks-report');
                toasts.show('Workspace report downloaded.', 'success');
            });
        }

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

        this.renderDashboardTasks();

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
            holder.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); margin:0;">All tasks completed.</p>`;
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

    /* =========================================================================
       AI CREATIVE STUDIO TAB MODULE
       ========================================================================= */
    getAISpacePaneHTML() {
        return `
            <div class="dashboard-header" style="padding: 1.25rem 2rem; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                <div class="dashboard-title-group" style="text-align:left;">
                    <h1 style="font-size:1.5rem; margin:0;">AI Creative Studio</h1>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin: 0.25rem 0 0 0;">Generate high-fidelity assets using our neural composition models.</p>
                </div>
                <div class="token-counter-badge" id="ai-token-count" style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted);">Tokens: 0 / 100,000</div>
            </div>
            <div class="workspace-split-view">
                <!-- AI Chat Side -->
                <div class="workspace-pane left" style="display:flex; flex-direction:column; justify-content:space-between; height:100%;">
                    <div class="ai-chat-container">
                        <div class="ai-chat-messages" id="ai-chat-history">
                            <div class="ai-message system">
                                <strong>3M Neural Engine:</strong> Welcome to the spatial composition workspace. Choose a generation template or start typing in the chat below.
                            </div>
                        </div>
                        <div class="ai-chat-input-bar">
                            <input type="text" id="ai-chat-prompt-input" placeholder="Ask AI to design, animate, or translate...">
                            <button class="btn btn-primary" id="btn-send-ai-prompt">Generate</button>
                            <button class="btn btn-outline" id="btn-stop-ai-gen" style="display:none; color:var(--color-error); border-color:var(--color-error);">Stop</button>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; gap:1rem;">
                        <select id="prompt-template-select" style="background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-secondary); padding:0.45rem; border-radius:6px; font-size:0.8rem; flex:1; outline:none;">
                            <option value="">-- Apply Prompt Template --</option>
                            <option value="mesh">Generate Obsidian Mesh 3D geometry</option>
                            <option value="music">Compose dynamic Cyberpunk ambient audio</option>
                            <option value="code">Write threeJS particle rotation loop</option>
                            <option value="email">Write release announcement email to users</option>
                        </select>
                        <div style="display:flex; gap:0.5rem;">
                            <button class="btn btn-outline btn-small" id="btn-export-chat">Export Chat</button>
                            <button class="btn btn-outline btn-small" id="btn-regenerate-ai">Regenerate</button>
                        </div>
                    </div>
                </div>
                <!-- Controls & Property Panel -->
                <div class="workspace-properties">
                    <div class="properties-group">
                        <div class="properties-title">AI Image Generator</div>
                        <input type="text" id="ai-image-prompt" placeholder="Sleek glassmorphic sphere..." style="width:100%; padding:0.5rem; border-radius:6px; border:1px solid var(--border-color); background:rgba(0,0,0,0.1); color:var(--text-primary); margin-bottom:0.5rem; font-size:0.85rem;">
                        <button class="btn btn-primary w-full btn-small" id="btn-generate-ai-image">Generate Image Mockup</button>
                    </div>
                    <div class="properties-group">
                        <div class="properties-title">AI Video Composer</div>
                        <input type="text" id="ai-video-prompt" placeholder="Floating liquid chrome loop..." style="width:100%; padding:0.5rem; border-radius:6px; border:1px solid var(--border-color); background:rgba(0,0,0,0.1); color:var(--text-primary); margin-bottom:0.5rem; font-size:0.85rem;">
                        <button class="btn btn-primary w-full btn-small" id="btn-generate-ai-video">Compose Spatial Video</button>
                    </div>
                    <div class="properties-group">
                        <div class="properties-title">AI Soundcompose</div>
                        <input type="text" id="ai-music-prompt" placeholder="Dark ambient synthwave pads..." style="width:100%; padding:0.5rem; border-radius:6px; border:1px solid var(--border-color); background:rgba(0,0,0,0.1); color:var(--text-primary); margin-bottom:0.5rem; font-size:0.85rem;">
                        <button class="btn btn-primary w-full btn-small" id="btn-generate-ai-sound">Generate Spatial Audio</button>
                    </div>
                    <div class="properties-group">
                        <div class="properties-title">Interactive AI Code</div>
                        <input type="text" id="ai-code-prompt" placeholder="Rotate canvas mesh matrix..." style="width:100%; padding:0.5rem; border-radius:6px; border:1px solid var(--border-color); background:rgba(0,0,0,0.1); color:var(--text-primary); margin-bottom:0.5rem; font-size:0.85rem;">
                        <button class="btn btn-primary w-full btn-small" id="btn-generate-ai-code">Generate JS Script</button>
                    </div>
                </div>
            </div>
        `;
    }

    initAISpacePane() {
        const promptInput = document.getElementById('ai-chat-prompt-input');
        const sendBtn = document.getElementById('btn-send-ai-prompt');
        const stopBtn = document.getElementById('btn-stop-ai-gen');
        const templateSelect = document.getElementById('prompt-template-select');
        const chatHistory = document.getElementById('ai-chat-history');

        this.aiGenerationActive = false;
        this.tokenCounter = 1240;
        this.updateTokenBadge();

        if (sendBtn && promptInput) {
            sendBtn.addEventListener('click', () => {
                const text = promptInput.value.trim();
                if (text) {
                    this.appendChatMessage('user', text);
                    promptInput.value = '';
                    this.simulateStreamingAIResponse(text);
                }
            });
            promptInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendBtn.click();
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                if (this.aiGenerationActive) {
                    this.aiGenerationActive = false;
                    toasts.show('Generation stopped by user.', 'warning');
                    if (sendBtn) sendBtn.style.display = 'block';
                    stopBtn.style.display = 'none';
                }
            });
        }

        if (templateSelect && promptInput) {
            templateSelect.addEventListener('change', (e) => {
                const opt = e.target.value;
                if (opt === 'mesh') promptInput.value = 'Generate a high-fidelity glTF mesh representing an Obsidian Sphere with dynamic refract index.';
                else if (opt === 'music') promptInput.value = 'Compose a dark Synthwave audio track at 110bpm with spatial depth nodes.';
                else if (opt === 'code') promptInput.value = 'Create a WebGL2 render rotation matrix that cycles particle coordinates in real-time.';
                else if (opt === 'email') promptInput.value = 'Draft a corporate product launch email introducing the Cinema Render Engine.';
            });
        }

        // Sub-generators triggers
        const triggerImage = document.getElementById('btn-generate-ai-image');
        if (triggerImage) {
            triggerImage.addEventListener('click', () => {
                const p = document.getElementById('ai-image-prompt').value || 'glassmorphic asset';
                this.appendChatMessage('user', `Generate AI image for: ${p}`);
                this.simulateStreamingAIResponse(`🎨 AI Image Generator outputs 3D asset texture matching prompt: "${p}". Texture mapped successfully.`);
            });
        }

        const triggerVideo = document.getElementById('btn-generate-ai-video');
        if (triggerVideo) {
            triggerVideo.addEventListener('click', () => {
                const p = document.getElementById('ai-video-prompt').value || 'liquid metal loop';
                this.appendChatMessage('user', `Compose spatial video for: ${p}`);
                this.simulateStreamingAIResponse(`🎬 Spatial Video loops compiled: [240 frames, 60fps] for prompt "${p}". Saved to workspace assets.`);
            });
        }

        const triggerSound = document.getElementById('btn-generate-ai-sound');
        if (triggerSound) {
            triggerSound.addEventListener('click', () => {
                const p = document.getElementById('ai-music-prompt').value || 'synth pad loop';
                this.appendChatMessage('user', `Compose dynamic audio for: ${p}`);
                this.simulateStreamingAIResponse(`🎵 Neural sound wave field synthesized for: "${p}". Output is mapped to listener coordinates.`);
            });
        }

        const triggerCode = document.getElementById('btn-generate-ai-code');
        if (triggerCode) {
            triggerCode.addEventListener('click', () => {
                const p = document.getElementById('ai-code-prompt').value || 'mesh rotation';
                this.appendChatMessage('user', `Generate WebGL script for: ${p}`);
                this.simulateStreamingAIResponse(`💻 Script generated: \`\`\`javascript\n// Matrix conversion for: ${p}\nfunction rotateMatrix(v) {\n   return [v[0]*Math.cos(0.01), v[1]*Math.sin(0.01)];\n}\n\`\`\``);
            });
        }

        const exportChat = document.getElementById('btn-export-chat');
        if (exportChat) {
            exportChat.addEventListener('click', () => {
                if (chatHistory) {
                    const text = chatHistory.innerText;
                    this.exportData('txt', text, 'ai-chat-history');
                    toasts.show('Chat history downloaded.', 'success');
                }
            });
        }

        const regenerateBtn = document.getElementById('btn-regenerate-ai');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                this.appendChatMessage('user', 'Please regenerate the previous output.');
                this.simulateStreamingAIResponse('Re-evaluating neural matrices... Here is the optimized spatial configuration.');
            });
        }
    }

    appendChatMessage(sender, text) {
        const chatHistory = document.getElementById('ai-chat-history');
        if (!chatHistory) return;

        const msg = document.createElement('div');
        msg.className = `ai-message ${sender === 'user' ? 'user' : 'system'}`;
        msg.innerHTML = sender === 'user' ? `<strong>You:</strong> ${text}` : `<strong>3M Engine:</strong> ${text}`;
        
        // Add Copy button to system responses
        if (sender !== 'user') {
            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copy';
            copyBtn.style.cssText = 'background:none; border:1px solid var(--border-color); font-size:0.65rem; padding:0.1rem 0.3rem; border-radius:4px; margin-left:0.5rem; cursor:pointer; color:var(--text-muted);';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(text);
                toasts.show('Response copied to clipboard.', 'success');
            });
            msg.appendChild(copyBtn);
        }

        chatHistory.appendChild(msg);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    simulateStreamingAIResponse(promptText) {
        const sendBtn = document.getElementById('btn-send-ai-prompt');
        const stopBtn = document.getElementById('btn-stop-ai-gen');
        if (sendBtn) sendBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'block';

        this.aiGenerationActive = true;
        
        // Dynamic responses matching prompt words
        let baseResponse = 'Neural processor executed spatial calculations. Asset coordinates mapped. Compiled successfully.';
        if (promptText.toLowerCase().includes('mesh') || promptText.toLowerCase().includes('obsidian')) {
            baseResponse = 'Obsidian Sphere mesh compiled. Geometry contains 42,000 polygon vertices. Material roughness set to 0.12. Spatial coordinates baked to global bucket.';
        } else if (promptText.toLowerCase().includes('music') || promptText.toLowerCase().includes('audio')) {
            baseResponse = 'Cyberpunk audio composite generated at 110bpm. 32-bit depth spatial channels allocated. Ambient noise cancelers successfully synchronized.';
        } else if (promptText.toLowerCase().includes('code') || promptText.toLowerCase().includes('threejs')) {
            baseResponse = 'WebGL rotation matrix complete:\n```javascript\nrequestAnimationFrame(function animate(t) {\n   mesh.rotation.y = t * 0.001;\n   renderer.render(scene, camera);\n});\n```';
        }

        const chatHistory = document.getElementById('ai-chat-history');
        if (!chatHistory) return;

        const systemMsg = document.createElement('div');
        systemMsg.className = 'ai-message system';
        systemMsg.innerHTML = `<strong>3M Engine:</strong> <span class="streaming-text"></span>`;
        chatHistory.appendChild(systemMsg);
        
        const streamContainer = systemMsg.querySelector('.streaming-text');
        let index = 0;

        const interval = setInterval(() => {
            if (!this.aiGenerationActive) {
                clearInterval(interval);
                return;
            }

            if (index < baseResponse.length) {
                streamContainer.textContent += baseResponse[index];
                index++;
                this.tokenCounter += 4;
                this.updateTokenBadge();
                chatHistory.scrollTop = chatHistory.scrollHeight;
            } else {
                clearInterval(interval);
                this.aiGenerationActive = false;
                if (sendBtn) sendBtn.style.display = 'block';
                if (stopBtn) stopBtn.style.display = 'none';

                // Add copy button
                const copyBtn = document.createElement('button');
                copyBtn.textContent = 'Copy';
                copyBtn.style.cssText = 'background:none; border:1px solid var(--border-color); font-size:0.65rem; padding:0.1rem 0.3rem; border-radius:4px; margin-left:0.5rem; cursor:pointer; color:var(--text-muted);';
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(baseResponse);
                    toasts.show('Response copied to clipboard.', 'success');
                });
                systemMsg.appendChild(copyBtn);
            }
        }, 15);
    }

    updateTokenBadge() {
        const badge = document.getElementById('ai-token-count');
        if (badge) {
            badge.textContent = `Tokens: ${this.tokenCounter.toLocaleString()} / 100,000`;
        }
    }

    /* =========================================================================
       FILE EXPLORER TAB MODULE
       ========================================================================= */
    getFileExplorerPaneHTML() {
        return `
            <div class="dashboard-header" style="padding: 1.5rem 2rem; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                <div class="dashboard-title-group" style="text-align:left;">
                    <h1 style="font-size:1.5rem; margin:0;">File Explorer</h1>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin:0.25rem 0 0 0;">Manage spatial geometry nodes, audio loops, and project exports.</p>
                </div>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-outline btn-small" id="btn-add-folder">+ Folder</button>
                    <button class="btn btn-primary btn-small" id="btn-upload-file">Upload File</button>
                </div>
            </div>
            <div class="workspace-pane" style="padding:2rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem; align-items:center; gap:2rem;">
                    <input type="search" id="file-search" placeholder="Filter files..." style="padding:0.4rem 1rem; border-radius:100px; border:1px solid var(--border-color); background:rgba(0,0,0,0.2); color:var(--text-primary); font-size:0.85rem; width:220px; outline:none;">
                    <div style="width:250px; text-align:right;">
                        <span id="file-usage-label" style="font-size:0.75rem; color:var(--text-secondary);">Storage usage: 24.5 MB / 100 MB</span>
                        <div class="upgrade-progress-bar" style="margin-top:0.25rem;"><div class="progress-fill" id="file-usage-bar" style="width:24%;"></div></div>
                    </div>
                </div>
                <div class="file-explorer-grid" id="explorer-files-grid">
                    <!-- Files loaded dynamically -->
                </div>
            </div>
        `;
    }

    initFileExplorerPane() {
        this.renderFileExplorerGrid();

        const searchInput = document.getElementById('file-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase();
                const list = state.get('files');
                const filtered = list.filter(f => f.name.toLowerCase().includes(q));
                this.renderFileExplorerGrid(filtered);
            });
        }

        const uploadBtn = document.getElementById('btn-upload-file');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                const name = prompt('Enter filename to upload (e.g. cyber-prism.obj):');
                if (name) {
                    const list = state.get('files');
                    list.push({ name: name, type: 'model', size: '1.2 MB', icon: '📦' });
                    state.set('files', list);
                    this.renderFileExplorerGrid();
                    toasts.show('File uploaded successfully.', 'success');
                }
            });
        }

        const addFolderBtn = document.getElementById('btn-add-folder');
        if (addFolderBtn) {
            addFolderBtn.addEventListener('click', () => {
                const name = prompt('Enter folder name:');
                if (name) {
                    const list = state.get('files');
                    list.unshift({ name: name, type: 'folder', size: '-', icon: '📁' });
                    state.set('files', list);
                    this.renderFileExplorerGrid();
                    toasts.show('Folder created.', 'success');
                }
            });
        }
    }

    renderFileExplorerGrid(customList = null) {
        const grid = document.getElementById('explorer-files-grid');
        if (!grid) return;

        const list = customList || state.get('files');
        if (list.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; padding: 3rem; text-align:center; color:var(--text-muted);">No files inside this storage directory.</div>`;
            return;
        }

        grid.innerHTML = list.map((file, idx) => `
            <div class="file-explorer-card" data-index="${idx}">
                <div class="file-icon-large">${file.icon}</div>
                <div class="file-name-label" title="${file.name}">${file.name}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top:0.25rem;">${file.size}</div>
                <div class="file-actions-menu">
                    <span class="file-action-trigger" data-action-idx="${idx}">⋮</span>
                </div>
            </div>
        `).join('');

        // Listen for actions clicks
        grid.querySelectorAll('.file-action-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(e.target.dataset.actionIdx);
                const filesList = state.get('files');
                const file = filesList[idx];

                const act = prompt(`Action for "${file.name}":\n1. Rename\n2. Delete\n3. Duplicate\nEnter option number (1-3):`);
                if (act === '1') {
                    const newName = prompt('Enter new filename:', file.name);
                    if (newName) {
                        file.name = newName;
                        state.set('files', filesList);
                        this.renderFileExplorerGrid();
                        toasts.show('File renamed.', 'success');
                    }
                } else if (act === '2') {
                    filesList.splice(idx, 1);
                    state.set('files', filesList);
                    this.renderFileExplorerGrid();
                    toasts.show('File deleted.', 'info');
                } else if (act === '3') {
                    const copy = { ...file, name: `Copy of ${file.name}` };
                    filesList.splice(idx + 1, 0, copy);
                    state.set('files', filesList);
                    this.renderFileExplorerGrid();
                    toasts.show('File duplicated.', 'success');
                }
            });
        });
    }

    /* =========================================================================
       STUDIO SETTINGS TAB MODULE
       ========================================================================= */
    getSettingsPaneHTML() {
        return `
            <div class="dashboard-header" style="padding: 1.5rem 2rem; border-bottom:1px solid var(--border-color);">
                <div class="dashboard-title-group" style="text-align:left;">
                    <h1 style="font-size:1.5rem; margin:0;">Studio Settings</h1>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin:0.25rem 0 0 0;">Configure your profile, accessibility parameters, and dev options.</p>
                </div>
            </div>
            <div class="workspace-pane" style="padding:2rem; max-width:600px; text-align:left;">
                <div class="properties-group">
                    <div class="properties-title">User Profile</div>
                    <div style="display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1rem;">
                        <label style="font-size:0.8rem; font-weight:600;">Display Name</label>
                        <input type="text" id="settings-name" value="Alexander Vance" style="padding:0.5rem; border-radius:6px; border:1px solid var(--border-color); background:rgba(0,0,0,0.1); color:var(--text-primary); outline:none;">
                        <label style="font-size:0.8rem; font-weight:600;">Role Description</label>
                        <input type="text" id="settings-role" value="Lead Architect" style="padding:0.5rem; border-radius:6px; border:1px solid var(--border-color); background:rgba(0,0,0,0.1); color:var(--text-primary); outline:none;">
                    </div>
                    <button class="btn btn-primary btn-small" id="btn-save-profile">Save Changes</button>
                </div>
                <div class="properties-group">
                    <div class="properties-title">Experimental Features</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <span style="font-size:0.85rem;">Ray-Tracing Previews</span>
                        <input type="checkbox" id="exp-raytrace" style="width:20px; height:20px; cursor:pointer;">
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.85rem;">Spatial CDN Preloading</span>
                        <input type="checkbox" id="exp-preload" style="width:20px; height:20px; cursor:pointer;">
                    </div>
                </div>
                <div class="properties-group">
                    <div class="properties-title">Developer Controls</div>
                    <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:1rem;">Reset settings data in LocalDatabase.</p>
                    <button class="btn btn-outline btn-small" id="btn-reset-db-settings" style="color:var(--color-error); border-color:rgba(239, 68, 68, 0.4);">Reset Local Database</button>
                </div>
            </div>
        `;
    }

    initSettingsPane() {
        const prof = state.get('profile') || {};
        const nameInput = document.getElementById('settings-name');
        const roleInput = document.getElementById('settings-role');
        const saveBtn = document.getElementById('btn-save-profile');

        if (nameInput && prof.name) nameInput.value = prof.name;
        if (roleInput && prof.role) roleInput.value = prof.role;

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                prof.name = nameInput.value.trim();
                prof.role = roleInput.value.trim();
                state.set('profile', prof);
                
                // Update workspace avatar strings
                const avName = document.getElementById('workspace-user-name');
                const avRole = document.getElementById('workspace-user-role');
                const avLogo = document.getElementById('workspace-user-avatar');
                if (avName) avName.textContent = prof.name;
                if (avRole) avRole.textContent = prof.role;
                if (avLogo && prof.name) avLogo.textContent = prof.name.slice(0,2).toUpperCase();

                toasts.show('Profile configurations saved.', 'success');
            });
        }

        const resetBtn = document.getElementById('btn-reset-db-settings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Clear all settings and local cache?')) {
                    state.clear();
                    toasts.show('LocalDatabase cleared. Reloading...', 'info');
                    setTimeout(() => window.location.reload(), 1000);
                }
            });
        }
    }

    /* =========================================================================
       NOTIFICATIONS TAB MODULE
       ========================================================================= */
    getNotificationsPaneHTML() {
        return `
            <div class="dashboard-header" style="padding: 1.5rem 2rem; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                <div class="dashboard-title-group" style="text-align:left;">
                    <h1 style="font-size:1.5rem; margin:0;">Notifications Center</h1>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin:0.25rem 0 0 0;">Platform events, team alerts, and GPU server logs.</p>
                </div>
                <button class="btn btn-outline btn-small" id="btn-pane-clear-notifs">Clear All</button>
            </div>
            <div class="workspace-pane" style="padding:2rem;">
                <div style="display:flex; flex-direction:column; gap:0.75rem;" id="pane-notifications-list">
                    <!-- Notifications list will render here -->
                </div>
            </div>
        `;
    }

    initNotificationsPane() {
        this.renderWorkspaceNotifications();
        
        const clearBtn = document.getElementById('btn-pane-clear-notifs');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                state.set('notifications', []);
                this.renderWorkspaceNotifications();
                this.updateNotificationsBadge();
                toasts.show('All notifications cleared.', 'info');
            });
        }
    }

    renderWorkspaceNotifications() {
        const holder = document.getElementById('pane-notifications-list');
        if (!holder) return;

        const list = state.get('notifications') || [];
        if (list.length === 0) {
            holder.innerHTML = `<div style="padding: 3rem; text-align:center; color:var(--text-muted);">No new notifications.</div>`;
            return;
        }

        holder.innerHTML = list.map(item => `
            <div class="notif-item">
                <div class="notif-dot ${item.read ? 'read' : ''}"></div>
                <div class="notif-details">
                    <span class="notif-title">${item.title}</span>
                    <span class="notif-time">${item.time}</span>
                </div>
            </div>
        `).join('');
    }

    /* =========================================================================
       GLOBAL UTILITIES FOR PWA & EXPORTS
       ========================================================================= */
    renderNotificationsList() {
        const holder = document.getElementById('modal-notifications-list-container');
        if (!holder) return;

        const list = state.get('notifications') || [];
        if (list.length === 0) {
            holder.innerHTML = `<p class="search-placeholder-text">No active alerts at this time.</p>`;
            return;
        }

        holder.innerHTML = list.map(item => `
            <div class="notif-item" style="border-radius:6px; padding:0.6rem 0.8rem;">
                <div class="notif-dot ${item.read ? 'read' : ''}"></div>
                <div class="notif-details">
                    <span class="notif-title" style="font-size:0.8rem;">${item.title}</span>
                    <span class="notif-time" style="font-size:0.65rem;">${item.time}</span>
                </div>
            </div>
        `).join('');
    }

    markNotificationsAsRead() {
        const list = state.get('notifications') || [];
        list.forEach(n => n.read = true);
        state.set('notifications', list);
        this.updateNotificationsBadge();
    }

    updateNotificationsBadge() {
        const badge = document.getElementById('nav-notif-badge');
        if (!badge) return;

        const list = state.get('notifications') || [];
        const unread = list.filter(n => !n.read).length;
        
        if (unread > 0) {
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    addSimulatedNotification(title) {
        const list = state.get('notifications') || [];
        const newId = list.length > 0 ? Math.max(...list.map(n => n.id)) + 1 : 1;
        list.unshift({ id: newId, title: title, time: 'Just now', read: false });
        state.set('notifications', list);
        this.updateNotificationsBadge();
        
        // Show as visual toast too
        toasts.show(title, 'info');
    }

    initPWAInstaller() {
        let deferredPrompt;
        const installBtn = document.getElementById('pwa-install-btn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            if (installBtn) {
                installBtn.style.display = 'block';
            }
        });

        if (installBtn) {
            installBtn.addEventListener('click', () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            toasts.show('3M Studio installed successfully!', 'success');
                        }
                        deferredPrompt = null;
                        installBtn.style.display = 'none';
                    });
                }
            });
        }

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('3M Studio PWA Service Worker Registered.'))
                .catch((err) => console.log('SW Registration failed: ', err));
        }
    }

    exportData(format, data, filename) {
        let content = '';
        let mimeType = 'text/plain';
        
        if (format === 'json') {
            content = JSON.stringify(data, null, 2);
            mimeType = 'application/json';
        } else if (format === 'txt') {
            content = data;
            mimeType = 'text/plain';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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

    executeCommand(cmd) {
        if (cmd === 'theme') {
            this.theme.toggle();
            toasts.show('Theme toggled.', 'info');
        } else if (cmd === 'reset') {
            if (confirm('Clear local database configuration?')) {
                state.clear();
                toasts.show('LocalDatabase cleared. Reloading...', 'info');
                setTimeout(() => window.location.reload(), 1000);
            }
        }
    }
}

// Instantiate App
document.addEventListener('DOMContentLoaded', () => {
    window.appInstance = new App();
});
