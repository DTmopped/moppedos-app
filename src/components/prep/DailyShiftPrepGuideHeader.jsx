import React from "react";
import { Button } from '@/components/ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog.jsx';
import { Printer, Edit3 } from 'lucide-react';
import { useMenuManager } from '@/hooks/useMenuManager.jsx';
import MenuEditorComponent from '@/components/prep/MenuEditorComponent.jsx';

const DailyShiftPrepGuideHeader = ({
  title,
  totalGuests,
  amGuests,
  pmGuests,
  manageMenuOpen,
  setManageMenuOpen,
  onPrint
}) => {
  const {
    menu,
    editorsVisibility,
    toggleEditor,
    newItemForms,
    handleNewItemChange,
    addMenuItem,
    removeMenuItem
  } = useMenuManager('dailyShiftPrepGuideMenu');

  return (
    <div className="mb-6 border-b border-slate-600 pb-4">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
          <span className="mr-4">Total Guests: {totalGuests?.toLocaleString()}</span>
          <span className="mr-4">AM: {amGuests?.toLocaleString()}</span>
          <span>PM: {pmGuests?.toLocaleString()}</span>
        </div>
        <div className="flex space-x-2">
          <Dialog open={manageMenuOpen} onOpenChange={setManageMenuOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
                onClick={() => setManageMenuOpen(true)}
              >
                <Edit3 className="mr-2 h-4 w-4" /> Manage Menu
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] glassmorphic-card">
              <DialogHeader>
                <DialogTitle className="gradient-text text-yellow-500">Manage Shift Prep Menu</DialogTitle>
              </DialogHeader>
              <div className="py-4 max-h-[70vh] overflow-y-auto">
                <MenuEditorComponent
                  sectionTitleColor="text-yellow-500"
                  menu={menu}
                  editorsVisibility={editorsVisibility}
                  toggleEditor={toggleEditor}
                  newItemForms={newItemForms}
                  handleNewItemChange={handleNewItemChange}
                  addMenuItem={addMenuItem}
                  removeMenuItem={removeMenuItem}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={onPrint} variant="gradient" className="bg-yellow-500 hover:brightness-110">
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DailyShiftPrepGuideHeader;
