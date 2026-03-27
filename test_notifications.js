require('dotenv').config({ path: './backend/.env' });
const pool = require('./backend/src/config/database');
const Stock = require('./backend/src/models/Stock');
const Notification = require('./backend/src/models/Notification');

async function testNotifications() {
  try {
    console.log('--- STARTING NOTIFICATION TEST ---');
    const item = await Stock.createItem({
      name: 'Test Item',
      quantity: 2,
      price: 100
    });
    console.log(`Created Stock Item ID ${item.id} with quantity ${item.quantity}`);
    
    // Ordered 5
    console.log('Simulating order of 5 items...');
    const updated = await Stock.updateItemQuantity(item.id, -5);
    console.log(`New Stock Quantity: ${updated.quantity}`);
    
    const notifs = await Notification.getActiveNotifications();
    const myNotif = notifs.find(n => n.inventory_item_id === item.id);
    if (myNotif && myNotif.deficit === 3) {
      console.log('✅ Notification correctly generated for deficit 3');
    } else {
      console.log('❌ Failed generating notification:', myNotif);
    }

    // Replenish 10
    console.log('Simulating stock replenishment (setting to 10)...');
    updated.quantity = 10;
    const replenished = await Stock.updateItem(item.id, updated);
    console.log(`New Stock Quantity: ${replenished.quantity}`);
    
    const notifsAfter = await Notification.getActiveNotifications();
    const myNotifAfter = notifsAfter.find(n => n.inventory_item_id === item.id);
    if (!myNotifAfter) {
      console.log('✅ Notification correctly resolved');
    } else {
      console.log('❌ Notification still active:', myNotifAfter);
    }
    
    // Clean up
    await Stock.deleteItem(item.id);
    console.log('Test item cleaned up.');
  } catch(e) {
    console.error('Test error:', e);
  } finally {
    pool.end();
  }
}
testNotifications();
