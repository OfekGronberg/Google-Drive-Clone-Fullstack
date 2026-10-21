import React, { useState } from 'react';

// Simple auth state - no Context API, just a simple object
// This will be passed as props instead of using useContext
export const defaultAuthState = {
  token: 'dev-token',
  userId: 'dev-user-id',
  isLoading: false,
};

// Simple auth functions - will be passed as props
export function createAuthFunctions(setAuthState) {
  return {
    login: (newToken, newUserId) => {
      setAuthState({
        token: newToken,
        userId: newUserId,
        isLoading: false,
      });
    },
    logout: () => {
      setAuthState({
        token: null,
        userId: null,
        isLoading: false,
      });
    },
  };
}
