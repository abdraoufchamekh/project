const Notification = require('../models/Notification');

exports.getActiveNotifications = async (req, res) => {
  try {
    const notifications = await Notification.getActiveNotifications();
    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error while fetching notifications' });
  }
};
