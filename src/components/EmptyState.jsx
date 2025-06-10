import React from "react";
import { motion } from "framer-motion";
import { Button } from "components/ui/button.jsx";
import { ClipboardList } from "lucide-react";

const EmptyState = ({ onAddTask }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12 px-4"
    >
      <div className="mx-auto w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full mb-4">
        <ClipboardList className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-medium mb-2">No tasks yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Get started by adding your first task. Stay organized and track your progress easily.
      </p>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button onClick={onAddTask}>
          Add Your First Task
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default EmptyState;
