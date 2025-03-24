/**
 * Main application module for the CPQ Editor
 * Initializes all components and manages the application lifecycle
 */
const CPQEditor = (function() {
    /**
     * Initialize the application
     */
    function init() {
        // Initialize components
        MentionSystem.init();
        TextEditor.init();
        EditorToolbar.init();
        Navigation.init();
        PageManager.init();
        
        // Set up global events
        setupGlobalEvents();
        
        // Log initialization
        console.log('CPQ Editor initialized');
    }
    
    /**
     * Set up global event listeners
     */
    function setupGlobalEvents() {
        // Prevent browser's default context menu
        document.addEventListener('contextmenu', function(e) {
            // Only prevent default in editable areas
            if (Utils.findParent(e.target, '[contenteditable="true"]')) {
                e.preventDefault();
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl+S for save
            if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                
                // Trigger save action
                const saveBtn = document.getElementById('save-template');
                if (saveBtn) {
                    saveBtn.click();
                }
            }
        });
        
        // Handle window unload
        window.addEventListener('beforeunload', function(e) {
            // Check if there are unsaved changes
            const autoSaveStatus = StateManager.get('ui.autoSaveStatus');
            
            if (autoSaveStatus === 'saving') {
                // Show confirmation dialog
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }
    
    /**
     * Get application state
     * @returns {Object} Current application state
     */
    function getState() {
        return StateManager.getState();
    }
    
    /**
     * Save application state
     * @returns {Promise} Promise that resolves when save is complete
     */
    function saveState() {
        return new Promise((resolve, reject) => {
            try {
                // Set saving status
                StateManager.update('ui.autoSaveStatus', 'saving');
                
                // Simulate API call
                setTimeout(() => {
                    // Store in localStorage for demo
                    const state = StateManager.getState();
                    localStorage.setItem('cpq-editor-state', JSON.stringify(state));
                    
                    // Update status
                    StateManager.update('ui.autoSaveStatus', 'saved');
                    resolve(true);
                }, 500);
            } catch (error) {
                StateManager.update('ui.autoSaveStatus', 'error');
                reject(error);
            }
        });
    }
    
    /**
     * Load application state
     * @returns {Promise} Promise that resolves when load is complete
     */
    function loadState() {
        return new Promise((resolve, reject) => {
            try {
                // Get from localStorage
                const savedState = localStorage.getItem('cpq-editor-state');
                
                if (savedState) {
                    const state = JSON.parse(savedState);
                    
                    // Apply to state manager
                    Object.entries(state).forEach(([key, value]) => {
                        StateManager.update(key, value);
                    });
                    
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Reset the editor
     */
    function reset() {
        // Reset state
        StateManager.reset();
        
        // Clear localStorage
        localStorage.removeItem('cpq-editor-state');
        
        // Reload UI
        TextEditor.init();
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        getState,
        saveState,
        loadState,
        reset
    };
})();