/**
 * Utility functions for the CPQ Editor
 */
const Utils = {
    /**
     * Generate a unique ID
     * @param {string} prefix - Prefix for the ID
     * @returns {string} Unique ID
     */
    generateId: function(prefix = 'id') {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Find parent element matching selector
     * @param {HTMLElement} element - Starting element
     * @param {string} selector - CSS selector to match
     * @returns {HTMLElement|null} Matching parent or null
     */
    findParent: function(element, selector) {
        let currentEl = element;
        while (currentEl && currentEl !== document.body) {
            if (currentEl.matches(selector)) {
                return currentEl;
            }
            currentEl = currentEl.parentElement;
        }
        return null;
    },

    /**
     * Get current selection range
     * @returns {Range|null} Current selection range or null
     */
    getCurrentRange: function() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            return selection.getRangeAt(0);
        }
        return null;
    },

    /**
     * Create a Range at a specific position in an element
     * @param {HTMLElement} element - Target element
     * @param {number} offset - Character offset within element
     * @returns {Range} The created range
     */
    createRangeAtPosition: function(element, offset) {
        const range = document.createRange();
        const textNode = element.firstChild;
        
        if (textNode) {
            const textLength = textNode.length;
            offset = Math.min(offset, textLength);
            range.setStart(textNode, offset);
            range.setEnd(textNode, offset);
        } else {
            range.setStart(element, 0);
            range.setEnd(element, 0);
        }
        
        return range;
    },

    /**
     * Set selection at a specific range
     * @param {Range} range - Range to select
     */
    setSelectionRange: function(range) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    },

    /**
     * Deep clone an object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Debounce a function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    },

    /**
     * Sanitize HTML content
     * @param {string} html - HTML content to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHtml: function(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Remove potentially harmful elements
        const scripts = tempDiv.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // Remove on* attributes
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });
        });
        
        return tempDiv.innerHTML;
    },

    /**
     * Format text with execCommand
     * @param {string} command - Command name
     * @param {boolean} showUI - Show UI
     * @param {string} value - Command value
     */
    formatText: function(command, showUI, value) {
        document.execCommand(command, showUI, value);
    },

    /**
     * Get computed text style at current selection
     * @returns {Object} Style properties
     */
    getSelectionStyle: function() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return {};
        
        const range = selection.getRangeAt(0);
        let element = range.commonAncestorContainer;
        
        // If the node is a text node, get its parent element
        if (element.nodeType === 3) {
            element = element.parentElement;
        }
        
        const computedStyle = window.getComputedStyle(element);
        
        return {
            fontFamily: computedStyle.fontFamily,
            fontSize: computedStyle.fontSize,
            fontWeight: computedStyle.fontWeight,
            fontStyle: computedStyle.fontStyle,
            textDecoration: computedStyle.textDecoration,
            color: computedStyle.color,
            backgroundColor: computedStyle.backgroundColor,
            textAlign: computedStyle.textAlign
        };
    },

    /**
     * Get active formatting commands for current selection
     * @returns {Object} Active commands
     */
    getActiveFormattingCommands: function() {
        return {
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikethrough'),
            alignLeft: document.queryCommandState('justifyLeft'),
            alignCenter: document.queryCommandState('justifyCenter'),
            alignRight: document.queryCommandState('justifyRight'),
            orderedList: document.queryCommandState('insertOrderedList'),
            unorderedList: document.queryCommandState('insertUnorderedList')
        };
    }
};