import React from 'react';
import { Sunrise, Sunset } from 'lucide-react';

export const OZ_PER_LB = 16;
export const SPEND_PER_GUEST = 15; 
export const CAPTURE_RATE = 0.15; 

export const SHIFTS_CONFIG = {
  AM: { name: 'AM Shift', percentage: 0.6, icon: <Sunrise size={20} className="mr-2 text-yellow-400 no-print" />, color: "text-yellow-400" },
  PM: { name: 'PM Shift', percentage: 0.4, icon: <Sunset size={20} className="mr-2 text-orange-400 no-print" />, color: "text-orange-400" }
};

export const PREP_GUIDE_ICON_COLORS = {
  fullWeekly: "from-purple-400 to-indigo-500",
  dailyShift: "from-green-400 to-lime-500",
};