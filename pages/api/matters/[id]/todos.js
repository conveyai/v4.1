// pages/api/matters/[id]/todos.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API handler for matter-specific todos (GET, POST)
 */
const handler = async (req, res) => {
  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const conveyancerId = session.user.id;
  const { id: matterId } = req.query;
  
  if (!matterId) {
    return res.status(400).json({ message: "Matter ID is required" });
  }

  // Verify the matter exists and belongs to this conveyancer
  const matter = await prisma.matter.findFirst({
    where: {
      id: matterId,
      tenantId,
      conveyancerId
    }
  });
  
  if (!matter) {
    return res.status(404).json({ message: "Matter not found or you don't have permission to access it" });
  }

  // GET - Fetch todos for this matter
  if (req.method === "GET") {
    try {
      // Check if we should filter by status
      const { status } = req.query;
      
      // Base query conditions
      const whereCondition = {
        matterId,
        tenantId,
        conveyancerId
      };
      
      // Add status filter if provided
      if (status === 'completed') {
        whereCondition.completed = true;
      } else if (status === 'pending') {
        whereCondition.completed = false;
      }
      
      const todos = await prisma.todo.findMany({
        where: whereCondition,
        orderBy: [
          { completed: 'asc' },
          { dueDate: 'asc' },
          { priority: 'desc' }
        ]
      });
      
      // Format dates for frontend display
      const formattedTodos = todos.map(todo => ({
        ...todo,
        dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString() : null,
        created_at: new Date(todo.created_at).toISOString(),
        updated_at: new Date(todo.updated_at).toISOString(),
      }));
      
      return res.status(200).json(formattedTodos);
    } catch (error) {
      console.error("Error fetching todos for matter:", error);
      return res.status(500).json({ message: "Failed to fetch todos for matter" });
    }
  }
  
  // POST - Create a new todo for this matter
  if (req.method === "POST") {
    try {
      const { title, description, dueDate, priority } = req.body;

      // Validate required fields
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      
      // Validate priority if provided
      if (priority && !['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
        return res.status(400).json({ message: "Priority must be HIGH, MEDIUM, or LOW" });
      }

      // Create the todo
      const newTodo = await prisma.todo.create({
        data: {
          title,
          description: description || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          priority: priority || "MEDIUM",
          matterId,
          conveyancerId,
          tenantId,
          completed: false,
          reminderSent: false
        }
      });

      // Format dates for response
      const formattedTodo = {
        ...newTodo,
        dueDate: newTodo.dueDate ? new Date(newTodo.dueDate).toISOString() : null,
        created_at: new Date(newTodo.created_at).toISOString(),
        updated_at: new Date(newTodo.updated_at).toISOString(),
      };

      return res.status(201).json(formattedTodo);
    } catch (error) {
      console.error("Error creating todo for matter:", error);
      return res.status(500).json({ message: "Failed to create todo for matter" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);