const mongoose = require('mongoose');

async function checkDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/blue_roof_lounge');
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        
        // Check indexes
        console.log('\n=== INDEXES ===');
        const indexes = await db.collection('expensecategories').indexes();
        console.log(JSON.stringify(indexes, null, 2));
        
        // Check existing documents
        console.log('\n=== EXISTING DOCUMENTS ===');
        const docs = await db.collection('expensecategories').find({}).toArray();
        console.log(JSON.stringify(docs, null, 2));
        
        // Check if there are any documents with null expenseID
        console.log('\n=== DOCUMENTS WITH NULL expenseID ===');
        const nullDocs = await db.collection('expensecategories').find({ expenseID: null }).toArray();
        console.log(JSON.stringify(nullDocs, null, 2));
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkDatabase();