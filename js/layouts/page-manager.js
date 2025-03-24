/**
 * Page Manager module for the CPQ Editor
 * Handles multi-page document management
 */
const PageManager = (function() {
    // DOM elements
    let documentContainer;
    let pageContainer;
    let addPageButton;
    
    /**
     * Initialize the page manager
     */
    function init() {
        // Get DOM elements
        documentContainer = document.getElementById('document-container');
        pageContainer = document.getElementById('page-container');
        addPageButton = document.getElementById('add-page-button');
        
        // Set up event listeners
        setupEventListeners();
    }
    
    /**
     * Set up page manager event listeners
     */
    function setupEventListeners() {
        // Add page button
        if (addPageButton) {
            addPageButton.addEventListener('click', handleAddPage);
        }
        
        // Page action buttons using event delegation
        if (pageContainer) {
            EventSystem.bindWithDelegation(pageContainer, 'click', '.page-action-btn', handlePageAction);
        }
        
        // Listen for header/footer changes
        EventSystem.bindWithDelegation(pageContainer, 'blur', '.page-header, .page-footer', handleHeaderFooterChange);
        
        // Listen for state changes
        StateManager.watch('document.pages', function(data) {
            // Only update if not triggered by this module
            if (!data.source || data.source !== 'page-manager') {
                renderPagesFromState();
            }
        });
    }
    
    /**
     * Handle add page button click
     */
    function handleAddPage() {
        addNewPage();
    }
    
    /**
     * Add a new page to the document
     */
    function addNewPage() {
        // Create new page data
        const newPage = {
            id: Utils.generateId('page'),
            header: '',
            footer: '',
            blocks: [
                {
                    id: Utils.generateId('block'),
                    type: 'text',
                    content: ''
                }
            ],
            settings: {
                size: 'A4',
                orientation: 'portrait',
                padding: {
                    top: 2,
                    right: 2,
                    bottom: 2,
                    left: 2
                }
            }
        };
        
        // Get current pages
        const pages = StateManager.get('document.pages') || [];
        
        // Add new page
        StateManager.update({
            'document.pages': [...pages, newPage],
            'ui.currentPage': pages.length
        }, { source: 'page-manager' });
        
        // Scroll to the new page
        setTimeout(() => {
            const pageElement = pageContainer.querySelector(`[data-page-id="${newPage.id}"]`);
            if (pageElement) {
                pageElement.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
    
    /**
     * Handle page action button clicks
     * @param {Event} e - Click event
     */
    function handlePageAction(e) {
        const button = e.currentTarget;
        const action = button.dataset.action;
        const page = Utils.findParent(button, '.page');
        
        if (!page) return;
        
        const pageId = page.dataset.pageId;
        
        switch (action) {
            case 'add-header':
                highlightHeader(page);
                break;
                
            case 'duplicate-page':
                duplicatePage(pageId);
                break;
                
            case 'delete-page':
                deletePage(pageId);
                break;
                
            case 'page-settings':
                showPageSettings(pageId);
                break;
        }
    }
    
    /**
     * Highlight the header of a page
     * @param {HTMLElement} page - Page element
     */
    function highlightHeader(page) {
        const header = page.querySelector('.page-header');
        if (header) {
            header.focus();
            
            // Add temporary highlight
            header.classList.add('highlighted');
            setTimeout(() => {
                header.classList.remove('highlighted');
            }, 1500);
        }
    }
    
    /**
     * Duplicate a page
     * @param {string} pageId - ID of the page to duplicate
     */
    function duplicatePage(pageId) {
        // Get current pages
        const pages = StateManager.get('document.pages') || [];
        
        // Find page to duplicate
        const pageIndex = pages.findIndex(page => page.id === pageId);
        if (pageIndex === -1) return;
        
        // Clone the page
        const sourcePage = pages[pageIndex];
        const newPage = Utils.deepClone(sourcePage);
        
        // Generate new IDs
        newPage.id = Utils.generateId('page');
        
        // Generate new IDs for blocks
        newPage.blocks.forEach(block => {
            block.id = Utils.generateId('block');
        });
        
        // Insert after source page
        const newPages = [...pages];
        newPages.splice(pageIndex + 1, 0, newPage);
        
        // Update state
        StateManager.update({
            'document.pages': newPages,
            'ui.currentPage': pageIndex + 1
        }, { source: 'page-manager' });
        
        // Scroll to the new page
        setTimeout(() => {
            const pageElement = pageContainer.querySelector(`[data-page-id="${newPage.id}"]`);
            if (pageElement) {
                pageElement.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
    
    /**
     * Delete a page
     * @param {string} pageId - ID of the page to delete
     */
    function deletePage(pageId) {
        // Get current pages
        const pages = StateManager.get('document.pages') || [];
        
        // Prevent deleting the only page
        if (pages.length <= 1) {
            alert('Cannot delete the only page.');
            return;
        }
        
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this page?')) {
            return;
        }
        
        // Find page index
        const pageIndex = pages.findIndex(page => page.id === pageId);
        if (pageIndex === -1) return;
        
        // Remove page
        const newPages = [...pages];
        newPages.splice(pageIndex, 1);
        
        // Calculate new current page
        let newCurrentPage = StateManager.get('ui.currentPage');
        if (newCurrentPage >= pageIndex) {
            newCurrentPage = Math.max(0, newCurrentPage - 1);
        }
        
        // Update state
        StateManager.update({
            'document.pages': newPages,
            'ui.currentPage': newCurrentPage
        }, { source: 'page-manager' });
    }
    
    /**
     * Show page settings dialog
     * @param {string} pageId - ID of the page to configure
     */
    function showPageSettings(pageId) {
        // Get page data
        const pages = StateManager.get('document.pages') || [];
        const page = pages.find(p => p.id === pageId);
        if (!page) return;
        
        // For simplicity, just show an alert with current settings
        // This would be replaced with a proper settings modal
        const settings = page.settings;
        alert(`Page settings:
- Size: ${settings.size}
- Orientation: ${settings.orientation}
- Padding: Top: ${settings.padding.top}cm, Right: ${settings.padding.right}cm, Bottom: ${settings.padding.bottom}cm, Left: ${settings.padding.left}cm`);
        
        // In a real implementation, show a modal with settings fields
        // Then update the state with the new settings
    }
    
    /**
     * Handle header or footer text change
     * @param {Event} e - Blur event
     */
    function handleHeaderFooterChange(e) {
        const element = e.target;
        const page = Utils.findParent(element, '.page');
        if (!page) return;
        
        const pageId = page.dataset.pageId;
        const isHeader = element.classList.contains('page-header');
        const content = element.innerHTML;
        
        // Update state
        const pages = StateManager.get('document.pages') || [];
        const pageIndex = pages.findIndex(p => p.id === pageId);
        
        if (pageIndex !== -1) {
            if (isHeader) {
                StateManager.update(`document.pages.${pageIndex}.header`, content, { source: 'page-manager' });
            } else {
                StateManager.update(`document.pages.${pageIndex}.footer`, content, { source: 'page-manager' });
            }
        }
    }
    
    /**
     * Render all pages from state
     */
    function renderPagesFromState() {
        if (!pageContainer) return;
        
        // Get pages from state
        const pages = StateManager.get('document.pages') || [];
        
        // Clear container
        pageContainer.innerHTML = '';
        
        // Render each page
        pages.forEach((pageData, index) => {
            const pageElement = createPageElement(pageData);
            pageContainer.appendChild(pageElement);
        });
        
        // Initialize text editors in the new pages
        TextEditor.init();
    }
    
    /**
     * Create a page element from data
     * @param {Object} pageData - Page data from state
     * @returns {HTMLElement} Page element
     */
    function createPageElement(pageData) {
        // Create page element
        const page = document.createElement('div');
        page.className = 'page';
        page.dataset.pageId = pageData.id;
        
        // Apply page settings
        if (pageData.settings) {
            if (pageData.settings.orientation === 'landscape') {
                page.style.width = '29.7cm';
                page.style.minHeight = '21cm';
            }
            
            // Apply padding if different from default
            const padding = pageData.settings.padding;
            if (padding && (padding.top !== 2 || padding.right !== 2 || padding.bottom !== 2 || padding.left !== 2)) {
                page.style.padding = `${padding.top}cm ${padding.right}cm ${padding.bottom}cm ${padding.left}cm`;
            }
        }
        
        // Create header
        const header = document.createElement('div');
        header.className = 'page-header';
        header.contentEditable = true;
        header.dataset.section = 'header';
        header.innerHTML = pageData.header || '';
        
        // Create body
        const body = document.createElement('div');
        body.className = 'page-body';
        
        // Add blocks to body
        if (pageData.blocks && pageData.blocks.length) {
            pageData.blocks.forEach(blockData => {
                const block = document.createElement('div');
                block.className = 'editor-block';
                block.dataset.blockId = blockData.id;
                
                // Create editable content
                const content = document.createElement('div');
                content.className = 'editor-content';
                content.contentEditable = true;
                content.dataset.editable = true;
                content.innerHTML = blockData.content || '';
                
                // Set placeholder if empty
                if (!content.textContent.trim()) {
                    content.dataset.placeholder = 'Type / to insert content...';
                }
                
                block.appendChild(content);
                body.appendChild(block);
            });
        } else {
            // Add default empty block if none exists
            const block = document.createElement('div');
            block.className = 'editor-block';
            block.dataset.blockId = Utils.generateId('block');
            
            const content = document.createElement('div');
            content.className = 'editor-content';
            content.contentEditable = true;
            content.dataset.editable = true;
            content.dataset.placeholder = 'Type / to insert content...';
            
            block.appendChild(content);
            body.appendChild(block);
        }
        
        // Create footer
        const footer = document.createElement('div');
        footer.className = 'page-footer';
        footer.contentEditable = true;
        footer.dataset.section = 'footer';
        footer.innerHTML = pageData.footer || '';
        
        // Create page actions
        const actions = document.createElement('div');
        actions.className = 'page-actions';
        actions.innerHTML = `
            <button class="page-action-btn" data-action="add-header" title="Add Header">H</button>
            <button class="page-action-btn" data-action="duplicate-page" title="Duplicate Page">+</button>
            <button class="page-action-btn" data-action="delete-page" title="Delete Page">🗑️</button>
            <button class="page-action-btn" data-action="page-settings" title="Page Settings">⚙️</button>
        `;
        
        // Assemble page
        page.appendChild(header);
        page.appendChild(body);
        page.appendChild(footer);
        page.appendChild(actions);
        
        return page;
    }
    
    // Public API
    return {
        init: init,
        addNewPage: addNewPage,
        duplicatePage: duplicatePage,
        deletePage: deletePage
    };
})();