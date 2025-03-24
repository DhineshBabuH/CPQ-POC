/**
 * Event system for the CPQ Editor
 * Implements a simple pub/sub pattern for component communication
 */
const EventSystem = (function() {
    // Private event handlers storage
    const listeners = {};
    
    // Store event bindings for cleanup
    const boundElements = new Map();
    
    return {
        /**
         * Subscribe to an event
         * @param {string} event - Event name
         * @param {Function} callback - Callback function
         * @returns {Object} Subscription object for unsubscribe
         */
        on: function(event, callback) {
            if (!listeners[event]) {
                listeners[event] = [];
            }
            
            listeners[event].push(callback);
            
            // Return subscription object
            return {
                unsubscribe: function() {
                    EventSystem.off(event, callback);
                }
            };
        },
        
        /**
         * Unsubscribe from an event
         * @param {string} event - Event name
         * @param {Function} callback - Callback function
         */
        off: function(event, callback) {
            if (listeners[event]) {
                listeners[event] = listeners[event].filter(cb => cb !== callback);
            }
        },
        
        /**
         * Emit an event
         * @param {string} event - Event name
         * @param {*} data - Event data
         */
        emit: function(event, data) {
            if (listeners[event]) {
                listeners[event].forEach(callback => {
                    callback(data);
                });
            }
        },
        
        /**
         * Bind DOM events with delegation
         * @param {HTMLElement} element - Parent element
         * @param {string} eventType - DOM event type
         * @param {string} selector - CSS selector for delegation
         * @param {Function} handler - Event handler
         */
        bindWithDelegation: function(element, eventType, selector, handler) {
            const delegationHandler = function(e) {
                let target = e.target;
                
                while (target && target !== element) {
                    if (target.matches(selector)) {
                        handler.call(target, e);
                        return;
                    }
                    target = target.parentElement;
                }
            };
            
            // Store binding for cleanup
            if (!boundElements.has(element)) {
                boundElements.set(element, []);
            }
            
            boundElements.get(element).push({
                eventType,
                handler: delegationHandler
            });
            
            element.addEventListener(eventType, delegationHandler);
        },
        
        /**
         * Remove all event bindings from an element
         * @param {HTMLElement} element - Element to clean up
         */
        unbindAll: function(element) {
            if (boundElements.has(element)) {
                const bindings = boundElements.get(element);
                
                bindings.forEach(binding => {
                    element.removeEventListener(binding.eventType, binding.handler);
                });
                
                boundElements.delete(element);
            }
        },
        
        /**
         * Clean up all event listeners and bindings
         */
        cleanup: function() {
            // Clear pub/sub listeners
            for (const event in listeners) {
                listeners[event] = [];
            }
            
            // Clear DOM event bindings
            boundElements.forEach((bindings, element) => {
                bindings.forEach(binding => {
                    element.removeEventListener(binding.eventType, binding.handler);
                });
            });
            
            boundElements.clear();
        }
    };
})();