import { useState, useEffect } from "react";
import { 
  Card, 
  CardHeader,
  CardTitle,
  CardContent, 
  Button 
} from "@/components/ui";
import { Plus, CheckSquare, RefreshCw } from "lucide-react";
import TodoItem from "./TodoItem";
import TodoForm from "./TodoForm";

const MatterTodoSection = ({ matterId }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (matterId) {
      fetchTodos();
    }
  }, [matterId]);

  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/matters/${matterId}/todos`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      console.error("Failed to fetch todos for matter:", err);
      setError("Failed to load todos. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTodos();
  };

  const handleAddTodo = (newTodo) => {
    setTodos([newTodo, ...todos]);
    setShowAddForm(false);
  };

  const handleUpdateTodo = (updatedTodo) => {
    setTodos(todos.map(todo => 
      todo.id === updatedTodo.id ? updatedTodo : todo
    ));
    setEditingTodo(null);
  };

  const handleDeleteTodo = async (todoId) => {
    if (!confirm("Are you sure you want to delete this todo?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }
      
      // Remove todo from state
      setTodos(todos.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error("Error deleting todo:", error);
      setError("Failed to delete todo. Please try again.");
    }
  };

  const handleToggleComplete = async (todoId) => {
    try {
      const response = await fetch(`/api/todos/${todoId}/complete`, {
        method: "PUT"
      });
      
      if (!response.ok) {
        throw new Error("Failed to update todo status");
      }
      
      const updatedTodo = await response.json();
      
      // Update todo in state
      setTodos(todos.map(todo => 
        todo.id === updatedTodo.id ? updatedTodo : todo
      ));
    } catch (error) {
      console.error("Error updating todo status:", error);
      setError("Failed to update todo status. Please try again.");
    }
  };

  // Count pending todos
  const pendingCount = todos.filter(todo => !todo.completed).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          <CardTitle>Tasks</CardTitle>
          {pendingCount > 0 && (
            <div className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {pendingCount} pending
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </Button>
          <Button 
            variant="primary"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="flex items-center"
          >
            <Plus size={16} className="mr-1" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {loading && !refreshing ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-6">
            <CheckSquare className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-gray-500">No tasks for this matter yet</p>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="mt-3"
              size="sm"
            >
              Add a task
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {todos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onEdit={setEditingTodo}
                onDelete={handleDeleteTodo}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </div>
        )}
      </CardContent>

      {showAddForm && (
        <TodoForm 
          matterId={matterId}
          onClose={() => setShowAddForm(false)} 
          onSave={handleAddTodo}
        />
      )}

      {editingTodo && (
        <TodoForm 
          todo={editingTodo}
          matterId={matterId}
          onClose={() => setEditingTodo(null)} 
          onSave={handleUpdateTodo}
        />
      )}
    </Card>
  );
};

export default MatterTodoSection;