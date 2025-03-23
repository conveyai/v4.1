// pages/api/todos/[id].js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API handler for single todo operations (GET, PUT, DELETE)
 */
const handler = async (req, res) => {
  // Check for authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tenantId = session.user.tenantId;
  const conveyancerId = session.user.id;
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: "Todo ID is required" });
  }

  // For all operations, first verify the todo exists and belongs to this conveyancer
  const todo = await prisma.todo.findFirst({
    where: {
      id,
      tenantId,
      conveyancerId
    }
  });
  
  if (!todo) {
    return res.status(404).json({ message: "Todo not found or you don't have permission to access it" });
  }

  // GET - Fetch todo details
  if (req.method === "GET") {
    try {
      const todoDetails = await prisma.todo.findUnique({
        where: { id },
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
      
      // Format dates for frontend display
      const formattedTodo = {
        ...todoDetails,
        dueDate: todoDetails.dueDate ? new Date(todoDetails.dueDate).toISOString() : null,
        created_at: new Date(todoDetails.created_at).toISOString(),
        updated_at: new Date(todoDetails.updated_at).toISOString(),
      };
      
      return res.status(200).json(formattedTodo);
    } catch (error) {
      console.error("Error fetching todo details:", error);
      return res.status(500).json({ message: "Failed to fetch todo details" });
    }
  }
  
  // PUT - Update todo
  if (req.method === "PUT") {
    try {
      const { 
        title, 
        description, 
        dueDate, 
        priority, 
        matterId,
        completed
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

      // Update the todo
      const updatedTodo = await prisma.todo.update({
        where: { id },
        data: {
          title,
          description: description !== undefined ? description : todo.description,
          dueDate: dueDate ? new Date(dueDate) : todo.dueDate,
          priority: priority || todo.priority,
          matterId: matterId !== undefined ? matterId : todo.matterId,
          completed: completed !== undefined ? completed : todo.completed,
          reminderSent: (completed === true) ? true : todo.reminderSent, // If marking as completed, also mark reminders as sent
          updated_at: new Date()
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
        ...updatedTodo,
        dueDate: updatedTodo.dueDate ? new Date(updatedTodo.dueDate).toISOString() : null,
        created_at: new Date(updatedTodo.created_at).toISOString(),
        updated_at: new Date(updatedTodo.updated_at).toISOString(),
      };

      return res.status(200).json(formattedTodo);
    } catch (error) {
      console.error("Error updating todo:", error);
      return res.status(500).json({ message: "Failed to update todo" });
    }
  }
  
  // DELETE - Remove todo
  if (req.method === "DELETE") {
    try {
      await prisma.todo.delete({
        where: { id }
      });
      
      return res.status(200).json({ message: "Todo deleted successfully" });
    } catch (error) {
      console.error("Error deleting todo:", error);
      return res.status(500).json({ message: "Failed to delete todo" });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: "Method not allowed" });
};

export default withErrorHandling(handler);