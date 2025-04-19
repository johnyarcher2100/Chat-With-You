# Implementation plan

Below is a step-by-step implementation plan for the "Chat with Me" application. Each step cites the relevant document section (e.g., Project Overview, Tech Stack, or specific requirement summary) and specifies the file or configuration path when applicable. Before executing any coding step, always prevalidate that the change is not redundant by verifying the current project directory structure.

## Phase 1: Environment Setup

1.  **Prevalidation Check**

    *   Verify that the current directory is not already initialized as a project. If it is, create a backup or move to another directory before starting a new project setup. *(Project Overview)*

2.  **Initialize Project with CodeGuide Starter Pro**

    *   Clone or initialize the project using the CodeGuide Starter Pro template. Follow the starter kit instructions from its repository. *(Project Overview: Project Initialization and Architecture Design)*

3.  **Configure GitHub Repository**

    *   Set up a new GitHub repository for the project. Push the starter code to the repository. *(Project Overview: Project Initialization and Architecture Design)*

4.  **Set Up CI/CD Pipeline with Netlify**

    *   Connect the GitHub repository to Netlify in order to automate deployments. *(Project Overview: Project Initialization and Architecture Design)*

5.  **Verify Node.js and Next.js Version**

    *   Check that Node.js v20.2.1 is installed by running `node -v`.
    *   Since the frontend uses Next.js, install Next.js 15 (as it is better suited with current AI coding tools and LLM models) by running:

6.  `npx create-next-app@15 --typescript`

7.  *(Tech Stack: Frontend)*

8.  **Install Required Core Tools**

    *   Ensure TypeScript, Tailwind CSS, and either Chakra UI or Shadcn UI are installed as per the design and tech stack requirements. *(Tech Stack: Frontend)*

9.  **Configure Supabase Environment Variables**

    *   Obtain your Supabase connection string by visiting: <https://supabase.com/docs/guides/getting-started/mcp#connect-to-supabase-using-mcp>
    *   Add the connection string to your environment variables (e.g., in `.env.local`). *(Project Overview: Authentication System Implementation & Database Design)*

10. **Cursor Configuration for MCP**

    *   Prevalidate if a `.cursor` directory exists in the project root. If not, create one.
    *   Create or open the file `.cursor/mcp.json` and add the following configuration. Replace `<connection-string>` with your Supabase connection string.

11. **For macOS:**

12. `{ "mcpServers": { "supabase": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-postgres", "<connection-string>"] } } }`

13. **For Windows:**

14. `{ "mcpServers": { "supabase": { "command": "cmd", "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-postgres", "<connection-string>"] } } }`

    *   Inform the developer to review the connection string instructions at: <https://supabase.com/docs/guides/getting-started/mcp#connect-to-supabase-using-mcp>
    *   After adding the string, navigate to Settings/MCP in Cursor and verify that a green active status appears. *(Tech Stack: Infrastructure & Tools, Cursor)*

15. **Windsurf Configuration for MCP**

    *   Open the Cascade assistant in Windsurf.
    *   Tap on the hammer (MCP) icon, then choose **Configure** to open the configuration file.
    *   Insert the configuration below (again, replace `<connection-string>` with your Supabase connection string):

16. **For macOS:**

17. `{ "mcpServers": { "supabase": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-postgres", "<connection-string>"] } } }`

18. **For Windows:**

19. `{ "mcpServers": { "supabase": { "command": "cmd", "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-postgres", "<connection-string>"] } } }`

    *   Remind the user to obtain the connection string from: <https://supabase.com/docs/guides/getting-started/mcp#connect-to-supabase-using-mcp>
    *   Save the configuration and tap **Refresh** in the Cascade assistant. *(Tech Stack: Infrastructure & Tools, Windsurf)*

## Phase 2: Frontend Development

1.  **Initialize Next.js with TypeScript**

    *   Based on the CodeGuide Starter Pro, confirm that the project uses Next.js 15 specifically. Verify with `package.json`. *(Tech Stack: Frontend)*

2.  **Install and Configure Tailwind CSS**

    *   Follow the Tailwind CSS installation instructions and configure Tailwind by editing `/tailwind.config.js`. *(Tech Stack: Frontend)*

3.  **Install UI Component Library**

    *   Install either Chakra UI or Shadcn UI, then configure the UI theme files to follow the Apple-inspired, clean and minimalist design. *(Project Overview: UI Design & Tech Stack: Frontend)*

4.  **Set Up Expo for Cross-platform Mobile Development**

    *   Initialize Expo for handling Android and iOS builds, and perform any required configuration for Xcode for iOS-specific builds. *(Tech Stack: Frontend)*

5.  **Create Global Styles and Apple-Inspired Theme**

    *   Develop a set of global CSS/TS files (e.g., `/styles/globals.css`) incorporating white backgrounds, subtle shadows, rounded elements, and clear typography. *(Project Overview: UI Design)*

6.  **Develop Authentication UI Components**

    *   Create pages/components for login and registration (e.g., `/pages/login.tsx`, `/components/AuthForm.tsx`).
    *   Integrate Supabase and Clerk Auth for third-party login (Facebook, Google, Apple). *(Project Overview: Authentication System Implementation)*

7.  **Build Chat Interface Components**

    *   Create a chat list component (`/components/ChatList.tsx`) and a chat window component (`/components/ChatWindow.tsx`).
    *   Include offline indicators and message synchronization UI. *(Project Overview: Real-time Chat & Offline Mode)*

8.  **Implement Friend Management UI**

    *   Create components for friend search, friend request notifications, and friend list (e.g., `/components/FriendList.tsx`, `/components/FriendRequest.tsx`).
    *   Add QR code generation feature for user profiles using a QR generation library. *(Project Overview: Friend Management)*

9.  **Integrate AI-Assisted Features UI**

    *   Develop components to display AI suggestions, tone adjustments, and simulated replies (e.g., `/components/AIAssistant.tsx`).
    *   Plan for customization of AI bots through a dedicated settings panel. *(Project Overview: AI Assistance & Custom AI Bots)*

10. **Validation of Frontend Components**

    *   Run UI tests (e.g., using Jest and React Testing Library) ensuring 100% coverage for key components. *(Frontend Docs: Component Testing)

## Phase 3: Backend Development

1.  **Set Up Supabase Database Schema**

    *   Design and implement the database schema including tables for Users, Friends, Chatrooms, Messages, Robots, CallStats, and Orders.
    *   Create SQL migration scripts and run them on Supabase. *(Project Overview: Database Design and Implementation)*

2.  **Configure Supabase Authentication**

    *   Integrate Supabase authentication with Clerk Auth for third-party logins (Facebook, Google, Apple). *(Project Overview: Authentication System Implementation)*

3.  **Implement Real-Time Messaging**

    *   Use Supabase Realtime or WebSocket to build instant messaging capabilities.
    *   Create backend event triggers for message delivery and offline caching synchronization. *(Project Overview: Real-time Chat)*

4.  **Develop API Endpoints for Chat Functionality**

    *   Create RESTful API endpoints for sending, receiving, and synchronizing messages (e.g., `/api/v1/messages`).
    *   Use authentication middleware to protect endpoints. *(Project Overview: Core Chat Functionality Development)*

5.  **Integrate AI Features with Deepseek and OpenAI APIs**

    *   Develop backend services that communicate with Deepseek API and OpenAI API for context-aware suggestions and tone matching. *(Project Overview: AI Integration)*

6.  **Develop Customizable Robot System Backend**

    *   Implement endpoints for robot creation, training, and management (e.g., `/api/v1/robots`).
    *   Differentiate between knowledge-based, order-based, and custom robot types. *(Project Overview: Customizable Robot System)*

7.  **Payment Integration Endpoints**

    *   Develop metering functionalities for AI call usage with endpoints that calculate usage and cost.
    *   Integrate third-party payment providers 街口支付 and Line Pay. Create endpoints such as `/api/v1/payments` for invoking payment operations.
    *   Setup balance alert functionalities and automatic recharge processing. *(Project Overview: Payment and Statistics System)*

8.  **File Storage Integration with Cloudinary**

    *   Write backend services for file upload/download and integrate with Cloudinary’s API to store avatars and chat images. *(Project Overview: File Storage System)*

9.  **Set Up Environment Variable Management**

    *   Store API keys for OpenAI, Deepseek, Cloudinary, and payment providers securely using environment variable files (e.g., `.env.local`). *(Project Overview: Security and API Key Management)*

10. **Validation of Backend APIs**

    *   Use tools like Postman or curl to test each endpoint (e.g., `curl -X POST http://localhost:3000/api/v1/messages`) ensuring a 200 OK response and correct data flow. *(Backend Docs: API Testing)*

## Phase 4: Integration

1.  **Connect Frontend to Backend APIs**

    *   In frontend service files (e.g., `/frontend/src/services/chatService.ts`), set up API calls (using axios or fetch) to connect to the backend endpoints.
    *   Ensure that authentication tokens are correctly sent with each request. *(App Flow: Authentication and Chat Integration)*

2.  **Integrate Real-Time Chat on the Frontend**

    *   Implement WebSocket or Supabase Realtime client-side listeners in the chat components (e.g., in `/components/ChatWindow.tsx`).
    *   Handle events such as new messages, offline sync, and message status updates. *(Project Overview: Core Chat Functionality Development)*

3.  **Validate End-to-End Chat Workflow**

    *   Test user login, friend addition, sending/receiving messages, and AI suggestions to ensure integration works across front- and backends.
    *   Run end-to-end tests (e.g., using Cypress) against the local environment. *(Q&A: Pre-Launch Checklist)*

## Phase 5: Deployment

1.  **Prepare for Production Deployment**

    *   Finalize environment variable settings and API keys in the deployment configuration files.
    *   Prevalidate that the project runs without local errors before deployment. *(Project Overview: Deployment Preparation)*

2.  **Deploy Frontend to Netlify**

    *   Build the Next.js project and deploy it to Netlify. Confirm that the build uses Next.js 15 per requirement.
    *   Monitor the deployment dashboard on Netlify for any errors. *(Tech Stack: Deployment)*

3.  **Deploy Backend Services**

    *   Configure backend deployment either via Supabase functions or a separate hosting service as needed.
    *   Ensure endpoints are secured and reachable from the deployed frontend. *(Tech Stack: Backend & Deployment)*

4.  **CI/CD Pipeline Validation**

    *   Run the CI/CD pipelines configured in GitHub actions. Verify that tests pass and automated deployments are triggered. *(Project Overview: Infrastructure & Tools)*

5.  **Post-Deployment Testing**

    *   Perform final end-to-end tests on the production URL (e.g., using Cypress or other testing suites) to confirm all functionality: authentication, real-time chat, AI features, friend management, and payments. *(Q&A: Pre-Launch Checklist)*

## Additional Considerations

1.  **Security Enhancements**

    *   Implement security best practices for API key management, HTTPS enforcement, and validation of user input across both frontend and backend. *(Project Overview: Security)*

2.  **Error Handling and Retry Logic**

    *   Add proper error handling and retry mechanisms in payment processing endpoints (e.g., three retry attempts with a 2-second delay) and document these in the codebase comments. *(Q&A: Payment Failures)

3.  **Documentation and Code Comments**

    *   Ensure all code is well-documented and major functions/components include inline comments.
    *   Update the README with setup instructions, environment variable details, and deployment steps. *(Project Overview: Documentation)*

4.  **Monitoring and Analytics Setup**

    *   Integrate logging and analytics tools to monitor API call statistics, user behavior, and robot usage. *(Project Overview: Payment and Statistics System)*

This plan provides clear, individual steps for environment setup, frontend development, backend development, integration, and deployment based on the supplied documents and project requirements. Follow each step carefully and validate after implementation.
