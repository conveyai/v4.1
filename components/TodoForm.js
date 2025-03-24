import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

const TodoForm = ({ todo, onClose, onSave, matterId }) => {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
    matterId: matterId || null
  });

  const [matters, setMatters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize form with todo data if editing
  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title || "",
        description: todo.description || "",
        dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 10) : "",
        priority: todo.priority || "MEDIUM",
        matterId: todo.matterId || null
      });
    } else if (matterId) {
      setFormData(prev => ({
        ...prev,
        matterId
      }));
    }
  }, [todo, matterId]);

  // Fetch matters when the component mounts
  useEffect(() => {
    const fetchMatters = async () => {
      if (!session) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/matters');
        if (!response.ok) {
          throw new Error('Failed to fetch matters');
        }
        const data = await response.json();
        setMatters(data);
      } catch (error) {
        console.error('Error fetching matters:', error);
        setError('Failed to load matters. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatters();
  }, [session]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    
    if (formData.dueDate) {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.dueDate = "Due date cannot be in the past";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      // Determine if creating or updating
      const url = todo ? `/api/todos/${todo.id}` : "/api/todos";
      const method = todo ? "PUT" : "POST";

      // Prepare data - null out empty strings
      const submitData = {
        ...formData,
        description: formData.description.trim() || null,
        dueDate: formData.dueDate || null,
        matterId: formData.matterId || null
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${todo ? 'update' : 'create'} todo`);
      }

      const savedTodo = await response.json();
      onSave(savedTodo);
    } catch (error) {
      console.error("Save error:", error);
      setError(error.message || `Failed to ${todo ? 'update' : 'create'} todo`);
    } finally {
      setSaving(false);
    }
  };

 return (
  <div className="p-6">
    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    )}

    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Input
          id="title"
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="What needs to be done?"
          error={validationErrors.title}
          required
        />
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add details (optional)"
            className="px-3 py-2 w-full border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-300 focus:ring-blue-200 h-24"
          />
        </div>
        
        <Input
          id="dueDate"
          label="Due Date"
          type="date"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          error={validationErrors.dueDate}
        />
        
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="px-3 py-2 w-full border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-300 focus:ring-blue-200"
          >
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        
        {!matterId && (
          <div>
            <label htmlFor="matterId" className="block text-sm font-medium text-gray-700 mb-1">
              Related Matter (Optional)
            </label>
            <select
              id="matterId"
              name="matterId"
              value={formData.matterId || ""}
              onChange={handleChange}
              className="px-3 py-2 w-full border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-300 focus:ring-blue-200"
            >
              <option value="">No related matter</option>
              {matters.map(matter => (
                <option key={matter.id} value={matter.id}>
                  {matter.property?.address || `Matter #${matter.id.slice(0, 6)}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <Button 
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving}
        >
          {saving ? "Saving..." : todo ? "Update Todo" : "Add Todo"}
        </Button>
      </div>
    </form>
  </div>
);
};

export default TodoForm;