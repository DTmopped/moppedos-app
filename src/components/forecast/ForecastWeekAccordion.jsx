import React, { useState } from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ForecastWeekAccordion = ({ week, amSplit }) => { 
  const [isOpen, setIsOpen] = useState(false);
  
  console.log('Accordion week data:', week);
  
  const handleClick = () => {
    console.log('CLICK DETECTED! Current state:', isOpen);
    setIsOpen(!isOpen);
  };
  
  const totalSales = week.results?.find(r => r.isTotal)?.sales || 0;

  return (
    <AccordionItem className="border bg-white rounded-lg shadow-sm mb-2">
      <AccordionTrigger 
        onClick={handleClick}
        isOpen={isOpen}
      >
        <div className="flex justify-between w-full items-center">
          <span>TEST - Week of: {week.startDate} (State: {isOpen ? 'OPEN' : 'CLOSED'})</span>
          <span>Total Sales: ${totalSales.toLocaleString()}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent isOpen={isOpen}>
        <div className="p-4">
          <p>TEST CONTENT - This should show when expanded!</p>
          <p>Current state: {isOpen ? 'EXPANDED' : 'COLLAPSED'}</p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default ForecastWeekAccordion;














