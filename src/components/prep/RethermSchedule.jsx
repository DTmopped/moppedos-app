import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Clock, TrendingUp, AlertCircle } from 'lucide-react';

const RethermSchedule = ({ schedule }) => {
  if (!schedule || !schedule.retherm_milestones) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No retherm schedule available.</p>
      </div>
    );
  }

  // Group milestones by menu item
  const milestonesByItem = schedule.retherm_milestones.reduce((acc, milestone) => {
    const itemName = milestone.menu_item_name;
    if (!acc[itemName]) {
      acc[itemName] = {
        item: milestone,
        milestones: []
      };
    }
    acc[itemName].milestones.push(milestone);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Flame className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Smart Retherm Schedule
              </h3>
              <p className="text-sm text-gray-700">
                This schedule is based on your historical demand patterns. 
                Retherm in batches to maintain quality and avoid waste.
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-600">RUSH = Peak demand</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">Steady service</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retherm Items */}
      {Object.entries(milestonesByItem).map(([itemName, data]) => (
        <RethermItemCard 
          key={itemName} 
          itemName={itemName}
          data={data}
        />
      ))}
    </div>
  );
};

const RethermItemCard = ({ itemName, data }) => {
  const totalQuantity = data.milestones.reduce((sum, m) => sum + m.quantity, 0);
  const hasPeak = data.milestones.some(m => m.intensity === 'rush' || m.intensity === 'peak');

  return (
    <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="h-6 w-6 text-orange-500" />
            <div>
              <CardTitle className="text-xl">{itemName}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Total Service Need: <span className="font-semibold text-gray-900">{totalQuantity} lbs</span>
              </p>
            </div>
          </div>
          {hasPeak && (
            <Badge variant="destructive" className="bg-orange-100 text-orange-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              High Demand Item
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Service Milestones
          </h4>
          
          {/* Timeline */}
          <div className="relative">
            {data.milestones.map((milestone, idx) => (
              <MilestoneItem 
                key={idx}
                milestone={milestone}
                isLast={idx === data.milestones.length - 1}
              />
            ))}
          </div>

          {/* Current Status */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-1">Current Hot Hold</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.item.current_hot_hold || 0} lbs
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Action:</span> {data.item.next_action || 'Monitor service pace'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MilestoneItem = ({ milestone, isLast }) => {
  const intensityColors = {
    'moderate': 'bg-blue-500 border-blue-600',
    'steady': 'bg-blue-500 border-blue-600',
    'rush': 'bg-orange-500 border-orange-600',
    'peak': 'bg-red-500 border-red-600'
  };

  const intensityLabels = {
    'moderate': 'Moderate pace',
    'steady': 'Steady service',
    'rush': 'RUSH',
    'peak': 'PEAK DEMAND'
  };

  const dotColor = intensityColors[milestone.intensity] || 'bg-gray-500 border-gray-600';
  const label = intensityLabels[milestone.intensity] || milestone.intensity;

  return (
    <div className="relative flex items-start gap-4 pb-8">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-300"></div>
      )}

      {/* Timeline Dot */}
      <div className={`relative z-10 w-6 h-6 rounded-full border-2 ${dotColor} flex-shrink-0`}></div>

      {/* Content */}
      <div className="flex-1 pt-0.5">
        <div className="flex items-baseline gap-3 mb-1">
          <p className="text-lg font-bold text-gray-900">{milestone.time}</p>
          <Badge 
            variant={milestone.intensity === 'rush' || milestone.intensity === 'peak' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {label}
          </Badge>
        </div>
        
        <p className="text-base font-semibold text-gray-900 mb-1">
          Have {milestone.cumulative_quantity} lbs ready
        </p>
        
        <p className="text-sm text-gray-600">
          {milestone.description || `${milestone.quantity} lbs for this period`}
        </p>

        {milestone.reasoning && (
          <p className="text-xs text-gray-500 mt-2 italic">
            💡 {milestone.reasoning}
          </p>
        )}
      </div>
    </div>
  );
};

export default RethermSchedule;
