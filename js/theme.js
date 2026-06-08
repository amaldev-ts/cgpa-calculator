// Theme Management
const ThemeManager = {
    init() {
        const saved = localStorage.getItem('gpa-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');
        this.set(theme);

        document.getElementById('themeToggle').addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            this.set(current === 'dark' ? 'light' : 'dark');
        });
    },

    set(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('gpa-theme', theme);
        const icon = document.getElementById('themeIcon');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
};

ThemeManager.init();