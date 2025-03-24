/**
 * Text Editor module for the CPQ Editor
 * Handles rich text editing functionality
 */
const TextEditor = (function() {
    // Stored references
    let activeEditor = null;
    let lastKeyPressed = null;
    let mentionTriggerPos = null;

    /**
     * Initialize a block as an editor
     * @param {HTMLElement} block - The block element
     */
    function initializeBlock(block) {
        const content = block.querySelector('[contenteditable="true"]');
        if (!content) return;

        // Make sure it has a block ID
        if (!block.dataset.blockId) {
            block.dataset.blockId = Utils.generateId('block');
        }

        // Set placeholder if empty
        if (!content.textContent.trim()) {
            content.dataset.placeholder = 'Type / to insert content...';
        } else {
            delete content.dataset.placeholder;
        }
    }

    /**
     * Get the current active editor element
     * @returns {HTMLElement} The active editor element
     */
    function getActiveEditor() {
        return activeEditor;
    }

    /**
     * Track editor focus
     * @param {Event} e - Focus event 
     */
    function handleEditorFocus(e) {
        const editor = Utils.findParent(e.target, '[data-editable="true"]');
        if (editor) {
            setActiveEditor(editor);
        }
    }

    /**
     * Set active editor and update UI
     * @param {HTMLElement} editor - Editor element
     */
    function setActiveEditor(editor) {
        if (activeEditor !== editor) {
            activeEditor = editor;
            
            // Update toolbar visibility
            const formatToolbar = document.getElementById('format-toolbar');
            if (formatToolbar) {
                formatToolbar.style.display = 'flex';
            }
            
            // Update state
            StateManager.update('ui.activeElement', editor ? editor.parentElement.dataset.blockId : null);
            
            // Emit event
            EventSystem.emit('editor:active', { editor });
        }
    }

    /**
     * Handle editor blur events
     * @param {Event} e - Blur event
     */
    function handleEditorBlur(e) {
        // Don't deactivate if switching to toolbar
        if (e.relatedTarget && Utils.findParent(e.relatedTarget, '.editor-toolbar')) {
            return;
        }
        
        // Don't deactivate if switching to mention panel
        if (e.relatedTarget && Utils.findParent(e.relatedTarget, '.mention-panel')) {
            return;
        }
        
        // Save content to state
        const editor = Utils.findParent(e.target, '[data-editable="true"]');
        if (editor) {
            const block = editor.parentElement;
            const blockId = block.dataset.blockId;
            const content = editor.innerHTML;
            
            // Update content in state
            saveBlockContent(blockId, content);
            
            // Hide formatting toolbar with delay (to allow toolbar clicks)
            setTimeout(() => {
                // Double check that we don't have a new editor focus
                if (!document.activeElement || !Utils.findParent(document.activeElement, '[data-editable="true"]')) {
                    const formatToolbar = document.getElementById('format-toolbar');
                    if (formatToolbar) {
                        formatToolbar.style.display = 'none';
                    }
                    activeEditor = null;
                }
            }, 100);
        }
    }

    /**
     * Save block content to state
     * @param {string} blockId - Block ID
     * @param {string} content - HTML content
     */
    function saveBlockContent(blockId, content) {
        // Clean content
        const sanitizedContent = Utils.sanitizeHtml(content);
        
        // Find page and block index
        const state = StateManager.getState();
        const pages = state.document.pages;
        
        let pageIndex = -1;
        let blockIndex = -1;
        
        pages.forEach((page, pIndex) => {
            page.blocks.forEach((block, bIndex) => {
                if (block.id === blockId) {
                    pageIndex = pIndex;
                    blockIndex = bIndex;
                }
            });
        });
        
        if (pageIndex >= 0 && blockIndex >= 0) {
            StateManager.update(`document.pages.${pageIndex}.blocks.${blockIndex}.content`, sanitizedContent);
            
            // Set autosave status
            StateManager.update('ui.autoSaveStatus', 'saving');
            
            // Simulate autosave after delay
            setTimeout(() => {
                StateManager.update('ui.autoSaveStatus', 'saved');
            }, 1000);
        }
    }

    /**
     * Handle keydown events for editors
     * @param {Event} e - Keydown event
     */
    function handleEditorKeydown(e) {
        lastKeyPressed = e.key;
        
        // Special case for slash command
        if (e.key === '/') {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            
            mentionTriggerPos = {
                range: range.cloneRange(),
                query: ''
            };
            
            // Trigger mention panel
            EventSystem.emit('mention:show', {
                targetRange: range.cloneRange(),
                query: ''
            });
        }
        
        // Handle backspace to delete empty block
        if (e.key === 'Backspace' && activeEditor && activeEditor.textContent.trim() === '') {
            const block = activeEditor.parentElement;
            const blockId = block.dataset.blockId;
            
            // Prevent deletion of the only block
            const pageBody = Utils.findParent(block, '.page-body');
            const allBlocks = pageBody.querySelectorAll('.editor-block');
            
            if (allBlocks.length > 1) {
                e.preventDefault();
                deleteBlock(blockId);
            }
        }
        
        // Tab key to indent content
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
        }
        
        // Ctrl+Z for undo
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            StateManager.undo();
        }
        
        // Ctrl+Y for redo
        if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            StateManager.redo();
        }
        
        // Enter key to add new block if at end
        if (e.key === 'Enter' && !e.shiftKey) {
            const selection = window.getSelection();
            if (selection.rangeCount === 0) return;
            
            const range = selection.getRangeAt(0);
            const editor = activeEditor;
            
            // Check if cursor is at the end of the editor
            if (editor && range.endOffset === editor.textContent.length) {
                // If there's no text or cursor is after a block element, add new block
                const lastNode = editor.lastChild;
                if (!lastNode || lastNode.nodeType === 1) {
                    e.preventDefault();
                    addBlockAfter(editor.parentElement.dataset.blockId);
                }
            }
        }
    }

    /**
     * Handle input events for mention panel updates
     * @param {Event} e - Input event
     */
    function handleEditorInput(e) {
        if (mentionTriggerPos) {
            const selection = window.getSelection();
            if (selection.rangeCount === 0) return;
            
            const currentRange = selection.getRangeAt(0);
            const editor = activeEditor;
            
            // Update the mention query
            const currentText = editor.textContent;
            const triggerOffset = mentionTriggerPos.range.startOffset;
            const currentOffset = currentRange.startOffset;
            
            // Only process if we're ahead of the trigger position
            if (currentOffset > triggerOffset) {
                // Extract the query text between the trigger and current position
                const query = currentText.substring(triggerOffset, currentOffset);
                
                if (query.includes(' ') || query.includes('\n')) {
                    // Space or newline cancels mention
                    EventSystem.emit('mention:hide');
                    mentionTriggerPos = null;
                } else {
                    // Update mention panel
                    EventSystem.emit('mention:update', {
                        query: query
                    });
                    
                    mentionTriggerPos.query = query;
                }
            } else {
                // Cursor moved before trigger, cancel mention
                EventSystem.emit('mention:hide');
                mentionTriggerPos = null;
            }
        }
    }

    /**
     * Add a new block after the specified block
     * @param {string} blockId - Block ID to add after
     */
    function addBlockAfter(blockId) {
        // Find the block in the DOM
        const block = document.querySelector(`[data-block-id="${blockId}"]`);
        if (!block) return;
        
        // Create new block
        const newBlock = document.createElement('div');
        newBlock.className = 'editor-block';
        const newBlockId = Utils.generateId('block');
        newBlock.dataset.blockId = newBlockId;
        
        // Create editable content area
        const content = document.createElement('div');
        content.className = 'editor-content';
        content.contentEditable = true;
        content.dataset.editable = true;
        content.dataset.placeholder = 'Type / to insert content...';
        
        newBlock.appendChild(content);
        
        // Insert after current block
        block.insertAdjacentElement('afterend', newBlock);
        
        // Focus new block
        content.focus();
        
        // Update state
        const state = StateManager.getState();
        const pages = state.document.pages;
        
        let pageIndex = -1;
        let blockIndex = -1;
        
        // Find the block position in state
        pages.forEach((page, pIndex) => {
            page.blocks.forEach((block, bIndex) => {
                if (block.id === blockId) {
                    pageIndex = pIndex;
                    blockIndex = bIndex;
                }
            });
        });
        
        if (pageIndex >= 0 && blockIndex >= 0) {
            // Create new block in state
            const newBlockState = {
                id: newBlockId,
                type: 'text',
                content: ''
            };
            
            // Get current blocks and insert the new one
            const blocks = [...pages[pageIndex].blocks];
            blocks.splice(blockIndex + 1, 0, newBlockState);
            
            // Update state
            StateManager.update(`document.pages.${pageIndex}.blocks`, blocks);
        }
    }

    /**
     * Delete a block
     * @param {string} blockId - Block ID to delete
     */
    function deleteBlock(blockId) {
        // Find the block in the DOM
        const block = document.querySelector(`[data-block-id="${blockId}"]`);
        if (!block) return;
        
        // Find previous block to focus after deletion
        const prevBlock = block.previousElementSibling;
        
        // Update state first
        const state = StateManager.getState();
        const pages = state.document.pages;
        
        let pageIndex = -1;
        let blockIndex = -1;
        
        // Find the block position in state
        pages.forEach((page, pIndex) => {
            page.blocks.forEach((block, bIndex) => {
                if (block.id === blockId) {
                    pageIndex = pIndex;
                    blockIndex = bIndex;
                }
            });
        });
        
        if (pageIndex >= 0 && blockIndex >= 0) {
            // Remove block from state
            const blocks = [...pages[pageIndex].blocks];
            blocks.splice(blockIndex, 1);
            
            // Update state
            StateManager.update(`document.pages.${pageIndex}.blocks`, blocks);
        }
        
        // Remove block from DOM
        block.remove();
        
        // Focus previous block if available
        if (prevBlock) {
            const prevContent = prevBlock.querySelector('[contenteditable="true"]');
            if (prevContent) {
                prevContent.focus();
                
                // Put cursor at end
                const range = document.createRange();
                const selection = window.getSelection();
                
                if (prevContent.lastChild) {
                    if (prevContent.lastChild.nodeType === 3) {
                        // Text node
                        range.setStart(prevContent.lastChild, prevContent.lastChild.length);
                        range.setEnd(prevContent.lastChild, prevContent.lastChild.length);
                    } else {
                        // Element node
                        range.setStartAfter(prevContent.lastChild);
                        range.setEndAfter(prevContent.lastChild);
                    }
                } else {
                    range.setStart(prevContent, 0);
                    range.setEnd(prevContent, 0);
                }
                
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    /**
     * Insert content at the current cursor position
     * @param {string} html - HTML content to insert
     */
    function insertContent(html) {
        // Close mention panel
        EventSystem.emit('mention:hide');
        mentionTriggerPos = null;
        
        if (!activeEditor) return;
        
        // Delete the trigger character and query
        if (mentionTriggerPos) {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            
            // Create a range from the trigger position to current position
            const deleteRange = document.createRange();
            deleteRange.setStart(mentionTriggerPos.range.startContainer, mentionTriggerPos.range.startOffset);
            deleteRange.setEnd(range.endContainer, range.endOffset);
            
            // Delete the range
            deleteRange.deleteContents();
        }
        
        // Insert the new content
        document.execCommand('insertHTML', false, html);
        
        // Save the updated content
        saveBlockContent(activeEditor.parentElement.dataset.blockId, activeEditor.innerHTML);
    }

    /**
     * Insert a heading at current position
     * @param {number} level - Heading level (1-6)
     */
    function insertHeading(level) {
        if (!activeEditor) return;
        
        // Create heading HTML
        const html = `<h${level} data-heading="true">Heading ${level}</h${level}><br>`;
        insertContent(html);
    }

    /**
     * Insert a table at current position
     * @param {number} rows - Number of rows
     * @param {number} cols - Number of columns
     */
    function insertTable(rows, cols) {
        if (!activeEditor) return;
        
        // Create table HTML
        let html = '<table class="cpq-table" style="width:100%;border-collapse:collapse;margin:10px 0;">';
        
        // Add header row
        html += '<thead><tr>';
        for (let c = 0; c < cols; c++) {
            html += `<th style="border:1px solid #ddd;padding:8px;text-align:left;">Header ${c + 1}</th>`;
        }
        html += '</tr></thead><tbody>';
        
        // Add body rows
        for (let r = 0; r < rows; r++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                html += `<td style="border:1px solid #ddd;padding:8px;">Cell ${r + 1}-${c + 1}</td>`;
            }
            html += '</tr>';
        }
        
        html += '</tbody></table><p><br></p>';
        insertContent(html);
    }

    /**
     * Insert columns layout at current position
     * @param {number} count - Number of columns (2-4)
     */
    function insertColumns(count) {
        if (!activeEditor) return;
        
        // Create columns HTML
        let html = `<div class="columns columns-${count}" style="display:flex;gap:20px;margin:10px 0;">`;
        
        for (let i = 0; i < count; i++) {
            html += `<div class="column" style="flex:1;">
                <p>Column ${i + 1} content</p>
            </div>`;
        }
        
        html += '</div><p><br></p>';
        insertContent(html);
    }

    /**
     * Initialize all editor blocks
     */
    function initializeAllBlocks() {
        const blocks = document.querySelectorAll('.editor-block');
        blocks.forEach(block => {
            initializeBlock(block);
        });
    }

    /**
     * Create new block from state
     * @param {Object} blockData - Block data from state
     * @returns {HTMLElement} Created block element
     */
    function createBlockFromState(blockData) {
        const block = document.createElement('div');
        block.className = 'editor-block';
        block.dataset.blockId = blockData.id;
        
        const content = document.createElement('div');
        content.className = 'editor-content';
        content.contentEditable = true;
        content.dataset.editable = true;
        content.innerHTML = blockData.content || '';
        
        if (!content.textContent.trim()) {
            content.dataset.placeholder = 'Type / to insert content...';
        }
        
        block.appendChild(content);
        return block;
    }

    /**
     * Render page from state
     * @param {Object} pageData - Page data from state
     * @param {number} index - Page index
     * @returns {HTMLElement} Rendered page element
     */
    function renderPageFromState(pageData, index) {
        const page = document.createElement('div');
        page.className = 'page';
        page.dataset.pageId = pageData.id;
        
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
        pageData.blocks.forEach(blockData => {
            const block = createBlockFromState(blockData);
            body.appendChild(block);
        });
        
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

    /**
     * Initialize editor event listeners
     */
    function initEventListeners() {
        // Document-level event delegation
        document.addEventListener('focus', handleEditorFocus, true);
        document.addEventListener('blur', handleEditorBlur, true);
        
        // Event delegation for editor keydown
        EventSystem.bindWithDelegation(document, 'keydown', '[data-editable="true"]', handleEditorKeydown);
        
        // Event delegation for editor input
        EventSystem.bindWithDelegation(document, 'input', '[data-editable="true"]', handleEditorInput);
        
        // Handle mention item selection
        EventSystem.on('mention:select', function(data) {
            if (data.type === 'heading') {
                insertHeading(data.level);
            } else if (data.type === 'table') {
                insertTable(data.rows, data.cols);
            } else if (data.type === 'columns') {
                insertColumns(data.count);
            }
        });
        
        // Handle state changes for content updates
        StateManager.watch('document.pages', function(data) {
            // Document content changed, need to render from state
            renderDocumentFromState();
        });
    }

    /**
     * Render the entire document from state
     */
    function renderDocumentFromState() {
        const state = StateManager.getState();
        const pages = state.document.pages;
        
        const pageContainer = document.getElementById('page-container');
        if (!pageContainer) return;
        
        // Clear existing pages
        pageContainer.innerHTML = '';
        
        // Render each page
        pages.forEach((pageData, index) => {
            const page = renderPageFromState(pageData, index);
            pageContainer.appendChild(page);
        });
        
        // Initialize all blocks
        initializeAllBlocks();
    }

    // Public API
    return {
        init: function() {
            initializeAllBlocks();
            initEventListeners();
            renderDocumentFromState();
        },
        getActiveEditor: getActiveEditor,
        insertContent: insertContent,
        insertHeading: insertHeading,
        insertTable: insertTable,
        insertColumns: insertColumns,
        addBlockAfter: addBlockAfter,
        deleteBlock: deleteBlock
    };
})();