'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@repo/ui';

export interface PromptOptions {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'text' | 'password' | 'email' | 'number';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

interface PromptContextType {
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export const usePrompt = () => {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error('usePrompt must be used within a PromptProvider');
  }
  return context;
};

interface PromptProviderProps {
  children: ReactNode;
}

export const PromptProvider: React.FC<PromptProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<PromptOptions | null>(null);
  const [resolve, setResolve] = useState<((value: string | null) => void) | null>(null);

  const prompt = useCallback((promptOptions: PromptOptions): Promise<string | null> => {
    return new Promise((res) => {
      setOptions(promptOptions);
      setResolve(() => res);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback((value: string) => {
    if (resolve) {
      resolve(value);
    }
    setIsOpen(false);
    setOptions(null);
    setResolve(null);
  }, [resolve]);

  const handleCancel = useCallback(() => {
    if (resolve) {
      resolve(null);
    }
    setIsOpen(false);
    setOptions(null);
    setResolve(null);
  }, [resolve]);

  return (
    <PromptContext.Provider value={{ prompt }}>
      {children}
      {isOpen && options && (
        <PromptModal
          options={options}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </PromptContext.Provider>
  );
};

interface PromptModalProps {
  options: PromptOptions;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const PromptModal: React.FC<PromptModalProps> = ({ options, onConfirm, onCancel }) => {
  const [value, setValue] = useState(options.defaultValue || '');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (options.required && !value.trim()) {
      setError('필수 입력 항목입니다.');
      return;
    }

    if (options.minLength && value.length < options.minLength) {
      setError(`최소 ${options.minLength}자 이상 입력해주세요.`);
      return;
    }

    if (options.maxLength && value.length > options.maxLength) {
      setError(`최대 ${options.maxLength}자까지 입력 가능합니다.`);
      return;
    }

    onConfirm(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (error) {
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* 배경 오버레이 */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onCancel}
        />
        
        {/* 모달 */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  {options.title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {options.message}
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="mt-4">
                  <div>
                    <input
                      ref={inputRef}
                      type={options.type || 'text'}
                      value={value}
                      onChange={handleInputChange}
                      placeholder={options.placeholder}
                      className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                        error ? 'ring-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-600">
                        {error}
                      </p>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <Button
              onClick={() => handleSubmit(new Event('submit') as any)}
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
            >
              {options.confirmText || '확인'}
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              {options.cancelText || '취소'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
