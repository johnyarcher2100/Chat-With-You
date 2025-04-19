# Project Requirements Document: Chat with Me

## 1. Project Overview

“Chat with Me” is a multi-platform community chat application designed for Android, iOS, and Web. The app provides a clean, Apple-style user interface that users will appreciate for its simplicity and clarity. It allows users to sign in via multiple methods (Facebook, Google, Apple) using Supabase for secure authentication. Once logged in, users can enjoy real-time messaging, AI-assisted conversation features, and the ability to integrate customized AI bots to enhance their chatting experience.

The purpose of the project is to provide a rich and engaging chatting platform that not only facilitates person-to-person communication but also integrates advanced AI features. These AI features include context-aware message suggestions, simulated replies when a friend is offline, and specialized chat-bot services (knowledge-based, order-based, and custom bots). The key success criteria include providing accurate and timely communication, ensuring secure user authentication, seamless cross-device synchronization, and the capability of monitoring usage and billing for premium AI calls through partners like 街口支付 and Line Pay.

## 2. In-Scope vs. Out-of-Scope

**In-Scope:**

*   **Multi-Platform Support:** Android, iOS, and Web integration with a unified design.
*   **User Authentication:** Secure login using Supabase with third-party integrations (Facebook, Google, Apple).
*   **Real-Time Messaging:** Instant messaging capabilities using Supabase Realtime or WebSocket with offline caching and synchronization.
*   **AI Integration:** Integration with deepseekAPI and OpenAI APIs for AI-assisted chat features, including context-aware suggestions and simulated replies.
*   **Customizable AI Bots:** Options for users to create and configure personal AI bots categorized as knowledge-based, order-based, and an extension for custom bots (reserved for future expansion).
*   **Friend Management:** Robust friend management system with QR code support, search by ID/name, and controlled friend interactions.
*   **Payment Integration:** Precise metering for AI calls with integrated payment processes through 街口支付 and Line Pay, including balance reminders and recharging options.
*   **Admin Dashboard:** Administrative interface for configuring AI parameters, monitoring API usage, and managing user statistics.
*   **File Storage:** Cloudinary integration for managing avatars and chat images.
*   **UI Design:** Apple-inspired minimalist UI with ample whitespace, subtle shadow usage, rounded elements, and clear typography.
*   **Deployment:** Automated deployment on Netlify and project initialization using the provided CodeGuide Starter Pro repository.

**Out-of-Scope:**

*   **Advanced Customization Beyond Core Themes:** While basic theme variations are supported, excessively advanced customization options (beyond profile and notification settings) are reserved for later phases.
*   **Extensive Third-Party Integrations:** Outside of the specified payment providers (街口支付 and Line Pay), additional payment gateways are not considered in the first version.
*   **Deep Analytics & Data Visualization:** While basic usage, cost, and interaction analytics are provided, advanced analytics dashboards and third-party integrations for detailed BI are planned for future releases.
*   **Unspecified Custom AI Bot Types:** Only knowledge-based, order-based, and a reserved space for future custom bots are included initially; other types are not currently supported.

## 3. User Flow

When a new user opens the “Chat with Me” app, they are greeted with a clean interface inspired by Apple’s design guidelines. The first screen presents the option to sign up or log in using their preferred method (Facebook, Google, or Apple). After authentication via Supabase, the user is guided through a brief onboarding process that explains the chat features and invites them to set up their profile. Once the profile is established, the user lands on a central chat dashboard where they view active conversations and options for starting new chats.

As the user navigates the dashboard, they notice a left sidebar dedicated to quick navigation options – such as accessing friend management, profile settings, and AI customization areas. The main conversation area is designed for clear messaging; it shows real-time chat messages (handled via Supabase Realtime or WebSocket) and supports offline message caching. The AI panel is available within chat windows to provide context-aware suggestions and simulated replies if the other party is not available, ensuring a smooth and engaging chatting experience.

## 4. Core Features

*   **User Authentication:** Secure sign-up/login using Supabase with third-party login options (Facebook, Google, Apple); use of environment variables for secure API key management.
*   **Real-Time Messaging:** Chat system built on Supabase Realtime or WebSocket to deliver instant messages; includes offline caching and synchronization for seamless conversations.
*   **AI-Assisted Chat:** Integration with deepseekAPI and OpenAI for providing real-time conversation suggestions, tone matching, and simulated responses.
*   **Custom AI Bot Services:** Ability for users to create and configure bots (knowledge-based, order-based, and placeholder for custom types) with personalized training prompts.
*   **Friend Management:** Comprehensive system including friend search (by ID, name, QR code), request notifications, and controlled messaging permissions.
*   **Payment and Billing System:** Metering API call usage with integrated payment processing via 街口支付 and Line Pay; features balance alerts and recharging capabilities.
*   **File Storage Integration:** Use Cloudinary to handle avatar images and chat media, ensuring secure file uploads and downloads.
*   **Admin Interface:** Centralized dashboard for LLM parameter configuration, API usage monitoring, and management of user data and chat analytics.
*   **User Profile and Settings:** Personalized settings panel for managing notifications, privacy, and appearance with an Apple design influence.

## 5. Tech Stack & Tools

*   **Frontend Framework:** Next.js with React, using TypeScript for type safety and Chakra UI or Shadcn UI for component styling.

*   **Mobile Support:** Expo for developing cross-platform mobile apps and Xcode for iOS-specific configurations.

*   **Authentication & Database:** Supabase for user authentication, realtime data management, and database storage.

*   **Payment Integration:** Custom integration with 街口支付 and Line Pay for handling AI call billing and recharge processes.

*   **AI Integration:** Connection with deepseekAPI and OpenAI API for AI-assisted chat features, ensuring intelligent and context-aware functionality.

*   **File Storage:** Integration with Cloudinary for image and file management.

*   **Deployment:** Netlify for automated deployment processes.

*   **Additional Tools & IDEs:**

    *   Bolt for quick project scaffolding.
    *   Windsurf and Cursor IDE for advanced AI-powered coding suggestions.
    *   Lovable.dev for generating front-end and full-stack web apps.
    *   Replit for collaborative online coding.
    *   Various AI models (Claude 3.5 Sonnet, GPT 4o, GPT o3-mini, etc.) are available to assist in code generation and reasoning tasks.

## 6. Non-Functional Requirements

*   **Performance:**

    *   Real-time messaging must have near-instant response times (minimal latency).
    *   Offline caching and synchronization must efficiently reconcile messages upon reconnection with minimal delay.

*   **Security:**

    *   All user data and API keys must be securely managed using environment variables.
    *   Authentication and file uploads are protected through secure frameworks (Supabase and Cloudinary).

*   **Usability:**

    *   The UI should be intuitive and clean, following Apple’s design guidelines for clarity, simplicity, and user satisfaction.
    *   Navigation and key interactions must be accessible and straightforward.

*   **Compliance:**

    *   Ensure payment integration complies with local financial regulations for 街口支付 and Line Pay.
    *   General best practice compliance with data protection standards.

*   **Scalability:**

    *   The system is built to support real-time communication and can handle increases in message volume, users, and AI interactions.

## 7. Constraints & Assumptions

*   The app relies on the availability and stable performance of third-party services such as Supabase, Cloudinary, deepseekAPI, and OpenAI APIs.
*   Payment providers are limited to 街口支付 and Line Pay for the initial release; future versions may consider additional providers.
*   The AI back-end is assumed to be capable of scaling and handling multiple API calls simultaneously without significant downtime.
*   The project starts with the predefined tech stack from the CodeGuide Starter Pro kit, which assumes familiarity with Next.js, Tailwind CSS, Typescript, Supabase, and Shadcn UI.
*   It is assumed that the target audience is familiar with a minimalist, Apple-inspired design approach, which drives the app’s UI/UX decisions.
*   The deployment is automated via Netlify, and workflows assume stable internet connectivity for continuous integration and deployment.

## 8. Known Issues & Potential Pitfalls

*   **API Rate Limits:** Both deepseekAPI and OpenAI APIs may have rate limits. Use careful batching or queuing to mitigate potential message delays.
*   **Real-Time Messaging Overload:** High volumes of messages could strain the realtime service. Consider load testing and optimizing subscription mechanisms.
*   **Payment Integration Challenges:** Integration with local payment providers (街口支付 and Line Pay) might require additional compliance and regional configuration, potentially complicating the process.
*   **Offline Synchronization:** Handling edge cases during offline periods, especially with conflicting message updates, could introduce bugs. Thorough testing of caching and sync mechanisms is essential.
*   **Security Risks:** Misconfiguration of environment variables or improper handling of authentication tokens might expose sensitive data. Follow latest security best practices and perform periodic audits.
*   **Cross-Platform Consistency:** Achieving a consistent user experience across Android, iOS, and Web can be challenging, particularly with differences in native behaviors and styling. Regular UI/UX reviews and testing on multiple devices are advised.

This document provides a clear and complete overview of the project “Chat with Me” for the AI model. It includes all core components, the technology foundation, user journeys, and important technical and non-technical requirements. This PRD should serve as the definitive guideline for generating subsequent documents like the Tech Stack Document, Frontend Guidelines, and Backend Structure without ambiguity.
