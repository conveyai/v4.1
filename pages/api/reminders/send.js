// pages/api/reminders/send.js
// This would typically be called by a cron job
import { PrismaClient } from "@prisma/client";
import { withErrorHandling } from "@/utils/authMiddleware";

const prisma = new PrismaClient();

/**
 * API handler for sending reminders for upcoming todos
 * This would typically be called by a scheduled cron job
 */
const handler = async (req, res) => {
  // Only allow POST requests with a valid API key
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Validate API key for cron job access
  // This is a simple example - you should use a more secure method in production
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.REMINDER_API_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Get current date
    const now = new Date();
    
    // Get todos with due dates coming up within the next 24 hours that haven't had reminders sent
    const today = new Date(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const upcomingTodos = await prisma.todo.findMany({
      where: {
        completed: false,
        reminderSent: false,
        dueDate: {
          gte: today,
          lt: tomorrow
        }
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
        },
        conveyancer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log(`Found ${upcomingTodos.length} todos with upcoming due dates`);
    
    // In a real app, you would send emails here
    // This is just a simulation
    const reminderResults = await Promise.all(
      upcomingTodos.map(async (todo) => {
        // For demo purposes, we're just logging the reminder
        console.log(`Would send reminder for todo "${todo.title}" to ${todo.conveyancer.email}`);
        
        // In a real app, you'd send an email here
        /*
        await sendEmail({
          to: todo.conveyancer.email,
          subject: `Reminder: "${todo.title}" is due soon`,
          text: `Your todo "${todo.title}" is due on ${new Date(todo.dueDate).toLocaleString()}.`,
          html: `
            <h2>Reminder: A task is due soon</h2>
            <p>Your todo <strong>${todo.title}</strong> is due on ${new Date(todo.dueDate).toLocaleString()}.</p>
            <p>${todo.description || ''}</p>
            ${todo.matter ? `<p>Related to property: ${todo.matter.property?.address || 'Unknown'}</p>` : ''}
            <p><a href="${process.env.NEXTAUTH_URL}/todos">View your todos</a></p>
          `
        });
        */
        
        // Mark the reminder as sent
        return prisma.todo.update({
          where: { id: todo.id },
          data: { reminderSent: true }
        });
      })
    );
    
    return res.status(200).json({ 
      message: `Successfully processed ${reminderResults.length} reminders` 
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return res.status(500).json({ message: "Failed to send reminders" });
  }
};

export default withErrorHandling(handler);