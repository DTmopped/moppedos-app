import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Clock, TrendingUp, AlertCircle } from 'lucide-react';

const RethermSchedule = ({ prepTasks, prepSchedule }) => {
  if (!prepTasks || prepTasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No retherm schedule available.</p>
        <p className="text-sm mt-2">Prep tasks must be created first.</p>
      </div>
    );
  }

  // Filter for proteins (main items that need retherm)
  const proteinTasks = prepTasks.filter(task => {
    const category = task.menu_items?.category_normalized || task.category || '';
    return category.toLowerCase().includes('protein') || 
           category.toLowerCase().includes('meat') ||
           task.menu_items?.name?.toLowerCase().includes('brisket') ||
           task.menu_items?.name?.toLowerCase().includes('ribs') ||
           task.menu_items?.name?.toLowerCase().includes('pork') ||
           task.menu_items?.name?.toLowerCase().includes('chicken');
  });

  // Generate simple retherm milestones based on service times
  const generateMilestones = (task) => {
    const menuItemName = task.menu_items?.name || task.menu_item_name || 'Unknown';
    const quantity = task.quantity || 0;
    
    // Simple milestone logic: divide into service periods
    const milestones = [
      {
        time: '11:00 AM',
        intensity: 'moderate',
        quantity: Math.ceil(quantity * 0.4),
        cumulative_quantity: Math.ceil(quantity * 0.4),
        description: 'Initial service setup - have ready before doors open',
        reasoning: 'Early lunch crowd, moderate demand expected'
      },
      {
        time: '12:30 PM',
        intensity: 'rush',
        quantity: Math.ceil(quantity * 0.3),
        cumulative_quantity: Math.ceil(quantity * 0.7),
        description: 'Peak lunch rush - retherm additional batch',
        reasoning: 'Historical data shows peak demand during this period'
      },
      {
        time: '5:30 PM',
        intensity: 'steady',
        quantity: Math.ceil(quantity * 0.2),
        cumulative_quantity: Math.ceil(quantity * 0.9),
        description: 'Dinner service prep - maintain hot hold',
        reasoning: 'Steady dinner service, keep quality high'
      },
      {
        time: '7:00 PM',
        intensity: 'moderate',
        quantity: Math.ceil(quantity * 0.1),
        cumulative_quantity: quantity,
        description: 'Final service batch - use remaining prep',
        reasoning: 'Wind down service, minimize waste'
      }
    ];
    
    return {
      menu_item_name: menuItemName,
      total_quantity: quantity,
      milestones: milestones,
      current_hot_hold: 0,
      next_action: 'Start retherm at 10:00 AM for 11:00 AM service'
    };
  };

  const rethermItems = proteinTasks.map(generateMilestones);

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
                This schedule is based on typical service patterns for BBQ restaurants. 
                Retherm in batches to maintain quality and avoid waste.
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-600">RUSH = Peak demand</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">Steady service</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-gray-600">Moderate pace</span>
                </div>
              </div>
              {prepSchedule && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-gray-900">
                    Expected Guests: <span className="text-blue-600">{prepSchedule.expected_guests || 0}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retherm Items */}
      {rethermItems.length > 0 ? (
        rethermItems.map((item, idx) => (
          <RethermItemCard 
            key={idx} 
            data={item}
          />
        ))
      ) : (
        <Card className="border-gray-200">
          <CardContent className="pt-6 text-center text-gray-500">
            <p>No protein items found in prep schedule.</p>
            <p className="text-sm mt-2">Sides and desserts typically don't require retherm scheduling.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const RethermItemCard = ({ data }) => {
  const totalQuantity = data.total_quantity;
  const hasPeak = data.milestones.some(m => m.intensity === 'rush' || m.intensity === 'peak');

  return (
    <Card className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="h-6 w-6 text-orange-500" />
            <div>
              <CardTitle className="text-xl">{data.menu_item_name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Total Service Need: <span className="font-semibold text-gray-900">{totalQuantity} lbs</span>
              </p>
            </div>
          </div>
          {hasPeak && (
            <Badge variant="destructive" className="bg-orange-100 text-orange-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              Peak Service Item
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
                <p className="font-medium text-gray-900 mb-1">Next Action</p>
                <p className="text-sm text-gray-700">
                  {data.next_action}
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
    'moderate': 'bg-gray-500 border-gray-600',
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
          {milestone.description}
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
