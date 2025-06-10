import React from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "components/ui/dialog.jsx";
import { Printer, Edit3, Utensils, Save } from 'lucide-react';
import { PREP_GUIDE_ICON_COLORS } from '@/config/prepGuideConfig.jsx';

const DailyShiftPrepGuideHeader = ({
  adjustmentFactor,
  onManageMenuOpen,
  onPrint,
  MenuEditorComponent,
  manageMenuOpen,
  setManageMenuOpen,
  onSaveMenu 
}) => {
  const titleColor = PREP_GUIDE_ICON_COLORS.dailyShift;
  const [currentMenuState, setCurrentMenuState] = React.useState(null);

  const handleSaveClicked = () => {
    if (onSaveMenu && currentMenuState) {
      onSaveMenu(currentMenuState);
    }
  };

  return (
    <Card className="glassmorphic-card no-print card-hover-glow">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className={`p-3 rounded-full bg-gradient-to-tr ${titleColor} shadow-lg`}>
              <Utensils className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${titleColor}`}>Daily Shift Prep Guide</CardTitle>
              <CardDescription className="text-muted-foreground">
                Shift-based prep quantities. Current Adjustment Factor: <span className="font-semibold text-primary">{adjustmentFactor.toFixed(2)}x</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex space-x-3 self-start sm:self-center">
            <Dialog open={manageMenuOpen} onOpenChange={setManageMenuOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => onManageMenuOpen(true)}>
                  <Edit3 className="mr-2 h-4 w-4" /> Manage Menu
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] glassmorphic-card">
                <DialogHeader>
                  <DialogTitle className={`gradient-text ${titleColor}`}>Manage Shift Prep Menu</DialogTitle>
                </DialogHeader>
                <div className="py-4 max-h-[70vh] overflow-y-auto">
                  <MenuEditorComponent 
                    sectionTitleColor={titleColor} 
                    onMenuChange={setCurrentMenuState} 
                  />
                </div>
                <DialogFooter className="sm:justify-between">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSaveClicked} className="btn-gradient">
                    <Save className="mr-2 h-4 w-4" /> Save Menu
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={onPrint} variant="gradient" className={`bg-gradient-to-r ${titleColor} hover:brightness-110`}>
              <Printer className="mr-2 h-4 w-4" /> Print / PDF
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default DailyShiftPrepGuideHeader;

import React from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "components/ui/dialog.jsx";
import { Printer, Edit3, Utensils, Save } from 'lucide-react';
import { PREP_GUIDE_ICON_COLORS } from '@/config/prepGuideConfig.jsxxx';

const DailyShiftPrepGuideHeader = ({
  adjustmentFactor,
  onManageMenuOpen,
  onPrint,
  MenuEditorComponent,
  manageMenuOpen,
  setManageMenuOpen,
  onSaveMenu 
}) => {
  const titleColor = PREP_GUIDE_ICON_COLORS.dailyShift;
  const [currentMenuState, setCurrentMenuState] = React.useState(null);

  const handleSaveClicked = () => {
    if (onSaveMenu && currentMenuState) {
      onSaveMenu(currentMenuState);
    }
  };

  return (
    <Card className="glassmorphic-card no-print card-hover-glow">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className={`p-3 rounded-full bg-gradient-to-tr ${titleColor} shadow-lg`}>
              <Utensils className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${titleColor}`}>Daily Shift Prep Guide</CardTitle>
              <CardDescription className="text-muted-foreground">
                Shift-based prep quantities. Current Adjustment Factor: <span className="font-semibold text-primary">{adjustmentFactor.toFixed(2)}x</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex space-x-3 self-start sm:self-center">
            <Dialog open={manageMenuOpen} onOpenChange={setManageMenuOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => onManageMenuOpen(true)}>
                  <Edit3 className="mr-2 h-4 w-4" /> Manage Menu
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] glassmorphic-card">
                <DialogHeader>
                  <DialogTitle className={`gradient-text ${titleColor}`}>Manage Shift Prep Menu</DialogTitle>
                </DialogHeader>
                <div className="py-4 max-h-[70vh] overflow-y-auto">
                  <MenuEditorComponent 
                    sectionTitleColor={titleColor} 
                    onMenuChange={setCurrentMenuState} 
                  />
                </div>
                <DialogFooter className="sm:justify-between">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSaveClicked} className="btn-gradient">
                    <Save className="mr-2 h-4 w-4" /> Save Menu
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={onPrint} variant="gradient" className={`bg-gradient-to-r ${titleColor} hover:brightness-110`}>
              <Printer className="mr-2 h-4 w-4" /> Print / PDF
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default DailyShiftPrepGuideHeader;
