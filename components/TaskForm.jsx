import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "components/ui/button.jsx";
import { Input } from "components/ui/input.jsx";
import { Label } from "components/ui/label.jsx";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "components/ui/dialog.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu.jsx";
import { ChevronDown } from "lucide-react";

const TaskForm = ({ open, onOpenChange, onSave, editingTask = null }) => {
  const [task, setTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    completed: false
  });

  useEffect(() => {
    if (editingTask) {
      setTask({
        ...editingTask,
        dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ""
      });
    } else {
      setTask({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        completed: false
      });
    }
  }, [editingTask, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : null
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
  };

  const setPriority = (priority) => {
    setTask(prev => ({ ...prev, priority }));
  };

  const priorityColors = {
    low: "bg-blue-500",
    medium: "bg-yellow-500",
    high: "bg-red-500"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              name="title"
              value={task.title}
              onChange={handleChange}
              placeholder="What needs to be done?"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              name="description"
              value={task.description}
              onChange={handleChange}
              placeholder="Add details about this task"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Priority</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${priorityColors[task.priority]}`}></div>
                    <span className="capitalize">{task.priority}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuItem onClick={() => setPriority("low")} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Low</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriority("medium")} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Medium</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriority("high")} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>High</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              value={task.dueDate}
              onChange={handleChange}
            />
          </div>
          
          <DialogFooter>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button type="submit">
                {editingTask ? "Update Task" : "Add Task"}
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;
