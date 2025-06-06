import React from "react";
import { Tabs, TabsList, TabsTrigger } from "components/ui/tabs.jsx";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from "components/ui/dropdown-menu.jsx";
import { Button } from "components/ui/button.jsx";
import { SlidersHorizontal, Check } from "lucide-react";

const TaskFilter = ({ filter, setFilter, sortOrder, setSortOrder }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <Tabs 
        value={filter} 
        onValueChange={setFilter}
        className="w-full max-w-md"
      >
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-2">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => setSortOrder("priority")}
            className="flex items-center justify-between"
          >
            By Priority
            {sortOrder === "priority" && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setSortOrder("dueDate")}
            className="flex items-center justify-between"
          >
            By Due Date
            {sortOrder === "dueDate" && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setSortOrder("newest")}
            className="flex items-center justify-between"
          >
            Newest First
            {sortOrder === "newest" && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setSortOrder("oldest")}
            className="flex items-center justify-between"
          >
            Oldest First
            {sortOrder === "oldest" && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TaskFilter;
