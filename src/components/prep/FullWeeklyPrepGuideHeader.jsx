import React from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "components/ui/dialog.jsx";
import { Printer, Edit3, ShoppingBasket } from 'lucide-react';
import { PREP_GUIDE_ICON_COLORS } from '@/config/prepGuideConfig.jsx';

const FullWeeklyPrepGuideHeader = ({
  adjustmentFactor,
  onManageMenuOpen,
  onPrint,
  MenuEditorComponent,
  manageMenuOpen,
  setManageMenuOpen
}) => {
  const titleColor = PREP_GUIDE_ICON_COLORS.fullWeekly;

  return (
    <Card className="glassmorphic-card no-print card-hover-glow">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className={`p-3 rounded-full bg-gradient-to-tr ${titleColor} shadow-lg`}>
              <ShoppingBasket className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${titleColor}`}>Full Weekly Prep Guide</CardTitle>
              <CardDescription className="text-muted-foreground">
                Dynamic prep quantities. Current Adjustment Factor: <span className="font-semibold text-primary">{adjustmentFactor.toFixed(2)}x</span>
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
                  <DialogTitle className={`gradient-text ${titleColor}`}>Manage Full Prep Menu</DialogTitle>
                </DialogHeader>
                <div className="py-4 max-h-[70vh] overflow-y-auto">
                  <MenuEditorComponent sectionTitleColor={titleColor} />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
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

export default FullWeeklyPrepGuideHeader;
