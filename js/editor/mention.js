/**
 * Mention/Slash Command module for the CPQ Editor
 * Handles suggestions triggered by '/' character
 */
const MentionSystem = (function() {
    // DOM elements
    let mentionPanel;
    let mentionItems;
    let searchInput;
    
    // Current state
    let isVisible = false;
    let targetRange = null;
    let currentQuery = '';
    
    // Mention suggestions
    const suggestions = [
        { id: 'h1', type: 'heading', level: 1, icon: 'H1', label: 'Heading 1', description: 'Big section heading' },
        { id: 'h2', type: 'heading', level: 2, icon: 'H2', label: 'Heading 2', description: 'Medium section heading' },
        { id: 'h3', type: 'heading', level: 3, icon: 'H3', label: 'Heading 3', description: 'Small section heading' },
        { id: 'table', type: 'table', rows: 3, cols: 3, icon: '⊞', label: 'Table', description: 'Insert a table' },
        { id: 'table-2x2', type: 'table', rows: 2, cols: 2, icon: '⊞', label: 'Table 2×2', description: 'Insert a 2×2 table' },
        { id: 'table-3x3', type: 'table', rows: 3, cols: 3, icon: '⊞', label: 'Table 3×3', description: 'Insert a 3×3 table' },
        { id: 'table-4x4', type: 'table', rows: 4, cols: 4, icon: '⊞', label: 'Table 4×4', description: 'Insert a 4×4 table' },
        { id: 'cols-2', type: 'columns', count: 2, icon: '⫴', label: '2 Columns', description: 'Insert 2-column layout' },
        { id: 'cols-3', type: 'columns', count: 3, icon: '⫶', label: '3 Columns', description: 'Insert 3-column layout' },
        { id: 'cols-4', type: 'columns', count: 4, icon: '⫸', label: '4 Columns', description: 'Insert 4-column layout' },
        { id: 'field', type: 'field', icon: '{}', label: 'Field', description: 'Insert a dynamic field' }
    ];
    
    /**
     * Initialize the mention panel
     */
    function init() {
        console.log('MentionSystem: Initializing...');
        
        // Create the mention panel if it doesn't exist
        createMentionPanel();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('MentionSystem: Initialized');
    }
    
    /**
     * Create the mention panel DOM
     */
    function createMentionPanel() {
        // Check if panel already exists
        mentionPanel = document.getElementById('mention-panel');
        
        if (mentionPanel) {
            // Get references to existing elements
            mentionItems = mentionPanel.querySelector('.mention-items');
            searchInput = mentionPanel.querySelector('#mention-search-input');
            console.log('MentionSystem: Using existing panel');
            return;
        }
        
        console.log('MentionSystem: Creating new panel');
        
        // Create panel
        mentionPanel = document.createElement('div');
        mentionPanel.id = 'mention-panel';
        mentionPanel.className = 'mention-panel';
        mentionPanel.style.display = 'none';
        
        // Create search input
        const searchContainer = document.createElement('div');
        searchContainer.className = 'mention-search';
        
        searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'mention-search-input';
        searchInput.placeholder = 'Search...';
        
        searchContainer.appendChild(searchInput);
        
        // Create items container
        mentionItems = document.createElement('div');
        mentionItems.className = 'mention-items';
        
        // Assemble panel
        mentionPanel.appendChild(searchContainer);
        mentionPanel.appendChild(mentionItems);
        
        // Add to document
        document.body.appendChild(mentionPanel);
        
        // Add initial styling if not in CSS
        if (!document.querySelector('style#mention-panel-styles')) {
            const style = document.createElement('style');
            style.id = 'mention-panel-styles';
            style.textContent = `
                .mention-panel {
                    position: absolute;
                    background-color: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    width: 250px;
                    max-height: 300px;
                    z-index: 1000;
                    overflow: hidden;
                }
                
                .mention-search {
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                }
                
                .mention-search input {
                    width: 100%;
                    padding: 5px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                
                .mention-items {
                    overflow-y: auto;
                    max-height: 250px;
                }
                
                .mention-item {
                    padding: 8px 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .mention-item:hover, .mention-item.selected {
                    background-color: #f5f5f5;
                }
                
                .mention-item-icon {
                    font-size: 16px;
                    width: 20px;
                    text-align: center;
                }
                
                .mention-item-content {
                    flex: 1;
                }
                
                .mention-item-label {
                    font-weight: 500;
                }
                
                .mention-item-description {
                    font-size: 12px;
                    color: #777;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        console.log('MentionSystem: Setting up event listeners');
        
        // Listen for mention show events
        EventSystem.on('mention:show', function(data) {
            console.log('MentionSystem: Received mention:show event', data);
            showMentionPanel(data);
        });
        
        // Listen for mention update events
        EventSystem.on('mention:update', function(data) {
            console.log('MentionSystem: Received mention:update event', data);
            updateMentionPanel(data);
        });
        
        // Listen for mention hide events
        EventSystem.on('mention:hide', function() {
            console.log('MentionSystem: Received mention:hide event');
            hideMentionPanel();
        });
        
        // Handle search input
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                console.log('MentionSystem: Search input changed', e.target.value);
                updateMentionPanel({ query: e.target.value });
            });
            
            // Prevent editor losing focus
            searchInput.addEventListener('blur', function(e) {
                // Don't hide if clicking a mention item
                if (e.relatedTarget && Utils.findParent(e.relatedTarget, '.mention-item')) {
                    return;
                }
                
                // Otherwise hide after a short delay
                setTimeout(function() {
                    hideMentionPanel();
                }, 200);
            });
        }
        
        // Delegation for mention item clicks
        if (mentionPanel) {
            mentionPanel.addEventListener('click', function(e) {
                const itemEl = Utils.findParent(e.target, '.mention-item');
                if (itemEl) {
                    console.log('MentionSystem: Item clicked', itemEl.dataset.id);
                    handleMentionItemClick(e);
                }
            });
        }
        
        // Handle document clicks to close panel
        document.addEventListener('click', function(e) {
            if (isVisible && !Utils.findParent(e.target, '#mention-panel') && e.target.nodeName !== 'INPUT') {
                console.log('MentionSystem: Document clicked outside panel');
                hideMentionPanel();
            }
        });
        
        // Handle document keydown for navigation
        document.addEventListener('keydown', function(e) {
            if (!isVisible) return;
            
            // Escape key to close
            if (e.key === 'Escape') {
                console.log('MentionSystem: Escape key pressed');
                e.preventDefault();
                hideMentionPanel();
                return;
            }
            
            // Arrow keys for navigation
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                console.log('MentionSystem: Arrow key pressed', e.key);
                e.preventDefault();
                navigateMentionItems(e.key === 'ArrowDown' ? 1 : -1);
                return;
            }
            
            // Enter to select
            if (e.key === 'Enter') {
                console.log('MentionSystem: Enter key pressed');
                e.preventDefault();
                selectCurrentMentionItem();
                return;
            }
        }, true); // Use capturing for keyboard events
    }
    
    /**
     * Show the mention panel
     * @param {Object} data - Event data with targetRange and query
     */
    function showMentionPanel(data) {
        console.log('MentionSystem: Showing panel', data);
        
        if (!mentionPanel) {
            createMentionPanel();
        }
        
        // Save range
        targetRange = data.targetRange;
        currentQuery = data.query || '';
        
        // Update state
        StateManager.update('ui.showMentionPanel', true);
        StateManager.update('ui.mentionQuery', currentQuery);
        
        // Position the panel at the cursor
        positionPanelAtCursor();
        
        // Filter and render items
        filterAndRenderItems();
        
        // Show the panel
        mentionPanel.style.display = 'block';
        isVisible = true;
        
        // Focus search input
        if (searchInput) {
            setTimeout(() => {
                searchInput.value = currentQuery;
                searchInput.focus();
            }, 0);
        }
    }
    
    /**
     * Update the mention panel with new query
     * @param {Object} data - Event data with query
     */
    function updateMentionPanel(data) {
        console.log('MentionSystem: Updating panel', data);
        
        if (!isVisible || !mentionPanel) {
            console.log('MentionSystem: Panel not visible, cannot update');
            return;
        }
        
        currentQuery = data.query || '';
        
        // Update state
        StateManager.update('ui.mentionQuery', currentQuery);
        
        // Update search input if not already focused
        if (searchInput && document.activeElement !== searchInput) {
            searchInput.value = currentQuery;
        }
        
        // Filter and render items
        filterAndRenderItems();
    }
    
    /**
     * Hide the mention panel
     */
    function hideMentionPanel() {
        console.log('MentionSystem: Hiding panel');
        
        if (!mentionPanel) return;
        
        // Update state
        StateManager.update('ui.showMentionPanel', false);
        
        // Hide panel
        mentionPanel.style.display = 'none';
        isVisible = false;
        targetRange = null;
    }
    
    /**
     * Position the panel at the current cursor position
     */
    function positionPanelAtCursor() {
        if (!targetRange || !mentionPanel) {
            console.log('MentionSystem: Cannot position panel, missing targetRange or panel');
            return;
        }
        
        try {
            // Get range position
            const rect = targetRange.getBoundingClientRect();
            
            console.log('MentionSystem: Range rect', rect);
            
            // Position panel below cursor
            const top = (rect.bottom + window.scrollY + 5);
            const left = (rect.left + window.scrollX);
            
            console.log('MentionSystem: Positioning panel at', { top, left });
            
            mentionPanel.style.top = top + 'px';
            mentionPanel.style.left = left + 'px';
        } catch (error) {
            console.error('MentionSystem: Error positioning panel', error);
            
            // Fallback - position in center
            mentionPanel.style.top = '50%';
            mentionPanel.style.left = '50%';
            mentionPanel.style.transform = 'translate(-50%, -50%)';
        }
    }
    
    /**
     * Filter and render mention items
     */
    function filterAndRenderItems() {
        if (!mentionItems) {
            console.log('MentionSystem: mentionItems not found');
            return;
        }
        
        // Clear items
        mentionItems.innerHTML = '';
        
        // Filter items based on query
        const filteredItems = filterItems(currentQuery);
        console.log('MentionSystem: Filtered items', filteredItems.length);
        
        // Render items
        filteredItems.forEach((item, index) => {
            const itemEl = createMentionItem(item);
            
            // First item is selected by default
            if (index === 0) {
                itemEl.classList.add('selected');
            }
            
            mentionItems.appendChild(itemEl);
        });
    }
    
    /**
     * Filter mention items based on query
     * @param {string} query - Search query
     * @returns {Array} Filtered suggestions
     */
    function filterItems(query) {
        if (!query) return suggestions;
        
        query = query.toLowerCase();
        
        return suggestions.filter(item => 
            item.label.toLowerCase().includes(query) || 
            item.description.toLowerCase().includes(query)
        );
    }
    
    /**
     * Create a mention item element
     * @param {Object} item - Suggestion item
     * @returns {HTMLElement} Mention item element
     */
    function createMentionItem(item) {
        const itemEl = document.createElement('div');
        itemEl.className = 'mention-item';
        itemEl.dataset.id = item.id;
        
        // Create icon
        const icon = document.createElement('span');
        icon.className = 'mention-item-icon';
        icon.textContent = item.icon;
        
        // Create content
        const content = document.createElement('div');
        content.className = 'mention-item-content';
        
        const label = document.createElement('div');
        label.className = 'mention-item-label';
        label.textContent = item.label;
        
        const description = document.createElement('div');
        description.className = 'mention-item-description';
        description.textContent = item.description;
        
        // Assemble content
        content.appendChild(label);
        content.appendChild(description);
        
        // Assemble item
        itemEl.appendChild(icon);
        itemEl.appendChild(content);
        
        return itemEl;
    }
    
    /**
     * Handle mention item click
     * @param {Event} e - Click event
     */
    function handleMentionItemClick(e) {
        const itemEl = Utils.findParent(e.target, '.mention-item');
        if (!itemEl) return;
        
        // Get item ID
        const itemId = itemEl.dataset.id;
        console.log('MentionSystem: Item clicked with ID', itemId);
        selectMentionItem(itemId);
    }
    
    /**
     * Navigate mention items with keyboard
     * @param {number} direction - Direction (1 for down, -1 for up)
     */
    function navigateMentionItems(direction) {
        if (!mentionItems) return;
        
        // Get all items
        const items = mentionItems.querySelectorAll('.mention-item');
        if (items.length === 0) return;
        
        // Find current selected
        let selectedIndex = -1;
        items.forEach((item, index) => {
            if (item.classList.contains('selected')) {
                selectedIndex = index;
            }
        });
        
        // Calculate new index
        let newIndex = selectedIndex + direction;
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
        
        console.log('MentionSystem: Navigating from', selectedIndex, 'to', newIndex);
        
        // Update selection
        items.forEach((item, index) => {
            if (index === newIndex) {
                item.classList.add('selected');
                
                // Scroll into view if needed
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    /**
     * Select the currently selected mention item
     */
    function selectCurrentMentionItem() {
        if (!mentionItems) return;
        
        // Find selected item
        const selectedItem = mentionItems.querySelector('.mention-item.selected');
        if (selectedItem) {
            // Get item ID
            const itemId = selectedItem.dataset.id;
            console.log('MentionSystem: Selecting current item', itemId);
            selectMentionItem(itemId);
        }
    }
    
    /**
     * Select a mention item by ID
     * @param {string} itemId - Item ID to select
     */
    function selectMentionItem(itemId) {
        // Find the item
        const item = suggestions.find(suggestion => suggestion.id === itemId);
        if (!item) {
            console.log('MentionSystem: Item not found', itemId);
            return;
        }
        
        console.log('MentionSystem: Selecting item', item);
        
        // Emit event with item data
        EventSystem.emit('mention:select', item);
        
        // Hide the panel
        hideMentionPanel();
    }
    
    // Public API
    return {
        init: init,
        show: showMentionPanel,
        hide: hideMentionPanel,
        update: updateMentionPanel
    };
})();