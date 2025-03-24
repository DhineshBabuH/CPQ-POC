/**
 * Navigation module for the CPQ Editor
 * Handles the top navigation bar and tab switching
 */
const Navigation = (function() {
    // DOM elements
    let templateNameInput;
    let saveTemplateBtn;
    let deleteTemplateBtn;
    let navTabs;
    let saveNextBtn;
    let publishBtn;
    let autoSaveIndicator;
    
    /**
     * Initialize the navigation
     */
    function init() {
        // Get DOM elements
        templateNameInput = document.getElementById('template-name');
        saveTemplateBtn = document.getElementById('save-template');
        deleteTemplateBtn = document.getElementById('delete-template');
        navTabs = document.querySelectorAll('.nav-tab');
        saveNextBtn = document.getElementById('save-next-btn');
        publishBtn = document.getElementById('publish-btn');
        autoSaveIndicator = document.getElementById('auto-save-indicator');
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize from state
        updateFromState();
    }
    
    /**
     * Set up navigation event listeners
     */
    function setupEventListeners() {
        // Template name input
        if (templateNameInput) {
            templateNameInput.addEventListener('change', handleTemplateName);
            templateNameInput.addEventListener('blur', handleTemplateName);
        }
        
        // Save template button
        if (saveTemplateBtn) {
            saveTemplateBtn.addEventListener('click', handleSaveTemplate);
        }
        
        // Delete template button
        if (deleteTemplateBtn) {
            deleteTemplateBtn.addEventListener('click', handleDeleteTemplate);
        }
        
        // Nav tabs
        if (navTabs) {
            navTabs.forEach(tab => {
                tab.addEventListener('click', handleTabChange);
            });
        }
        
        // Save next button
        if (saveNextBtn) {
            saveNextBtn.addEventListener('click', handleSaveNext);
        }
        
        // Publish button
        if (publishBtn) {
            publishBtn.addEventListener('click', handlePublish);
        }
        
        // Listen for state changes
        StateManager.watch('document.name', updateTemplateName);
        StateManager.watch('ui.autoSaveStatus', updateAutoSaveIndicator);
        StateManager.watch('ui.activeTab', updateActiveTab);
    }
    
    /**
     * Update UI from state
     */
    function updateFromState() {
        updateTemplateName();
        updateAutoSaveIndicator();
        updateActiveTab();
    }
    
    /**
     * Handle template name change
     * @param {Event} e - Change event
     */
    function handleTemplateName(e) {
        const newName = templateNameInput.value.trim();
        if (newName) {
            StateManager.update('document.name', newName);
        }
    }
    
    /**
     * Update template name from state
     */
    function updateTemplateName() {
        const name = StateManager.get('document.name');
        if (templateNameInput && name) {
            templateNameInput.value = name;
        }
    }
    
    /**
     * Handle save template button click
     */
    function handleSaveTemplate() {
        // Set saving status
        StateManager.update('ui.autoSaveStatus', 'saving');
        
        // Simulate saving
        setTimeout(() => {
            StateManager.update('ui.autoSaveStatus', 'saved');
            
            // Show success message
            showToast('Template saved successfully');
        }, 1000);
    }
    
    /**
     * Handle delete template button click
     */
    function handleDeleteTemplate() {
        if (confirm('Are you sure you want to delete this template?')) {
            // Simulate deletion
            setTimeout(() => {
                // Reset document state
                StateManager.reset();
                
                // Show success message
                showToast('Template deleted successfully');
            }, 500);
        }
    }
    
    /**
     * Handle tab change
     * @param {Event} e - Click event
     */
    function handleTabChange(e) {
        const tab = e.currentTarget;
        const tabName = tab.dataset.tab;
        
        // Update state
        StateManager.update('ui.activeTab', tabName);
    }
    
    /**
     * Update active tab from state
     */
    function updateActiveTab() {
        const activeTab = StateManager.get('ui.activeTab');
        
        // Update tab UI
        if (navTabs) {
            navTabs.forEach(tab => {
                if (tab.dataset.tab === activeTab) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
        }
    }
    
    /**
     * Handle save next button click
     */
    function handleSaveNext() {
        // Set saving status
        StateManager.update('ui.autoSaveStatus', 'saving');
        
        // Simulate saving
        setTimeout(() => {
            StateManager.update('ui.autoSaveStatus', 'saved');
            
            // Show success message
            showToast('Template saved as next version');
        }, 1000);
    }
    
    /**
     * Handle publish button click
     */
    function handlePublish() {
        // Check if signature is added
        const hasSignature = false; // This would be determined by actual signature state
        
        if (!hasSignature) {
            // Show confirmation dialog
            if (confirm('No e-signature has been added. Publish anyway?')) {
                publishTemplate();
            }
        } else {
            publishTemplate();
        }
    }
    
    /**
     * Publish the template
     */
    function publishTemplate() {
        // Set saving status
        StateManager.update('ui.autoSaveStatus', 'saving');
        
        // Simulate publishing
        setTimeout(() => {
            StateManager.update('ui.autoSaveStatus', 'saved');
            
            // Show success message
            showToast('Template published successfully');
        }, 1500);
    }
    
    /**
     * Update auto-save indicator from state
     */
    function updateAutoSaveIndicator() {
        const status = StateManager.get('ui.autoSaveStatus');
        
        if (autoSaveIndicator) {
            const statusText = autoSaveIndicator.querySelector('.status');
            const icon = autoSaveIndicator.querySelector('.icon');
            
            if (status === 'saving') {
                statusText.textContent = 'Saving...';
                icon.textContent = '🔄';
                icon.classList.add('rotating');
            } else if (status === 'saved') {
                statusText.textContent = 'Auto-saved';
                icon.textContent = '✓';
                icon.classList.remove('rotating');
            } else if (status === 'error') {
                statusText.textContent = 'Save failed';
                icon.textContent = '❌';
                icon.classList.remove('rotating');
            }
        }
    }
    
    /**
     * Show a toast notification
     * @param {string} message - Notification message
     */
    function showToast(message) {
        // Create toast element if not exists
        let toast = document.getElementById('toast-notification');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
            
            // Add styles if not in CSS
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.right = '20px';
            toast.style.backgroundColor = '#333';
            toast.style.color = 'white';
            toast.style.padding = '10px 20px';
            toast.style.borderRadius = '4px';
            toast.style.zIndex = '2000';
            toast.style.transition = 'opacity 0.3s ease-in-out';
        }
        
        // Set message and show
        toast.textContent = message;
        toast.style.opacity = '1';
        
        // Hide after delay
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    }
    
    // Public API
    return {
        init: init
    };
})();