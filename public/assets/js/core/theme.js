const themeManager = {
    current: 'dark',
    init() {
        this.current = window.storage.get('3m_theme') || 'dark';
        this.apply(this.current);
        
        // Wait for DOM to register toggle button triggers
        window.addEventListener('DOMContentLoaded', () => {
            const toggleBtn = document.getElementById('btn-theme-toggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    const target = this.current === 'dark' ? 'light' : 'dark';
                    this.apply(target);
                });
            }
            this.updateIcons();
        });
    },
    apply(themeName) {
        this.current = themeName;
        window.storage.set('3m_theme', themeName);
        
        const stylesheet = document.getElementById('theme-style');
        if (stylesheet) {
            stylesheet.href = `/assets/css/themes/${themeName}.css`;
        }
        
        this.updateIcons();
    },
    updateIcons() {
        const darkIcon = document.querySelector('.theme-icon-dark');
        const lightIcon = document.querySelector('.theme-icon-light');
        
        if (darkIcon && lightIcon) {
            if (this.current === 'dark') {
                darkIcon.style.display = 'block';
                lightIcon.style.display = 'none';
            } else {
                darkIcon.style.display = 'none';
                lightIcon.style.display = 'block';
            }
        }
    }
};

themeManager.init();
window.theme = themeManager;
