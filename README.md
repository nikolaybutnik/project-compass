# Project Compass (In Development)

A smart project management platform that leverages AI to help you plan, organize, and execute your projects more efficiently. This project is currently under active development.

![Project Compass](https://placehold.co/600x400?text=Project+Compass&font=montserrat)

## Features (In Progress)

- **AI-Powered Project Management**: Early integration of AI to assist with project management tasks (in active development).
- **Kanban Board**: Basic implementation with functional drag-and-drop for task organization (early development).
- **Project Insights**: Planned AI-generated analytics and suggestions to keep your project on track.
- **Multi-Project Support**: Easily switch between different projects with the active project feature.
- **Modern UI**: Clean interface built with Chakra UI and TypeScript.

## Tech Stack

- **Frontend**: React 18 with TypeScript 5
- **UI Library**: Chakra UI with custom theming
- **State Management**:
  - Zustand for lightweight global state
  - TanStack React Query for server state and data fetching
- **Routing**: React Router v6 with protected routes
- **AI Integration**: Initial OpenAI GPT-4o API integration (expanding functionality)
- **Authentication & Database**: Firebase Authentication and Firestore
- **Drag & Drop**: dnd-kit with sortable context
- **Content Rendering**: React Markdown for AI-generated content
- **Build Tool**: Vite for fast development and optimized builds

## Current Development Status

This project is in active development with the following components implemented:

- Basic authentication flow
- Project creation and management
- Basic Kanban board with task creation, deletion, and drag-and-drop functionality
- Initial AI assistant with basic project context awareness

Work in progress:

- Enhanced AI integration and capabilities
- Tool calling functionality for AI
- Comprehensive task creation and editing interface
- Task filtering and sorting capabilities
- Project analytics
- Team collaboration features
- Expanded task management capabilities

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/project-compass.git
cd project-compass

# Install dependencies with pnpm (recommended)
pnpm install
# Or with npm
npm install

# Set up environment variables
# Create a .env file with the following variables:
# VITE_OPENAI_API_KEY=your_openai_api_key
# VITE_FIREBASE_API_KEY=your_firebase_api_key
# VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
# VITE_FIREBASE_PROJECT_ID=your_project_id
# VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
# VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
# VITE_FIREBASE_APP_ID=your_app_id

# Start the development server
npm run dev
```

## Project Structure

```
src/
├── features/           # Feature-based organization
│   ├── ai/             # AI integration with OpenAI
│   │   ├── components/ # AI-specific UI components
│   │   ├── context/    # AI context provider
│   │   ├── hooks/      # Custom hooks for AI functionality
│   │   ├── services/   # OpenAI API integration
│   │   ├── types/      # TypeScript types for AI features
│   │   └── utils/      # Helper functions for AI
│   ├── auth/           # Authentication features
│   ├── home/           # Homepage components
│   ├── projects/       # Project management features
│   │   ├── components/ # Project UI components
│   │   ├── hooks/      # Project-related hooks
│   │   ├── pages/      # Project pages (list, detail)
│   │   └── services/   # Project data services
│   └── users/          # User management
├── shared/             # Shared components and utilities
│   ├── components/     # Reusable UI components
│   ├── config/         # Application configuration and theme
│   ├── constants/      # App constants and routes
│   ├── layouts/        # Page layouts (Auth, App)
│   └── store/          # Global state management
├── routes/             # Application routing
├── App.tsx             # Main application component
└── main.tsx           # Application entry point
```

## Key Features in Detail

### AI-Powered Project Management (Early Development)

Project Compass is in the early stages of integrating OpenAI's GPT models to provide intelligent assistance. The current implementation includes:

- Basic integration with OpenAI API
- Initial context passing for project awareness
- Conversation UI for interacting with the AI

Current AI limitations (actively being developed):

- Limited project context awareness
- No tool calling functionality yet
- Basic response capabilities without advanced actions

Planned AI capabilities:

- Generate task suggestions based on project descriptions
- Automated task creation and management through tool calling
- Project insights and recommendations
- Intelligent task prioritization

### Kanban Board (Basic Implementation)

The current Kanban board provides core functionality with a focus on simplicity:

- Basic dnd-kit integration for functional drag-and-drop between columns
- Simple task creation and deletion
- Visual representation of task status via columns

Current limitations:

- Limited task editing capabilities
- No task filtering or search functionality yet
- Basic visual representation without advanced UI elements

Planned Kanban enhancements:

- Comprehensive task creation and editing interface
- Rich text descriptions for tasks
- Task filtering, sorting, and search
- Subtasks and dependencies
- Task labels and priority indicators

### Firebase Integration

The project uses Firebase for authentication and data storage:

- User authentication with email/password
- Firestore for storing projects, tasks, and user data
- Real-time updates for collaborative possibilities

## Architecture Decisions

### State Management Strategy

The project implements a sophisticated dual state management approach:

- **TanStack React Query**: Used for server state management with a focus on:

  - Data fetching, caching, and synchronization with the Firebase backend
  - Optimistic UI updates for immediate feedback during drag-and-drop operations
  - Declarative query definitions with automatic refetching and invalidation
  - Mutation functions for creating, updating, and deleting projects and tasks

- **Zustand**: Employed for UI state management with:
  - Lightweight global stores with minimal boilerplate
  - Specialized stores for different domains (projects, auth, users)
  - Simple API for state updates and subscriptions
  - Reduced component re-renders through selective state subscriptions

### Context-Based Feature Isolation

The project leverages React Context API for feature-specific state management:

- **AI Context Provider**: Manages the AI conversation state, including:
  - Message history tracking and management
  - Project context synchronization for AI awareness
  - Message sending and response handling
  - Context invalidation for ensuring AI has the latest project data

### Custom Hooks for Business Logic

Business logic is encapsulated in custom hooks to promote reusability and testing:

- **Query Hooks**: Wrapper hooks around React Query for data fetching
- **Mutation Hooks**: Specialized hooks for data modification operations
- **Feature-Specific Hooks**: Custom hooks that combine multiple operations into cohesive workflows

### Firebase Integration Architecture

The project uses a service-based approach to Firebase integration:

- **Service Modules**: Firebase operations are abstracted into service functions
- **Type-Safe Interfaces**: TypeScript interfaces for Firebase data models
- **Optimistic Updates**: Local state updates before Firebase confirmation for responsive UI

### Component Structure

The UI is built with a component-based architecture:

- **Feature-Based Organization**: Components are grouped by feature rather than type
- **Container/Presentation Pattern**: Logic-heavy containers use simpler presentation components
- **Composition**: Complex UI elements are built through component composition
- **Chakra UI Integration**: Leveraging Chakra's component system for consistent styling and theming

## Future Enhancements

- Complete AI tool calling functionality
- Advanced project context awareness for AI
- Comprehensive task management interface
- Team collaboration features
- Timeline views and Gantt charts
- Mobile responsive design
- Additional project templates and AI-generated project plans

## License

MIT

## Contact

Nikolay Butnik  
E-mail: [btnk.nik@gmail.com](mailto:btnk.nik@gmail.com)  
LinkedIn: [linkedin.com/in/nikolay-butnik](https://www.linkedin.com/in/nikolay-butnik/)

Project Link: [https://github.com/nikolaybutnik/project-compass](https://github.com/nikolaybutnik/project-compass)
