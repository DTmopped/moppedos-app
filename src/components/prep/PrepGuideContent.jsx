import React from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Info, ShoppingBasket, Utensils } from 'lucide-react';
import PrepSectionCard from '@/components/prep/PrepSectionCard.jsx';
import DayPrepCard from '@/components/prep/DayPrepCard.jsx';

const PrepGuideContent = ({
  forecastData,
  menuLoading,
  menu,
  prepTextBySection,
  dailyShiftPrepData,
  guideType,
  titleColor,
  onPrepTaskChange 
}) => {
  const iconColorClass = titleColor ? titleColor.split(' ')[1] : 'text-primary';

  if (menuLoading) {
    return (
      <Card className="glassmorphic-card no-print">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground flex flex-col items-center py-10">
            {guideType === 'fullWeekly' ? 
              <ShoppingBasket size={48} className={`mb-4 animate-pulse ${iconColorClass}`} /> :
              <Utensils size={48} className={`mb-4 animate-pulse ${iconColorClass}`} />
            }
            <p className="text-lg font-semibold text-foreground">Loading Menu...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecastData || forecastData.length === 0) {
    return (
      <Card className="glassmorphic-card no-print">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground flex flex-col items-center py-10">
            <Info size={48} className="mb-4 text-primary" />
            <p className="text-lg font-semibold text-foreground">No Forecast Data Available</p>
            <p>Input forecast data using a parser tool first to generate the prep guide.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (guideType === 'fullWeekly') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(menu).map(section => (
          <PrepSectionCard
            key={section}
            sectionTitle={section}
            prepText={prepTextBySection[section] || ""}
            titleColor={titleColor}
            iconColor={iconColorClass}
          />
        ))}
      </div>
    );
  }

  if (guideType === 'dailyShift') {
    return (
      <div className="space-y-6">
        {(dailyShiftPrepData || []).map((dayData, index) => (
          <DayPrepCard 
            key={(dayData?.date || index) + index} 
            dayData={dayData} 
            onPrepTaskChange={onPrepTaskChange} 
          />
        ))}
      </div>
    );
  }

  return null;
};

export default PrepGuideContent;
