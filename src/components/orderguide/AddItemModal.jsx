import React from 'react';
import { Dialog } from '@headlessui/react';
import AddItemForm from './AddItemForm';

const AddItemModal = ({ isOpen, onClose, category }) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
          <Dialog.Title className="text-lg font-bold mb-4">
            Add Item to {category}
          </Dialog.Title>
          <AddItemForm category={category} onClose={onClose} />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddItemModal;
