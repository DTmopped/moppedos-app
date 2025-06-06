import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "components/ui/button.jsx";
import { useToast } from "components/ui/use-toast.jsx";
import TaskCard from "components/TaskCard.jsx";
import TaskForm from "components/TaskForm.jsx";
import TaskFilter from "components/TaskFilter.jsx";
import TaskStats from "components/TaskStats.jsx";
import EmptyState from "components/EmptyState.jsx";

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("priority");
  const { toast } = useToast();

  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error("Error parsing tasks from localStorage:", error);
        toast({
          title: "Error loading tasks",
          description: "There was a problem loading your saved tasks.",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleAddOrUpdateTask = (taskData) => {
    if (editingTask) {
      const updatedTasks = tasks.map((task) =>
        task.id === editingTask.id ? { ...taskData, id: task.id } : task
      );
      setTasks(updatedTasks);
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
    } else {
      const newTask = {
        ...taskData,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      setTasks([...tasks, newTask]);
      toast({
        title: "Task added",
        description: "Your new task has been added successfully.",
      });
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleToggleComplete = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    
    const task = tasks.find(t => t.id === id);
    if (task) {
      toast({
        title: task.completed ? "Task marked as incomplete" : "Task completed",
        description: task.title,
      });
    }
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
    toast({
      title: "Task deleted",
      description: "The task has been removed.",
    });
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortOrder === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (sortOrder === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (sortOrder === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortOrder === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return 0;
  });

  return (
    <>
      <header className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gradient mb-2">Task Master</h1>
          <p className="text-muted-foreground">
            Organize your tasks efficiently and boost your productivity
          </p>
        </motion.div>
      </header>

      {tasks.length > 0 && <TaskStats tasks={tasks} />}

      <div className="flex justify-between items-center mb-6">
        {tasks.length > 0 && (
          <TaskFilter 
            filter={filter} 
            setFilter={setFilter} 
            sortOrder={sortOrder} 
            setSortOrder={setSortOrder}
          />
        )}
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={tasks.length > 0 ? "" : "ml-auto"}
        >
          <Button onClick={() => {
            setEditingTask(null);
            setIsFormOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </motion.div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState onAddTask={() => setIsFormOpen(true)} />
      ) : (
        <AnimatePresence>
          <div className="space-y-1">
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      <TaskForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleAddOrUpdateTask}
        editingTask={editingTask}
      />
    </>
  );
};

export default TaskManager;
