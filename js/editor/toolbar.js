/**
 * Toolbar module for the CPQ Editor
 * Handles text formatting functionality via the toolbar
 */
const EditorToolbar = (function() {
    // Button elements
    let undoBtn, redoBtn;
    let boldBtn, italicBtn, underlineBtn;
    let alignLeftBtn, alignCenterBtn, alignRightBtn;
    let listBulletBtn, listNumberBtn;
    let fontFamilySelect, fontSizeSelect;
    
    /**
     * Initialize the toolbar
     */
    function init() {
        // Get toolbar buttons
        undoBtn = document.getElementById('undo-btn');
        redoBtn = document.getElementById('redo-btn');
        boldBtn = document.getElementById('bold-btn');
        italicBtn = document.getElementById('italic-btn');
        underlineBtn = document.getElementById('underline-btn');
        alignLeftBtn = document.getElementById('align-left-btn');
        alignCenterBtn = document.getElementById('align-center-btn');
        alignRightBtn = document.getElementById('align-right-btn');
        listBulletBtn = document.getElementById('list-bullet-btn');
        listNumberBtn = document.getElementById('list-number-btn');
        fontFamilySelect = document.getElementById('font-family');
        fontSizeSelect = document.getElementById('font-size');
        
        // Set up event listeners
        setupEventListeners();
    }
    
    /**
     * Set up toolbar event listeners
     */
    function setupEventListeners() {
        // Handle button clicks
        if (undoBtn) undoBtn.addEventListener('click', handleUndo);
        if (redoBtn) redoBtn.addEventListener('click', handleRedo);
        if (boldBtn) boldBtn.addEventListener('click', () => formatText('bold'));
        if (italicBtn) italicBtn.addEventListener('click', () => formatText('italic'));
        if (underlineBtn) underlineBtn.addEventListener('click', () => formatText('underline'));
        if (alignLeftBtn) alignLeftBtn.addEventListener('click', () => formatText('justifyLeft'));
        if (alignCenterBtn) alignCenterBtn.addEventListener('click', () => formatText('justifyCenter'));
        if (alignRightBtn) alignRightBtn.addEventListener('click', () => formatText('justifyRight'));
        if (listBulletBtn) listBulletBtn.addEventListener('click', () => formatText('insertUnorderedList'));
        if (listNumberBtn) listNumberBtn.addEventListener('click', () => formatText('insertOrderedList'));
        
        // Handle dropdown changes
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', function() {
                formatText('fontName', this.value);
            });
        }
        
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', function() {
                formatText('fontSize', this.value);
            });
        }
        
        // Listen for selection changes to update toolbar state
        document.addEventListener('selectionchange', updateToolbarState);
        
        // Listen for editor active state
        EventSystem.on('editor:active', function() {
            // Show format toolbar
            const formatToolbar = document.getElementById('format-toolbar');
            if (formatToolbar) {
                formatToolbar.style.display = 'flex';
            }
            
            // Update toolbar state
            updateToolbarState();
        });
    }
    
    /**
     * Handle undo action
     */
    function handleUndo() {
        // Use built-in undo if available
        if (document.queryCommandEnabled('undo')) {
            document.execCommand('undo');
        } else {
            // Fallback to state undo
            StateManager.undo();
        }
    }
    
    /**
     * Handle redo action
     */
    function handleRedo() {
        // Use built-in redo if available
        if (document.queryCommandEnabled('redo')) {
            document.execCommand('redo');
        } else {
            // Fallback to state redo
            StateManager.redo();
        }
    }
    
    /**
     * Format selected text
     * @param {string} command - Format command
     * @param {string} [value] - Optional command value
     */
    function formatText(command, value) {
        // Get active editor
        const activeEditor = TextEditor.getActiveEditor();
        if (!activeEditor) return;
        
        // Focus editor if not already focused
        if (document.activeElement !== activeEditor) {
            activeEditor.focus();
        }
        
        // Apply format
        document.execCommand(command, false, value);
        
        // Update toolbar state
        updateToolbarState();
    }
    
    /**
     * Update toolbar button states based on selection
     */
    function updateToolbarState() {
        // Get active editor
        const activeEditor = TextEditor.getActiveEditor();
        if (!activeEditor) {
            // No active editor, disable all buttons
            disableAllButtons();
            return;
        }
        
        // Check if buttons exist
        if (!boldBtn) return;
        
        // Update button states
        boldBtn.classList.toggle('active', document.queryCommandState('bold'));
        italicBtn.classList.toggle('active', document.queryCommandState('italic'));
        underlineBtn.classList.toggle('active', document.queryCommandState('underline'));
        
        alignLeftBtn.classList.toggle('active', document.queryCommandState('justifyLeft'));
        alignCenterBtn.classList.toggle('active', document.queryCommandState('justifyCenter'));
        alignRightBtn.classList.toggle('active', document.queryCommandState('justifyRight'));
        
        listBulletBtn.classList.toggle('active', document.queryCommandState('insertUnorderedList'));
        listNumberBtn.classList.toggle('active', document.queryCommandState('insertOrderedList'));
        
        // Update dropdowns
        if (fontFamilySelect) {
            const fontName = document.queryCommandValue('fontName');
            if (fontName) {
                // Find closest match in options
                const options = Array.from(fontFamilySelect.options);
                const bestMatch = options.find(option => 
                    fontName.toLowerCase().includes(option.value.toLowerCase())
                );
                
                if (bestMatch) {
                    fontFamilySelect.value = bestMatch.value;
                }
            }
        }
        
        if (fontSizeSelect) {
            const fontSize = document.queryCommandValue('fontSize');
            if (fontSize) {
                // Try to match size
                const options = Array.from(fontSizeSelect.options);
                const bestMatch = options.find(option => option.value === fontSize);
                
                if (bestMatch) {
                    fontSizeSelect.value = bestMatch.value;
                }
            }
        }
    }
    
    /**
     * Disable all toolbar buttons
     */
    function disableAllButtons() {
        // Remove active class from all buttons
        const buttons = document.querySelectorAll('.toolbar-button');
        buttons.forEach(button => {
            button.classList.remove('active');
        });
    }
    
    // Public API
    return {
        init: init,
        formatText: formatText
    };
})();