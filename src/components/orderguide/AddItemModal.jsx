import React from 'react';
import { Dialog } from '@headlessui/react';
import AddItemForm from './AddItemForm';

const AddItemModal = ({ isOpen, onClose, category }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Dialog open={isOpen} onClose={onClose} className="relative z-50 w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg">
          <Dialog.Title className="text-lg font-bold mb-2">Add Item to {category}</Dialog.Title>
          <AddItemForm category={category} onClose={onClose} />
        </div>
      </Dialog>
    </div>
  );
};

export default AddItemModal;
