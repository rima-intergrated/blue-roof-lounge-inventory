# 🧪 **POSTMAN TESTING GUIDE - Blue Roof Restaurant Management**

## **📋 PRE-REQUISITES**
1. **Server Running**: Ensure Node.js server is running on `http://localhost:5000`
2. **Postman Installed**: Download from https://www.postman.com/downloads/
3. **JWT Token**: Get authentication token from login endpoint

---

## **🔐 STEP 1: AUTHENTICATION SETUP**

### **1.1 Register Admin User (First Time Only)**
```
Method: POST
URL: http://localhost:5000/api/auth/register
Headers: Content-Type: application/json
Body (JSON):
{
  "name": "Admin User",
  "email": "admin@blueroof.com", 
  "password": "admin123",
  "role": "admin"
}
```

### **1.2 Login to Get JWT Token**
```
Method: POST
URL: http://localhost:5000/api/auth/login
Headers: Content-Type: application/json
Body (JSON):
{
  "email": "admin@blueroof.com",
  "password": "admin123"
}
```

**📝 IMPORTANT**: Copy the `token` from the response - you'll need it for all protected endpoints!

---

## **✅ STEP 2: TEST INVENTORY SYSTEM (WORKING)**

### **2.1 Create Inventory Item**
```
Method: POST
URL: http://localhost:5000/api/stock
Headers: 
  - Authorization: Bearer YOUR_JWT_TOKEN
  - Content-Type: application/json
Body (JSON):
{
  "itemName": "Grilled Chicken Breast",
  "itemId": "FC001", 
  "category": "Food",
  "brand": "Fresh Foods",
  "description": "Premium grilled chicken breast",
  "unitOfMeasure": "Piece",
  "costPrice": 18.50,
  "sellingPrice": 25.99,
  "currentStock": 50,
  "minimumStock": 10,
  "maximumStock": 100,
  "reorderLevel": 15,
  "location": "Main Kitchen Freezer",
  "expiryDate": "2024-12-31",
  "taxRate": 10
}
```

### **2.2 Get All Inventory Items**
```
Method: GET
URL: http://localhost:5000/api/stock
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

### **2.3 Update Stock Level**
```
Method: PATCH
URL: http://localhost:5000/api/stock/ITEM_ID/stock
Headers: 
  - Authorization: Bearer YOUR_JWT_TOKEN
  - Content-Type: application/json
Body (JSON):
{
  "quantity": 20,
  "action": "add",
  "reason": "New delivery received"
}
```

### **2.4 Get Low Stock Alerts**
```
Method: GET
URL: http://localhost:5000/api/stock/alerts/low-stock
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

### **2.5 Get Inventory Statistics**
```
Method: GET
URL: http://localhost:5000/api/stock/stats
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

---

## **💰 STEP 3: TEST PAYROLL SYSTEM (FIXED)**

### **3.1 Create Staff Member (Required for Payroll)**
```
Method: POST
URL: http://localhost:5000/api/staff
Headers: 
  - Authorization: Bearer YOUR_JWT_TOKEN
  - Content-Type: application/json
Body (JSON):
{
  "name": "John Smith",
  "gender": "Male",
  "contact": "+1234567890",
  "email": "john.smith@blueroof.com",
  "position": "Chef",
  "address": "123 Main Street",
  "salary": 3000
}
```
**📝 NOTE**: Copy the `_id` from the response for payroll creation

### **3.2 Create Payroll Record**
```
Method: POST
URL: http://localhost:5000/api/payroll
Headers: 
  - Authorization: Bearer YOUR_JWT_TOKEN
  - Content-Type: application/json
Body (JSON):
{
  "employee": "STAFF_ID_FROM_STEP_3.1",
  "payPeriod": {
    "startDate": "2024-12-01",
    "endDate": "2024-12-31"
  },
  "basicSalary": 3000,
  "workingDays": {
    "expected": 22,
    "actual": 20
  },
  "allowances": {
    "transport": 200,
    "housing": 300,
    "meal": 150,
    "overtime": 250,
    "bonus": 500
  },
  "deductions": {
    "tax": 300,
    "nhif": 150,
    "nssf": 200,
    "loan": 100
  },
  "paymentMethod": "Bank Transfer",
  "paymentStatus": "Pending",
  "processedBy": "YOUR_USER_ID_FROM_LOGIN"
}
```

### **3.3 Get All Payroll Records**
```
Method: GET
URL: http://localhost:5000/api/payroll
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

### **3.4 Mark Payroll as Paid**
```
Method: PATCH
URL: http://localhost:5000/api/payroll/PAYROLL_ID/pay
Headers: 
  - Authorization: Bearer YOUR_JWT_TOKEN
  - Content-Type: application/json
Body (JSON):
{
  "paymentMethod": "Bank Transfer",
  "transactionReference": "TXN123456789",
  "notes": "Salary paid via direct deposit"
}
```

### **3.5 Get Payroll Statistics**
```
Method: GET
URL: http://localhost:5000/api/payroll/stats
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

---

## **🏢 STEP 4: TEST SUPPLIER SYSTEM (FIXED)**

### **4.1 Create Supplier**
```
Method: POST
URL: http://localhost:5000/api/suppliers
Headers: 
  - Authorization: Bearer YOUR_JWT_TOKEN
  - Content-Type: application/json
Body (JSON):
{
  "supplierName": "Fresh Foods Limited",
  "supplierId": "SUP001",
  "contactPerson": {
    "firstName": "John",
    "lastName": "Smith",
    "position": "Sales Manager"
  },
  "contactInformation": {
    "phoneNumber": "+1-555-0123",
    "email": "john.smith@freshfoods.com"
  },
  "address": {
    "street": "123 Business Ave",
    "city": "Business City",
    "state": "BC",
    "postalCode": "12345",
    "country": "USA"
  },
  "businessDetails": {
    "registrationNumber": "REG123456",
    "taxNumber": "TAX789012"
  },
  "paymentTerms": {
    "creditDays": 30,
    "discountPercentage": 5
  },
  "addedBy": "YOUR_USER_ID_FROM_LOGIN"
}
```

### **4.2 Get All Suppliers**
```
Method: GET
URL: http://localhost:5000/api/suppliers
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

### **4.3 Update Supplier Status**
```
Method: PATCH
URL: http://localhost:5000/api/suppliers/SUPPLIER_ID/status
Headers: 
  - Authorization: Bearer YOUR_JWT_TOKEN
  - Content-Type: application/json
Body (JSON):
{
  "status": "Active",
  "reason": "Contract renewed for 2024"
}
```

### **4.4 Add Product to Supplier**
```
Method: POST
URL: http://localhost:5000/api/suppliers/SUPPLIER_ID/products
Headers: 
  - Authorization: Bearer YOUR_JWT_TOKEN
  - Content-Type: application/json
Body (JSON):
{
  "productName": "Premium Chicken Breast",
  "productCode": "PCB001",
  "unitPrice": 15.99,
  "minimumOrderQuantity": 50
}
```

### **4.5 Get Supplier Statistics**
```
Method: GET
URL: http://localhost:5000/api/suppliers/stats
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

---

## **📊 STEP 5: TEST SALES SYSTEM**

### **5.1 Create Sales Transaction**
```
Method: POST
URL: http://localhost:5000/api/sales
Headers: 
  - Authorization: Bearer YOUR_JWT_TOKEN
  - Content-Type: application/json
Body (JSON):
{
  "transactionId": "TXN001",
  "items": [
    {
      "inventoryId": "INVENTORY_ITEM_ID_FROM_STEP_2.1",
      "quantity": 2,
      "unitPrice": 25.99,
      "totalPrice": 51.98
    }
  ],
  "customer": {
    "name": "Customer Name",
    "contact": "+1234567890"
  },
  "paymentMethod": "Cash",
  "totalAmount": 51.98,
  "taxAmount": 5.20,
  "discountAmount": 0,
  "finalAmount": 57.18,
  "paidBy": "cashier@blueroof.com"
}
```

### **5.2 Get All Sales**
```
Method: GET
URL: http://localhost:5000/api/sales
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

---

## **🔧 STEP 6: HEALTH & UTILITY ENDPOINTS**

### **6.1 API Health Check**
```
Method: GET
URL: http://localhost:5000/api/health
```

### **6.2 Get Current User Info**
```
Method: GET
URL: http://localhost:5000/api/auth/me
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

---

## **📱 POSTMAN COLLECTION SETUP**

### **Environment Variables**
Create a Postman environment with these variables:
- `baseUrl`: `http://localhost:5000`
- `token`: `YOUR_JWT_TOKEN_HERE`
- `userId`: `YOUR_USER_ID_HERE`
- `staffId`: `CREATED_STAFF_ID_HERE`
- `supplierId`: `CREATED_SUPPLIER_ID_HERE`
- `inventoryId`: `CREATED_INVENTORY_ID_HERE`

### **Pre-request Script (for all protected endpoints)**
```javascript
pm.environment.set("token", pm.environment.get("token"));
```

### **Tests Script (for login endpoint)**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.data.token);
    pm.environment.set("userId", response.data.user.id);
}
```

---

## **✅ EXPECTED RESULTS**

### **Success Response Format**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { 
    // Response data here
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10
  }
}
```

### **Error Response Format**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

---

## **🚀 TESTING SEQUENCE RECOMMENDATION**

1. **Authentication** (Steps 1.1 → 1.2)
2. **Inventory Management** (Steps 2.1 → 2.5)
3. **Staff & Payroll** (Steps 3.1 → 3.5)
4. **Supplier Management** (Steps 4.1 → 4.5)
5. **Sales Transactions** (Steps 5.1 → 5.2)
6. **System Health** (Step 6)

---

## **📝 NOTES**
- Replace `YOUR_JWT_TOKEN` with the actual token from login
- Replace `ITEM_ID`, `STAFF_ID`, etc. with actual IDs from created records
- All timestamps are in ISO 8601 format
- Ensure MongoDB is running on localhost:27017
- Server should be running on port 5000

---

## **🔍 TROUBLESHOOTING**
- **401 Unauthorized**: Check if JWT token is valid and not expired
- **400 Bad Request**: Verify request body format and required fields
- **500 Internal Server Error**: Check server logs and database connection
- **404 Not Found**: Verify endpoint URLs and resource IDs

**🎉 Happy Testing!**
