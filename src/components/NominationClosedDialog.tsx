"use client";

import { X, Info } from "lucide-react";

interface NominationClosedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export function NominationClosedDialog({ isOpen, onClose, message }: NominationClosedDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Voting Closed</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed mb-6">
            {message}
          </p>
          
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>What's next?</strong> Stay tuned for future voting opportunities and check back for the next voting period.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}