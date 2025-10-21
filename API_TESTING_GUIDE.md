# 🎯 **BLUE ROOF LOUNGE - COMPLETE API TESTING GUIDE**

## 🚀 **SERVER STATUS: RUNNING ON PORT 5000**
Base URL: `http://127.0.0.1:5000/api`

---

## 📋 **1. AUTHENTICATION ENDPOINTS**

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@bluerooflounge.com",
  "password": "Admin123!",
  "role": "Administrator"
}
```

**Required Fields:**
- `username` (3-30 characters, letters/numbers/underscores only)
- `email` (valid email format)
- `password` (min 6 chars, must contain uppercase, lowercase, and number)
- `role` (optional, defaults to "Cashier")

**Valid Roles:** `Administrator`, `Manager`, `Cashier`

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin",
  "password": "Admin123!"
}
```

**Note:** The `email` field accepts either:
- Username: `"admin"`
- Email address: `"admin@bluerooflounge.com"`

**Response includes JWT token - use in all protected endpoints**

---

## 📋 **2. INVENTORY MANAGEMENT**

### Get All Inventory Items
```http
GET /api/stock
Authorization: Bearer YOUR_JWT_TOKEN

Query Parameters:
- page=1
- limit=10
- category=Food
- sortBy=itemName
- sortOrder=asc
- minStock=5
- search=chicken
```

### Create Inventory Item
```http
POST /api/stock
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

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

**Required Fields:**
- `itemName` (string, unique)
- `itemId` (string, unique) 
- `category` (Beer, Wine, Spirits, Soft Drinks, Snacks, Food, Accessories, Other)
- `brand` (string)
- `unitOfMeasure` (Bottle, Can, Glass, Piece, Pack, Carton, Liter, Kg, Other)
- `costPrice` (positive number)
- `sellingPrice` (positive number)
- `currentStock` (non-negative number)
- `minimumStock` (non-negative number)
- `maximumStock` (non-negative number)
- `reorderLevel` (non-negative number)

### Update Stock
```http
PATCH /api/stock/ITEM_ID/stock
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "quantity": 20,
  "action": "add",
  "reason": "New delivery received"
}
```

### Get Low Stock Alerts
```http
GET /api/stock/alerts/low-stock
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Inventory Statistics
```http
GET /api/stock/stats
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 💰 **3. PAYROLL MANAGEMENT**

### Get All Payroll Records
```http
GET /api/payroll
Authorization: Bearer YOUR_JWT_TOKEN

Query Parameters:
- page=1
- limit=10
- status=pending
- month=12
- year=2024
- employeeId=EMP001
```

### Create Payroll Record
```http
POST /api/payroll
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "employee": "68d6752696dca1462381b925",
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
  "processedBy": "68d5f2d944814a5b930796ae"
}
```

### Mark Payroll as Paid
```http
PATCH /api/payroll/PAYROLL_ID/pay
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "paymentMethod": "Bank Transfer",
  "transactionReference": "TXN123456789",
  "notes": "Salary paid via direct deposit"
}
```

### Get Payroll Statistics
```http
GET /api/payroll/stats
Authorization: Bearer YOUR_JWT_TOKEN

Query Parameters:
- startDate=2024-01-01
- endDate=2024-12-31
```

### Get Employee Payroll History
```http
GET /api/payroll/employee/EMP001/history
Authorization: Bearer YOUR_JWT_TOKEN

Query Parameters:
- limit=12
- year=2024
```

---

## 🏢 **4. SUPPLIER MANAGEMENT**

### Get All Suppliers
```http
GET /api/suppliers
Authorization: Bearer YOUR_JWT_TOKEN

Query Parameters:
- page=1
- limit=10
- status=Active
- search=fresh
- sortBy=supplierName
- sortOrder=asc
```

### Create Supplier
```http
POST /api/suppliers
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

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
    "email": "john.smith@freshfoods.com",
    "address": {
      "street": "123 Business Ave",
      "city": "Business City",
      "state": "BC",
      "zipCode": "12345",
      "country": "USA"
    }
  },
  "businessDetails": {
    "registrationNumber": "REG123456",
    "taxNumber": "TAX789012"
  },
  "paymentTerms": {
    "creditDays": 30,
    "discountPercentage": 5
  }
}
```

### Update Supplier Status
```http
PATCH /api/suppliers/SUPPLIER_ID/status
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "status": "Active",
  "reason": "Contract renewed for 2024"
}
```

### Add Product to Supplier
```http
POST /api/suppliers/SUPPLIER_ID/products
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "productName": "Premium Chicken Breast",
  "productCode": "PCB001",
  "unitPrice": 15.99,
  "minimumOrderQuantity": 50
}
```

### Get Supplier Statistics
```http
GET /api/suppliers/stats
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📊 **5. ENHANCED SALES REPORTING**

### Get Sales Report by Date Range
```http
GET /api/sales/reports/date-range
Authorization: Bearer YOUR_JWT_TOKEN

Query Parameters:
- startDate=2024-01-01
- endDate=2024-12-31
- groupBy=month (options: day, week, month, year)
```

### Get Top Selling Items Report
```http
GET /api/sales/reports/top-items
Authorization: Bearer YOUR_JWT_TOKEN

Query Parameters:
- startDate=2024-01-01
- endDate=2024-12-31
- limit=10
```

### Get Daily Sales Summary
```http
GET /api/sales/reports/daily-summary
Authorization: Bearer YOUR_JWT_TOKEN

Query Parameters:
- date=2024-12-25
```

---

## 🔧 **6. SYSTEM HEALTH & UTILITIES**

### API Health Check
```http
GET /api/health
```

### Get All Staff (existing)
```http
GET /api/staff
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get All Sales (existing)
```http
GET /api/sales
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🧪 **7. POSTMAN TESTING SEQUENCE**

### Step 1: Authentication
1. **Register** a new admin user
2. **Login** to get JWT token
3. Copy the token for use in all subsequent requests

### Step 2: Test Each Management System
1. **Inventory**: Create → List → Update Stock → Check Alerts
2. **Payroll**: Create → List → Mark as Paid → View Stats
3. **Suppliers**: Create → List → Update Status → Add Products
4. **Sales Reports**: Date Range → Top Items → Daily Summary

### Step 3: Integration Testing
- Create inventory items
- Create suppliers and link products
- Create staff and payroll records
- Generate comprehensive reports

---

## 📱 **8. SAMPLE RESPONSE FORMATS**

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* returned data */ },
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "itemName",
      "message": "Item name is required"
    }
  ]
}
```

---

## 🔑 **AUTHENTICATION NOTES**
- All protected endpoints require: `Authorization: Bearer YOUR_JWT_TOKEN`
- Token expires in 24 hours
- Admin role required for most management operations
- Use `/api/auth/refresh` to refresh expired tokens

---

## ✅ **ALL SYSTEMS READY FOR TESTING!**
The server is running and all **Option 4** management systems are fully implemented:
- ✅ **Inventory Management** - Complete with stock tracking & alerts
- ✅ **Payroll System** - Full payment processing & history
- ✅ **Sales Reporting** - Advanced analytics & insights
- ✅ **Supplier Management** - Comprehensive vendor operations
