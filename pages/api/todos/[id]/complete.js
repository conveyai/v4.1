// pages/api/todos/[id]/complete.js
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

const prisma = new PrismaClient();

/**
 * API handler for toggling todo completion status (PUT)
 */
const handler = async (req, res) => {
  // Only allow PUT requests
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

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

  // Verify the todo exists and belongs to this conveyancer
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

  try {
    // Toggle the completed status
    const completed = !todo.completed;
    
    // Update the todo
    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: {
        completed,
        reminderSent: completed ? true : todo.reminderSent, // If marking as completed, also mark reminders as sent
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
    console.error("Error toggling todo completion:", error);
    return res.status(500).json({ message: "Failed to update todo completion status" });
  }
};

export default withErrorHandling(handler);