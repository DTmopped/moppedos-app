import React from 'react';

export const COST_PERCENTAGES = {
  food: 0.3,
  bev: 0.2,
  labor: 0.14,
};

export const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const getDayFromDate = (dateString, dayOffset) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + dayOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};