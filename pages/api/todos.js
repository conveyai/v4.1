// pages/api/todos.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API handler for todo operations (GET, POST)
 */
const handler = async (req, res) => {
  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const conveyancerId = session.user.id;
  
  // GET - Fetch todos for the current conveyancer
  if (req.method === "GET") {
    try {
      // Check if we should filter by matter
      const { matterId, status } = req.query;
      
      // Base query conditions
      const whereCondition = {
        tenantId,
        conveyancerId
      };
      
      // Add matter filter if provided
      if (matterId) {
        whereCondition.matterId = matterId;
      }
      
      // Add status filter if provided
      if (status === 'completed') {
        whereCondition.completed = true;
      } else if (status === 'pending') {
        whereCondition.completed = false;
      }
      
      const todos = await prisma.todo.findMany({
        where: whereCondition,
        include: {
          matter: {
            select: {
              id: true,
              property: {
                select: {
                  address: true
                }
              }
            }
          }
        },
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
      console.error("Error fetching todos:", error);
      return res.status(500).json({ message: "Failed to fetch todos" });
    }
  }
  
  // POST - Create a new todo
  if (req.method === "POST") {
    try {
      const { 
        title, 
        description, 
        dueDate, 
        priority, 
        matterId 
      } = req.body;

      // Validate required fields
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      
      // Validate priority if provided
      if (priority && !['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
        return res.status(400).json({ message: "Priority must be HIGH, MEDIUM, or LOW" });
      }

      // Validate matter if provided
      if (matterId) {
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
      }

      // Create the todo
      const newTodo = await prisma.todo.create({
        data: {
          title,
          description: description || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          priority: priority || "MEDIUM",
          matterId: matterId || null,
          conveyancerId,
          tenantId,
          completed: false,
          reminderSent: false
        },
        include: {
          matter: {
            select: {
              id: true,
              property: {
                select: {
                  address: true
                }
              }
            }
          }
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
      console.error("Error creating todo:", error);
      return res.status(500).json({ message: "Failed to create todo" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);