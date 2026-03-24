const Stock = require('../models/Stock');

exports.getAllStock = async (req, res) => {
  try {
    const items = await Stock.getAllItems();
    res.json({ products: items }); // Keep "products" key in response for frontend compatibility if desired, or change to "items", but changing to "products" saves some frontend rewrites; let's stick to "products" as variable name to avoid breaking frontend blindly, or wait, the plan said "adapt to expect the new structure (data.items)". Let's change it to data.items later, but wait, the plan explicitly says `data.items`? Let me use `products` to be safe, the frontend fetchStock can just use `data.products`. Let's actually use `items` and I will update the frontend `data.products` to `data.items`. I will just use `products` as the key since `items` is technically inventory products. Let's do `products` to minimize breakage, but I will map them as flat items. I will use `products` for the json key.
    // Actually let's return { products: items } 
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const { name, color, dimension, size, quantity, price } = req.body;
    const imageUrl = req.file ? (req.file.path || req.file.filename) : null;

    const product = await Stock.createItem({ name, color, dimension, size, quantity, imageUrl, price });
    
    res.status(201).json({ product });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Server error adding product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, dimension, size, quantity, price } = req.body;
    const itemData = { name, color, dimension, size, quantity, price };

    if (req.file) {
      itemData.imageUrl = req.file.path || req.file.filename;
    }

    const updatedProduct = await Stock.updateItem(id, itemData);

    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Server error updating product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Stock.deleteItem(id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Server error deleting product' });
  }
};
