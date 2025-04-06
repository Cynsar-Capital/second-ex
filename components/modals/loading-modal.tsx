"use client";

import { FocusModal, Text } from "@medusajs/ui";

interface LoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function LoadingModal({
  isOpen,
  onClose,
  message = "Loading your profile data..."
}: LoadingModalProps) {
  return (
    <FocusModal.Content className="max-w-3xl mx-auto" style={{ zIndex: 9999, display: 'flex', flexDirection: 'column', height: '90vh', width: '100%', overflow: 'hidden' }}>
      <FocusModal.Body className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <Text>{message}</Text>
        </div>
      </FocusModal.Body>
    </FocusModal.Content>
  );
}
