// src/pages/index.tsx
// This is the root page of your Next.js application.
// In this setup, the main application logic and routing are handled
// within the `AppContent` component (defined in src/App.tsx).
// This page simply serves as the entry point to render the `AppContent`.

import React from 'react';
import AppCon from '../App'; // Import the main AppContent component

const HomePage: React.FC = () => {
  return (
    // AppContent handles all the conditional rendering (login, onboarding, dashboard)
    // based on authentication and onboarding status.
    <AppCon />
  );
};

export default HomePage;
