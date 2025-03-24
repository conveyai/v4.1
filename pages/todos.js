import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { RefreshCw, Plus, Search, Filter, CheckSquare, Calendar, Clock, AlertTriangle, X } from "lucide-react";

// Import responsive components
import ResponsiveLayout from "@/components/ResponsiveLayout";
import ResponsiveModal from "@/components/ResponsiveModal";
import { ResponsiveInput, ResponsiveSelect } from "@/components/ResponsiveFormFields";
import { setupMobileViewport } from "@/utils/mobileViewport";
import TodoForm from "@/components/TodoForm";
import TodoItem from "@/components/TodoItem";

const TodosPage = () => {
  const { data: session } = useSession();
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set up mobile viewport optimizations
    setupMobileViewport();
    
    // Check if we're on a mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load todos on initial render
  useEffect(() => {
    if (session) {
      fetchTodos();
    }
  }, [session]);

  // Apply filters whenever todos or filter settings change
  useEffect(() => {
    applyFilters();
  }, [todos, searchQuery, filterStatus, filterPriority]);

  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/todos");
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      console.error("Failed to fetch todos:", err);
      setError("Failed to load todos. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let result = [...todos];
    
    // Apply status filter
    if (filterStatus === "completed") {
      result = result.filter(todo => todo.completed);
    } else if (filterStatus === "pending") {
      result = result.filter(todo => !todo.completed);
    } else if (filterStatus === "overdue") {
      result = result.filter(todo => {
        if (!todo.dueDate || todo.completed) return false;
        const dueDate = new Date(todo.dueDate);
        const today = new Date();
        
        // Set times to midnight for comparison
        dueDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        return dueDate < today;
      });
    } else if (filterStatus === "upcoming") {
      result = result.filter(todo => {
        if (!todo.dueDate || todo.completed) return false;
        const dueDate = new Date(todo.dueDate);
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        // Set times to midnight for comparison
        dueDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        nextWeek.setHours(0, 0, 0, 0);
        
        return dueDate >= today && dueDate <= nextWeek;
      });
    }
    
    // Apply priority filter
    if (filterPriority !== "all") {
      result = result.filter(todo => todo.priority === filterPriority);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(todo => 
        (todo.title && todo.title.toLowerCase().includes(query)) ||
        (todo.description && todo.description.toLowerCase().includes(query)) ||
        (todo.matter?.property?.address && todo.matter.property.address.toLowerCase().includes(query))
      );
    }
    
    setFilteredTodos(result);
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

  // Get counts for stats
  const getTodoCounts = () => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const overdue = todos.filter(todo => {
      if (!todo.dueDate || todo.completed) return false;
      const dueDate = new Date(todo.dueDate);
      const today = new Date();
      
      // Set times to midnight for comparison
      dueDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      return dueDate < today;
    }).length;
    const upcoming = todos.filter(todo => {
      if (!todo.dueDate || todo.completed) return false;
      const dueDate = new Date(todo.dueDate);
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      // Set times to midnight for comparison
      dueDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      nextWeek.setHours(0, 0, 0, 0);
      
      return dueDate >= today && dueDate <= nextWeek;
    }).length;
    
    return { total, completed, pending: total - completed, overdue, upcoming };
  };

  const counts = getTodoCounts();

  return (
    <ResponsiveLayout title="Todos | Conveyancing Management App">
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-responsive-title mb-4 sm:mb-0">Todo List</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin mr-2" : "mr-2"} />
              {refreshing ? "Refreshing" : "Refresh"}
            </Button>
            <Button 
              variant="primary"
              className="flex items-center justify-center"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} className="mr-2" />
              Add Todo
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Tasks</p>
                  <p className="text-2xl font-semibold">{counts.total}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar size={isMobile ? 16 : 20} className="text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold">{counts.completed}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckSquare size={isMobile ? 16 : 20} className="text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Upcoming</p>
                  <p className="text-2xl font-semibold">{counts.upcoming}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Clock size={isMobile ? 16 : 20} className="text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Overdue</p>
                  <p className="text-2xl font-semibold">{counts.overdue}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle size={isMobile ? 16 : 20} className="text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <ResponsiveInput
              type="text"
              placeholder="Search todos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <ResponsiveSelect
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: "all", label: "All Tasks" },
                  { value: "pending", label: "Pending" },
                  { value: "completed", label: "Completed" },
                  { value: "overdue", label: "Overdue" },
                  { value: "upcoming", label: "Upcoming (7 days)" }
                ]}
                className="pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={16} className="text-gray-400" />
              </div>
            </div>
            
            <div className="relative flex-1">
              <ResponsiveSelect
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
                options={[
                  { value: "all", label: "All Priorities" },
                  { value: "HIGH", label: "High Priority" },
                  { value: "MEDIUM", label: "Medium Priority" },
                  { value: "LOW", label: "Low Priority" }
                ]}
                className="pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AlertTriangle size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Todo List</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-5">
            {loading && !refreshing ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No todos found.</p>
                {(searchQuery || filterStatus !== "all" || filterPriority !== "all") ? (
                  <p className="text-gray-500 mt-2">Try changing your filters.</p>
                ) : (
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="mt-4"
                  >
                    <Plus size={16} className="mr-2" />
                    Create Your First Todo
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTodos.map(todo => (
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
        </Card>

{showAddForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Add New Todo</h2>
        <button 
          onClick={() => setShowAddForm(false)} 
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      </div>
      <div className="overflow-y-auto flex-grow">
        <TodoForm 
          onClose={() => setShowAddForm(false)} 
          onSave={handleAddTodo}
        />
      </div>
    </div>
  </div>
)}

{editingTodo && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Edit Todo</h2>
        <button 
          onClick={() => setEditingTodo(null)} 
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
      </div>
      <div className="overflow-y-auto flex-grow">
        <TodoForm 
          todo={editingTodo}
          onClose={() => setEditingTodo(null)} 
          onSave={handleUpdateTodo}
        />
      </div>
    </div>
  </div>
)}
      </div>
    </ResponsiveLayout>
  );
};

export default TodosPage;