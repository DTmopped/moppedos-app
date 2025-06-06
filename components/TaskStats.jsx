import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "components/ui/card.jsx";
import { Slider } from "components/ui/slider.jsx";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

const TaskStats = ({ tasks }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const highPriorityTasks = tasks.filter(task => task.priority === "high" && !task.completed).length;
  const overdueTasks = tasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
  ).length;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-blue-700">Task Progress</h3>
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{completionRate.toFixed(0)}%</span>
              </div>
              <Slider 
                value={[completionRate]} 
                max={100} 
                step={1}
                disabled
                className="cursor-default"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-yellow-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-amber-700">Overdue Tasks</h3>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold text-amber-600">{overdueTasks}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {overdueTasks === 0 
                  ? "No overdue tasks. Great job!" 
                  : overdueTasks === 1 
                    ? "Task needs attention" 
                    : "Tasks need attention"}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-red-700">High Priority</h3>
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold text-red-600">{highPriorityTasks}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {highPriorityTasks === 0 
                  ? "No high priority tasks" 
                  : highPriorityTasks === 1 
                    ? "High priority task" 
                    : "High priority tasks"}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TaskStats;
