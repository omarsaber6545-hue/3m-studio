const i18nDictionary = {
    en: {
        nav_home: "Home",
        nav_pricing: "Pricing",
        nav_about: "About",
        nav_login: "Login",
        nav_dashboard: "Dashboard",
        cookie_text: "🍪 We use cookies to enhance your experience, maintain session tokens, and analyze AI performance metrics.",
        cookie_accept: "Accept"
    },
    ar: {
        nav_home: "الرئيسية",
        nav_pricing: "الأسعار",
        nav_about: "من نحن",
        nav_login: "دخول",
        nav_dashboard: "لوحة التحكم",
        cookie_text: "🍪 نحن نستخدم ملفات تعريف الارتباط لتحسين تجربة عملك، ومراقبة الجلسات، وتحليل مقاييس الأداء.",
        cookie_accept: "قبول"
    }
};

const languageManager = {
    current: 'en',
    init() {
        this.current = window.storage.get('3m_lang') || 'en';
        this.apply(this.current);
        
        window.addEventListener('DOMContentLoaded', () => {
            const toggleBtn = document.getElementById('btn-lang-toggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    const target = this.current === 'en' ? 'ar' : 'en';
                    this.apply(target);
                });
            }
            this.translateDOM();
            this.updateIcons();
        });
    },
    apply(lang) {
        this.current = lang;
        window.storage.set('3m_lang', lang);
        
        const isRtl = lang === 'ar';
        document.documentElement.lang = lang;
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        
        const rtlStylesheet = document.getElementById('rtl-style');
        if (rtlStylesheet) {
            rtlStylesheet.disabled = !isRtl;
        }
        
        this.translateDOM();
        this.updateIcons();
    },
    translateDOM() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.dataset.i18n;
            const text = i18nDictionary[this.current]?.[key];
            if (text) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = text;
                } else {
                    el.textContent = text;
                }
            }
        });
    },
    updateIcons() {
        const enLabel = document.querySelector('.lang-text-en');
        const arLabel = document.querySelector('.lang-text-ar');
        if (enLabel && arLabel) {
            if (this.current === 'en') {
                enLabel.style.display = 'block';
                arLabel.style.display = 'none';
            } else {
                enLabel.style.display = 'none';
                arLabel.style.display = 'block';
            }
        }
    }
};

languageManager.init();
window.language = languageManager;
