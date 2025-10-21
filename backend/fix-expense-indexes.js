const mongoose = require('mongoose');

async function fixIndexes() {
    try {
        await mongoose.connect('mongodb://localhost:27017/blue_roof_lounge');
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const collection = db.collection('expensecategories');
        
        // Check current indexes
        console.log('\n=== CURRENT INDEXES ===');
        const indexes = await collection.indexes();
        console.log(JSON.stringify(indexes, null, 2));
        
        // Drop the problematic index if it exists
        try {
            await collection.dropIndex('expenseID_1');
            console.log('✅ Dropped expenseID_1 index');
        } catch (error) {
            console.log('ℹ️  expenseID_1 index does not exist or already dropped');
        }
        
        // Clear any existing documents that might have null values
        const deleteResult = await collection.deleteMany({ 
            $or: [
                { expenseID: null },
                { expenseId: null },
                { expenseID: { $exists: false } },
                { expenseId: { $exists: false } }
            ]
        });
        console.log('🗑️  Deleted documents with null/missing expenseId:', deleteResult.deletedCount);
        
        // Create the correct index
        await collection.createIndex({ expenseId: 1 }, { unique: true });
        console.log('✅ Created new unique index on expenseId');
        
        // Check final indexes
        console.log('\n=== FINAL INDEXES ===');
        const finalIndexes = await collection.indexes();
        console.log(JSON.stringify(finalIndexes, null, 2));
        
        // Check remaining documents
        console.log('\n=== REMAINING DOCUMENTS ===');
        const docs = await collection.find({}).toArray();
        console.log(JSON.stringify(docs, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

fixIndexes();