// src/components/ui/Alert.tsx - Actualización para soportar onClose

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface AlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
  onClose?: () => void; // ✅ Agregar prop onClose
}

const Alert: React.FC<AlertProps> = ({ type, children, className = '', onClose }) => {
  const baseClasses = 'rounded-md p-4 mb-4';
  
  const typeClasses = {
    success: 'bg-green-50 border border-green-200 text-green-800',
    warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
    info: 'bg-blue-50 border border-blue-200 text-blue-800',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      <div className="flex">
        <div className="flex-1">
          {children}
        </div>
        {onClose && (
          <div className="ml-4">
            <button
              type="button"
              className="inline-flex rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;