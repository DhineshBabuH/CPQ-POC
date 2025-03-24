# Pure JavaScript CPQ Editor

A high-performance Configure, Price, Quote (CPQ) document editor built with vanilla JavaScript. This editor provides rich text editing capabilities, slash command suggestions, multi-page support, and more, while maintaining excellent performance even for large documents.

## Key Features

- **Pure JavaScript Implementation**: No framework dependencies for maximum performance
- **Rich Text Editing**: Full formatting capabilities with an intuitive toolbar
- **Slash Command System**: Type `/` to trigger a suggestions panel for inserting various elements
- **Multi-Page Support**: Create, duplicate, and manage document pages
- **State Management**: Robust state management with undo/redo support
- **Event-Driven Architecture**: Modular design with event-based communication between components

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser
3. Start editing your CPQ document

## Architecture

The application follows a modular, event-driven architecture with clear separation of concerns:

### Core Modules

- **StateManager**: Centralized state management with history support
- **EventSystem**: Custom event system for component communication
- **Utils**: Utility functions for common operations

### Editor Modules

- **TextEditor**: Rich text editing functionality
- **MentionSystem**: Slash command system for inserting content
- **EditorToolbar**: Text formatting toolbar

### Layout Modules

- **Navigation**: Top navigation bar with template management
- **PageManager**: Multi-page document handling

## Usage

### Basic Editing

- Click on any text area to start editing
- Use the toolbar to format text (bold, italic, etc.)
- Type `/` to trigger the slash command panel for inserting headings, tables, etc.

### Page Management

- Click "Add Page" to add a new page
- Use the page actions buttons to:
  - Add/edit header and footer
  - Duplicate pages
  - Delete pages
  - Configure page settings

### Template Management

- Edit template name in the top navigation bar
- Use "Save" button to save the current template
- "Save as Next" creates a new version
- "Publish" marks the template as ready for customer use

## Performance Considerations

This implementation focuses on performance for large documents by:

1. Using efficient DOM operations
2. Implementing virtualization for large content
3. Minimizing reflows and repaints
4. Using event delegation for efficient event handling
5. Lazy loading components when needed

## Browser Support

The application supports all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

[MIT License](LICENSE)