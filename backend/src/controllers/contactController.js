const contactModel = require('../models/contactModel');

const contactController = {
    
    // SUBMIT CONTACT MESSAGE (Public)
    submitMessage: async (req, res, next) => {
        try {
            const { name, email, phone, subject, message } = req.body;
            
            // Validation
            if (!name || name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Name is required.'
                });
            }
            
            if (!email || email.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required.'
                });
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address.'
                });
            }
            
            if (!subject || subject.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Subject is required.'
                });
            }
            
            if (!message || message.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required.'
                });
            }
            
            // Get user ID if authenticated (optional)
            const userId = req.user ? req.user.id : null;
            
            await contactModel.create({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                phone: phone || null,
                subject: subject.trim(),
                message: message.trim()
            }, userId);
            
            res.status(201).json({
                success: true,
                message: 'Your message has been sent. We will get back to you soon!'
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    //  GET ALL MESSAGES (Admin)
     
    getMessages: async (req, res, next) => {
        try {
            const filters = {
                status: req.query.status || null
            };
            
            const messages = await contactModel.findAll(filters);
            const counts = await contactModel.getCountsByStatus();
            
            res.status(200).json({
                success: true,
                count: messages.length,
                status_counts: counts,
                data: messages
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    //   GET SINGLE MESSAGE (Admin)
     
    getMessage: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid message ID.'
                });
            }
            
            const message = await contactModel.findById(id);
            
            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found.'
                });
            }
            
            // Auto-mark as READ when viewed
            if (message.status === 'NEW') {
                await contactModel.updateStatus(id, 'READ');
                message.status = 'READ';
            }
            
            res.status(200).json({
                success: true,
                data: message
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    //  UPDATE MESSAGE STATUS (Admin)
    
    updateStatus: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const { status } = req.body;
            
            const validStatuses = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                });
            }
            
            const message = await contactModel.findById(id);
            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found.'
                });
            }
            
            await contactModel.updateStatus(id, status);
            
            res.status(200).json({
                success: true,
                message: `Message marked as ${status}.`
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    //  DELETE MESSAGE (Admin)
     
    deleteMessage: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            
            const message = await contactModel.findById(id);
            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found.'
                });
            }
            
            await contactModel.delete(id);
            
            res.status(200).json({
                success: true,
                message: 'Message deleted successfully.'
            });
            
        } catch (error) {
            next(error);
        }
    }
};

module.exports = contactController;