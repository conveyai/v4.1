import { useState } from "react";
import { Badge, Button } from "@/components/ui";
import { Check, Clock, Edit, Trash2, Home, AlertTriangle } from "lucide-react";

const TodoItem = ({ todo, onEdit, onDelete, onToggleComplete }) => {
  const [loading, setLoading] = useState(false);
  
  // Format due date
  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    
    const dueDate = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    // Check if due date is today, tomorrow or another day
    if (dueDate.getTime() === today.getTime()) {
      return "Today";
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else {
      return dueDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }
  };
  
  // Get priority badge color
  const getPriorityBadge = (priority) => {
    const variants = {
      "HIGH": "danger",
      "MEDIUM": "warning",
      "LOW": "info"
    };
    
    return <Badge variant={variants[priority] || "default"}>{priority.toLowerCase()}</Badge>;
  };
  
  // Check if todo is overdue
  const isOverdue = () => {
    if (!todo.dueDate) return false;
    
    const dueDate = new Date(todo.dueDate);
    const today = new Date();
    
    // Set times to midnight for comparison
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return dueDate < today && !todo.completed;
  };
  
  // Handle toggle completion
  const handleToggleComplete = async () => {
    setLoading(true);
    await onToggleComplete(todo.id);
    setLoading(false);
  };
  
  return (
    <div className={`border rounded-lg p-4 mb-3 ${todo.completed ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          <button
            className={`mt-1 w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${
              todo.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-500'
            }`}
            onClick={handleToggleComplete}
            disabled={loading}
            aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
          >
            {todo.completed && <Check size={12} />}
          </button>
          
          <div className="flex-1">
            <h3 className={`text-lg font-medium ${todo.completed ? 'line-through text-gray-500' : ''}`}>
              {todo.title}
            </h3>
            
            {todo.description && (
              <p className={`mt-1 text-sm text-gray-600 ${todo.completed ? 'text-gray-400' : ''}`}>
                {todo.description}
              </p>
            )}
            
            <div className="mt-2 flex flex-wrap gap-2 items-center text-sm">
              {todo.dueDate && (
                <div className={`flex items-center ${
                  isOverdue() ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {isOverdue() ? <AlertTriangle size={14} className="mr-1" /> : <Clock size={14} className="mr-1" />}
                  {formatDueDate(todo.dueDate)}
                </div>
              )}
              
              <div className="ml-2">
                {getPriorityBadge(todo.priority)}
              </div>
              
              {todo.matter && (
                <div className="flex items-center text-gray-500 ml-2">
                  <Home size={14} className="mr-1" />
                  <span className="truncate max-w-[150px]">
                    {todo.matter.property?.address ? todo.matter.property.address.split(',')[0] : `Matter #${todo.matterId.slice(0, 6)}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(todo)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Edit todo"
          >
            <Edit size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(todo.id)}
            className="text-gray-500 hover:text-red-600"
            aria-label="Delete todo"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TodoItem;