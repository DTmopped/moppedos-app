import React, { useState, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Printer, Info, Users, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast.js';
import EditableDailyScheduleTable from './labor/EditableDailyScheduleTable.jsx';
import PrintableLaborSchedule from './labor/PrintableLaborSchedule.jsx';
import { LOCAL_STORAGE_KEY } from '@/config/laborScheduleConfig.jsx';
import { loadSchedule, updateSlotInSchedule } from '@/lib/laborScheduleUtils.js';


const WeeklyLaborScheduleHeader = ({ onSave, onPrint }) => (
  <Card className="glassmorphic-card no-print card-hover-glow">
    <CardHeader className="pb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="p-3 rounded-full bg-gradient-to-tr from-primary to-purple-600 shadow-lg">
            <Users className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold gradient-text">Editable Weekly Labor Schedule</CardTitle>
            <CardDescription className="text-muted-foreground">
              Assign employees and set times. Data is saved locally. Times default by shift.
            </CardDescription>
          </div>
        </div>
        <div className="flex space-x-3 self-start sm:self-center">
          <Button onClick={onSave} variant="gradient" size="lg">
            <Save className="mr-2 h-5 w-5" /> Save Schedule
          </Button>
          <Button onClick={onPrint} variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">
            <Printer className="mr-2 h-5 w-5" /> Print / PDF
          </Button>
        </div>
      </div>
    </CardHeader>
  </Card>
);

const NoForecastDataMessage = () => (
  <Card className="glassmorphic-card no-print">
    <CardContent className="pt-6">
      <div className="text-center text-muted-foreground flex flex-col items-center py-10">
        <Info size={48} className="mb-4 text-primary" />
        <p className="text-lg font-semibold text-foreground">No Forecast Data Available</p>
        <p>Displaying default schedule structure. Input forecast data for accurate headcount.</p>
        <p className="text-xs mt-2">The labor schedule relies on this data to calculate headcount.</p>
      </div>
    </CardContent>
  </Card>
);


const WeeklyLaborSchedule = () => {
  const { forecastData } = useData();
  const [scheduleData, setScheduleData] = useState({});
  const [printDate, setPrintDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const initialSchedule = loadSchedule(forecastData || [], localStorage.getItem(LOCAL_STORAGE_KEY));
    setScheduleData(initialSchedule);
    setIsLoading(false);
  }, [forecastData]);


  const handleUpdateSchedule = (date, roleName, shift, slotIndex, field, value) => {
    setScheduleData(prev => updateSlotInSchedule(prev, date, roleName, shift, slotIndex, field, value));
  };
  
  const saveScheduleToLocalStorage = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scheduleData));
    toast({
      title: "Schedule Saved!",
      description: "Your labor schedule has been saved locally.",
      action: <Save className="text-green-500" />,
    });
  };

  const handlePrint = () => {
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay(); 
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(new Date(currentDate).setDate(currentDate.getDate() + diffToMonday));
    const weekEnd = new Date(new Date(weekStart).setDate(weekStart.getDate() + 6));
    
    const formattedPrintDate = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    setPrintDate(formattedPrintDate);

    const printableComponentHtml = ReactDOMServer.renderToStaticMarkup(
      <PrintableLaborSchedule scheduleData={scheduleData} printDate={formattedPrintDate} />
    );

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';

    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Weekly Labor Schedule - Print</title>
        </head>
        <body>
          ${printableComponentHtml}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    
    setTimeout(() => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  const sortedDates = Object.keys(scheduleData).sort((a, b) => new Date(a) - new Date(b));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-muted-foreground">Loading schedule...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <WeeklyLaborScheduleHeader onSave={saveScheduleToLocalStorage} onPrint={handlePrint} />

      <div className="printable-content printable-labor-schedule">
        {(!forecastData || forecastData.length === 0) && (
          <NoForecastDataMessage />
        )}

        {sortedDates.length > 0 ? sortedDates.map(date => (
           <EditableDailyScheduleTable 
             key={date} 
             day={date} 
             dailyScheduleData={scheduleData[date] || []}
             onUpdate={handleUpdateSchedule}
           />
        )) : (
          !isLoading && <Card className="glassmorphic-card no-print"><CardContent className="pt-6"><p className="text-center text-muted-foreground py-10">No schedule data to display. Try parsing forecast data.</p></CardContent></Card>
        )}
      </div>
    </motion.div>
  );
};

export default WeeklyLaborSchedule;
