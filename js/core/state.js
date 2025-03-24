/**
 * State management for the CPQ Editor
 * Implements a centralized store with observer pattern
 */
const StateManager = (function() {
    // Initial state
    const initialState = {
        document: {
            id: Utils.generateId('doc'),
            name: 'Untitled Template',
            pages: [
                {
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
                }
            ]
        },
        ui: {
            currentPage: 0,
            activeElement: null,
            selectionRange: null,
            showMentionPanel: false,
            showStylePanel: false,
            mentionQuery: '',
            autoSaveStatus: 'saved', // 'saved', 'saving', 'error'
            activeTab: 'create'
        },
        history: {
            past: [],
            future: []
        }
    };
    
    // Current state
    let state = Utils.deepClone(initialState);
    
    // Track which parts of the state have changed
    let changedPaths = [];
    
    /**
     * Check if a path has changed
     * @param {string} path - Dot notation path
     * @returns {boolean} True if path changed
     */
    function hasPathChanged(path) {
        return changedPaths.some(changedPath => {
            // Exact match
            if (changedPath === path) return true;
            
            // Path is a parent of changed path
            if (changedPath.startsWith(path + '.')) return true;
            
            // Changed path is a parent of path
            if (path.startsWith(changedPath + '.')) return true;
            
            return false;
        });
    }
    
    /**
     * Get value at path
     * @param {Object} obj - Object to traverse
     * @param {string} path - Dot notation path
     * @returns {*} Value at path
     */
    function getValueAtPath(obj, path) {
        const parts = path.split('.');
        let current = obj;
        
        for (let i = 0; i < parts.length; i++) {
            if (current === null || current === undefined) return undefined;
            current = current[parts[i]];
        }
        
        return current;
    }
    
    /**
     * Set value at path
     * @param {Object} obj - Object to modify
     * @param {string} path - Dot notation path
     * @param {*} value - New value
     */
    function setValueAtPath(obj, path, value) {
        const parts = path.split('.');
        let current = obj;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = value;
        changedPaths.push(path);
    }
    
    return {
        /**
         * Get the current state
         * @returns {Object} Current state
         */
        getState: function() {
            return Utils.deepClone(state);
        },
        
        /**
         * Get a specific part of the state
         * @param {string} path - Dot notation path
         * @returns {*} Value at path
         */
        get: function(path) {
            return Utils.deepClone(getValueAtPath(state, path));
        },
        
        /**
         * Update state
         * @param {Object|string} pathOrUpdates - Path or updates object
         * @param {*} [value] - New value if path is provided
         */
        update: function(pathOrUpdates, value) {
            // Clone current state for history
            const prevState = Utils.deepClone(state);
            
            // Reset changed paths
            changedPaths = [];
            
            if (typeof pathOrUpdates === 'string') {
                // Single path update
                setValueAtPath(state, pathOrUpdates, value);
            } else {
                // Multiple updates
                Object.entries(pathOrUpdates).forEach(([path, value]) => {
                    setValueAtPath(state, path, value);
                });
            }
            
            // Add to history
            if (changedPaths.length > 0) {
                state.history.past.push(prevState);
                state.history.future = [];
                
                // Limit history size
                if (state.history.past.length > 50) {
                    state.history.past.shift();
                }
                
                // Notify listeners
                EventSystem.emit('state:changed', {
                    changedPaths,
                    state: Utils.deepClone(state)
                });
            }
        },
        
        /**
         * Undo the last change
         */
        undo: function() {
            if (state.history.past.length > 0) {
                const newFuture = [Utils.deepClone(state), ...state.history.future];
                state = state.history.past.pop();
                state.history.future = newFuture;
                
                // Notify listeners
                EventSystem.emit('state:undo', {
                    state: Utils.deepClone(state)
                });
            }
        },
        
        /**
         * Redo the last undone change
         */
        redo: function() {
            if (state.history.future.length > 0) {
                const newPast = [...state.history.past, Utils.deepClone(state)];
                state = state.history.future.shift();
                state.history.past = newPast;
                
                // Notify listeners
                EventSystem.emit('state:redo', {
                    state: Utils.deepClone(state)
                });
            }
        },
        
        /**
         * Reset state to initial values
         */
        reset: function() {
            state = Utils.deepClone(initialState);
            EventSystem.emit('state:reset', {
                state: Utils.deepClone(state)
            });
        },
        
        /**
         * Watch for changes to specific parts of the state
         * @param {string|Array} paths - Path(s) to watch
         * @param {Function} callback - Callback function
         * @returns {Object} Subscription object
         */
        watch: function(paths, callback) {
            const pathArray = Array.isArray(paths) ? paths : [paths];
            
            const handler = function(data) {
                // Check if any watched path has changed
                const shouldUpdate = pathArray.some(path => 
                    hasPathChanged(path)
                );
                
                if (shouldUpdate) {
                    callback(data);
                }
            };
            
            return EventSystem.on('state:changed', handler);
        }
    };
})();