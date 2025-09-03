'use client';

import React, { ReactNode } from 'react';
import { ToastProvider } from './toast';
import { ConfirmProvider } from './confirm-modal';
import { PromptProvider } from './prompt-modal';

interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <PromptProvider>
          {children}
        </PromptProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
};
