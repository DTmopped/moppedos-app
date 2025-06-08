import React from "react";
import { motion } from "framer-motion";
import { Checkbox } from "components/ui/checkbox.jsx";
import { Card, CardContent } from "components/ui/card.jsx";
import { cn } from "@/lib/utils.js";
import { Trash2, Edit } from "lucide-react";

const TaskCard = ({ task, onToggleComplete, onDelete, onEdit }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      layout
      className="w-full"
    >
      <Card 
        className={cn(
          "card-hover mb-3 overflow-hidden border-l-4",
          task.completed ? "border-l-green-500 bg-green-50/30" : 
          task.priority === "high" ? "border-l-red-500" : 
          task.priority === "medium" ? "border-l-yellow-500" : 
          "border-l-blue-500"
        )}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Checkbox 
              checked={task.completed} 
              onCheckedChange={() => onToggleComplete(task.id)}
              className={cn(
                task.completed ? "border-green-500" : 
                task.priority === "high" ? "border-red-500" : 
                task.priority === "medium" ? "border-yellow-500" : 
                "border-blue-500"
              )}
            />
            <div className="flex-1">
              <p className={cn(
                "font-medium",
                task.completed && "line-through text-muted-foreground"
              )}>
                {task.title}
              </p>
              {task.description && (
                <p className={cn(
                  "text-sm text-muted-foreground mt-1",
                  task.completed && "line-through"
                )}>
                  {task.description}
                </p>
              )}
              {task.dueDate && (
                <p className={cn(
                  "text-xs mt-1",
                  task.completed ? "text-muted-foreground" :
                  new Date(task.dueDate) < new Date() ? "text-red-500" :
                  "text-muted-foreground"
                )}>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <Edit className="h-4 w-4 text-muted-foreground" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDelete(task.id)}
              className="p-1.5 rounded-full hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </motion.button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TaskCard;
