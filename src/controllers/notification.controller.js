const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all notifications for a user
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma.notification.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Error getting notifications' });
    }
};

// Get unread notifications
const getUnreadNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma.notification.findMany({
            where: {
                userId: userId,
                isRead: false
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Error getting unread notifications' });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notification.findFirst({
            where: {
                id: id,
                userId: userId
            }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        const updatedNotification = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.json(updatedNotification);
    } catch (error) {
        res.status(500).json({ error: 'Error marking notification as read' });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.notification.updateMany({
            where: {
                userId: userId,
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ message: 'All notifications have been marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Error marking notifications as read' });
    }
};

// Delete a notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notification.findFirst({
            where: {
                id: id,
                userId: userId
            }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await prisma.notification.delete({
            where: { id }
        });

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting notification' });
    }
};

// Helper function to create notifications (used by other controllers)
const createNotification = async (userId, type, message) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                type,
                message,
                userId
            }
        });
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

module.exports = {
    getUserNotifications,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
}; 