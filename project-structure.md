# CPQ Editor Architecture (Vanilla JavaScript)

## Folder Structure

```
/cpq-editor/
│
├── /assets/                  # Static assets 
│   ├── /icons/              # SVG and other icon assets
│   ├── /fonts/              # Font files
│   └── /images/             # Images used in the application
│
├── /css/                    # CSS styles
│   ├── main.css             # Main stylesheet
│   ├── editor.css           # Editor-specific styles
│   ├── components.css       # Reusable component styles
│   └── themes.css           # Theme variables and customizations
│
├── /js/                     # JavaScript files
│   ├── /core/               # Core functionality
│   │   ├── app.js           # Main application initialization
│   │   ├── events.js        # Event handling system
│   │   ├── state.js         # State management
│   │   └── utils.js         # Utility functions
│   │
│   ├── /editor/             # Editor-specific code
│   │   ├── editor.js        # Main editor functionality
│   │   ├── text-editor.js   # Rich text editing features
│   │   ├── table-editor.js  # Table management
│   │   ├── mention.js       # Slash command/mentions system
│   │   └── toolbar.js       # Editor toolbar functionality
│   │
│   ├── /components/         # Reusable UI components
│   │   ├── dropdown.js      # Dropdown component
│   │   ├── context-menu.js  # Context menu implementation
│   │   ├── modal.js         # Modal dialog component
│   │   └── tooltip.js       # Tooltip implementation
│   │
│   ├── /services/           # Service modules
│   │   ├── storage.js       # Local storage/persistence
│   │   ├── api.js           # API interaction
│   │   └── formatter.js     # Content formatting utilities
│   │
│   └── /layouts/            # Page layout modules
│       ├── navigation.js    # Navigation bar
│       ├── page-manager.js  # Page management 
│       └── sidebar.js       # Sidebar panels
│
├── index.html               # Main HTML entry point
└── README.md                # Project documentation
```

## Architecture Design Principles

1. **Module Pattern**: Each JavaScript file exports a module with clear responsibilities
2. **Event-Driven Communication**: Components communicate through events
3. **State Management**: Centralized state management for editor content
4. **Performance Optimization**: 
   - Lazy loading of non-critical components
   - DOM manipulation minimization
   - Efficient content rendering for large documents
5. **Memory Management**: Proper cleanup of event listeners and DOM references

## Core Systems

### 1. State Management System
- Maintains application state (document content, UI state)
- Provides methods for state updates
- Implements observable pattern for state changes

### 2. Event System  
- Custom event emitter for component communication
- Event delegation for efficient event handling
- Support for event bubbling and capturing

### 3. Rich Text Editing Engine
- Lightweight contentEditable management
- Selection and range manipulation
- Text formatting controls
- Mentions/slash commands

### 4. Page Management
- Multi-page document handling
- Page templates and layouts
- Header/footer management

### 5. Component System
- Reusable UI components with consistent API
- Component lifecycle management
- Virtual DOM-like approach for performance