---

# .windsurfrules

## Project Overview
- **Type:** Social Chat Application
- **Description:** "Chat with Me" is a multi-platform social chat application featuring an Apple-inspired UI, advanced multi-provider authentication, real-time messaging, AI-assisted chat, customizable AI bots, comprehensive friend management, and a secure payment system.
- **Primary Goal:** Facilitate seamless, secure, and real-time multi-platform social interactions bolstered by AI-powered features.

## Project Structure

### Framework-Specific Routing
- **Directory Rules:**
  - Next.js 15 (App Router): Enforce the use of the `app/` directory with nested route folders; for example, using the `app/[route]/page.tsx` conventions.
  - Example 1: "Next.js 15 (App Router)" → `app/[route]/page.tsx` conventions
  - Example 2: "Next.js (Pages Router)" → `pages/[route].tsx` pattern (not applicable in this project)
  - Example 3: "React Router 6" → `src/routes/` with `createBrowserRouter` (for alternative projects)

### Core Directories
- **Versioned Structure:**
  - app/api: Next.js 15 API routes leveraging Route Handlers for backend integration with Supabase and external APIs.
  - app/components: Version-specific UI components built with React and Tailwind CSS.
  - app/auth: Dedicated folder for authentication flow (login, registration) following Next.js 15 conventions.

### Key Files
- **Stack-Versioned Patterns:**
  - app/dashboard/layout.tsx: Sets up the root layout for authenticated user views, adhering to Next.js 15 App Router standards.
  - app/auth/login/page.tsx: Implements the login page with server actions and Supabase integration.

## Tech Stack Rules
- **Version Enforcement:**
  - next@15: App Router is required, ensuring no usage of legacy patterns like `getInitialProps`; strictly follow nested `app/` directories.
  - typescript@4.x: Enforce strict type-checking across all components.
  - tailwindcss@3.x: Ensure UI components conform to the Tailwind CSS utility-first styling paradigm.

## PRD Compliance
- **Non-Negotiable:**
  - "Payment integration compliance with local regulations" : All payment system implementations (using 街口支付/Line Pay) must strictly conform to local regulatory standards and secure API key management practices.

## App Flow Integration
- **Stack-Aligned Flow:**
  - Next.js 15 Auth Flow → `app/auth/login/page.tsx` uses server actions for secure authentication via Supabase and Clerk Auth.
  - Real-Time Messaging Flow → Integrated via Supabase Realtime in `app/chat/[room]/page.tsx` for consistent message synchronization.

---
