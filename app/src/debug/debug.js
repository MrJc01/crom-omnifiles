/**
 * CROMVA OMNIFILES DEBUG LOGGER
 * 
 * Adapted for OmniFiles React App.
 * Access via console: OmniDebug.toggle()
 */

const OmniDebug = {
    enabled: true,
    logHistory: [],
    maxHistory: 100,

    styles: {
        click: 'background: #3b82f6; color: white; padding: 2px 6px; border-radius: 3px;',
        input: 'background: #10b981; color: white; padding: 2px 6px; border-radius: 3px;',
        function: 'background: #f59e0b; color: black; padding: 2px 6px; border-radius: 3px;',
        state: 'background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 3px;',
        error: 'background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px;',
        info: 'background: #6b7280; color: white; padding: 2px 6px; border-radius: 3px;'
    },

    log(type, message, data = null) {
        if (!this.enabled) return;

        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const style = this.styles[type] || this.styles.info;

        const entry = { timestamp, type, message, data };
        this.logHistory.push(entry);
        if (this.logHistory.length > this.maxHistory) this.logHistory.shift();

        console.groupCollapsed(`%c${type.toUpperCase()}%c ${message}`, style, 'color: inherit;');
        console.log('⏰ Time:', timestamp);
        if (data) {
            console.log('📦 Data:', data);
        }
        console.trace('📍 Stack:');
        console.groupEnd();
    },

    toggle() {
        this.enabled = !this.enabled;
        console.log(`%c🔧 OmniDebug ${this.enabled ? 'ACTIVATED' : 'DEACTIVATED'}`,
            `font-size: 14px; font-weight: bold; color: ${this.enabled ? '#10b981' : '#ef4444'};`);
        return this.enabled;
    },

    showHistory() {
        console.table(this.logHistory);
    },

    clear() {
        this.logHistory = [];
        console.clear();
        console.log('%c🧹 Debug history cleared', 'color: #6b7280;');
    },

    showState() {
        if (!window.OmniFiles) {
            console.warn("OmniFiles context not found on window.");
            return;
        }
        const s = window.OmniFiles.state;
        console.group('%c📊 CURRENT APP STATE', this.styles.state);
        console.log('activeWorkspace:', s.activeWorkspace);
        console.log('currentPath:', s.currentPath);
        console.log('files:', s.files);
        console.log('workspaces:', s.workspaces);
        console.log('history:', s.history);
        console.groupEnd();
    },

    init() {
        // Intercept Clicks
        document.addEventListener('click', (e) => {
            const target = e.target;
            const info = {
                tagName: target.tagName,
                id: target.id || null,
                className: typeof target.className === 'string' ? target.className : null,
                text: target.innerText?.substring(0, 50) || null,
            };
            this.log('click', `Click on <${target.tagName}>${target.id ? '#' + target.id : ''}`, info);
        }, true);

        // Monitor Functions if exposed
        if (window.OmniFiles) {
            const actions = window.OmniFiles.actions;
            for (const key in actions) {
                if (typeof actions[key] === 'function') {
                    // Simple wrapper logging (careful with recursion if actions call other actions)
                    // For safety, we won't wrap automatically here to avoid side-effects in React
                    // But we can log manual calls.
                }
            }
        }

        console.log('%c🚀 OmniDebug initialized! Use OmniDebug.toggle() to toggle',
            'font-size: 12px; color: #3b82f6;');
    }
};

window.OmniDebug = OmniDebug;
OmniDebug.init();

export default OmniDebug;
