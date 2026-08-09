import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState(null);

  const showConfirm = useCallback(({ title, message, type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        onConfirm: async () => {
          if (onConfirm) {
            try {
              await onConfirm();
              resolve(true);
            } catch (error) {
              resolve(false);
              throw error;
            }
          } else {
            resolve(true);
          }
          setModalState(null);
        },
        onCancel: () => {
          resolve(false);
          setModalState(null);
        }
      });
    });
  }, []);

  const showSuccess = useCallback((title, message, onClose) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type: 'success',
      confirmText: 'OK',
      cancelText: null,
      onConfirm: () => {
        setModalState(null);
        if (onClose) onClose();
      },
      onCancel: null
    });
  }, []);

  const showError = useCallback((title, message, onClose) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type: 'error',
      confirmText: 'OK',
      cancelText: null,
      onConfirm: () => {
        setModalState(null);
        if (onClose) onClose();
      },
      onCancel: null
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(null);
  }, []);

  return (
    <ModalContext.Provider value={{ showConfirm, showSuccess, showError, closeModal }}>
      {children}
      {modalState && (
        <ConfirmModal
          isOpen={modalState.isOpen}
          title={modalState.title}
          message={modalState.message}
          type={modalState.type}
          confirmText={modalState.confirmText}
          cancelText={modalState.cancelText}
          onConfirm={modalState.onConfirm}
          onCancel={modalState.onCancel}
        />
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}
