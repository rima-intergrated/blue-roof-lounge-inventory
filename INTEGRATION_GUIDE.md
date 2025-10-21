# Frontend-Backend Integration Guide

## Overview
This document describes how the Blue Roof Restaurant Management System frontend integrates with the backend API.

## Setup Instructions

### 1. Install Dependencies
```bash
# Install all dependencies for both frontend and backend
npm run install:all

# Or manually:
npm install                    # Frontend dependencies
cd backend && npm install      # Backend dependencies
```

### 2. Environment Configuration
Create a `.env` file in the root directory (already created):
```env
VITE_API_URL=http://127.0.0.1:5000/api
VITE_APP_NAME=Blue Roof Restaurant Management
VITE_NODE_ENV=development
```

### 3. Start Development Servers

#### Option A: Automatic (Recommended)
```bash
npm run start:dev
```
This will start both frontend and backend servers automatically.

#### Option B: Manual
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://127.0.0.1:5000/api
- **API Health Check**: http://127.0.0.1:5000/api/health

## Integration Features

### 1. Authentication System
- **Login**: JWT-based authentication
- **Protected Routes**: Automatic redirection to login if not authenticated
- **Token Management**: Automatic token storage and retrieval
- **Auto-logout**: Redirect to login on token expiration

### 2. API Service Layer
Location: `src/services/api.js`

Available APIs:
- **Auth API**: Login, register, logout, profile management
- **Staff API**: CRUD operations for staff management
- **Sales API**: Transaction management and reporting
- **Inventory API**: Stock management
- **Payroll API**: Salary and payment management
- **Supplier API**: Supplier management

### 3. Error Handling
- **Global Error Handling**: Consistent error display across components
- **Loading States**: Visual feedback during API calls
- **Connection Status**: Real-time API connectivity monitoring

### 4. State Management
- **Authentication Context**: Global user state management
- **Custom Hooks**: Reusable API integration hooks (e.g., `useStaff`)
- **Local State**: Component-level state for forms and UI

## API Integration Examples

### Authentication
```jsx
import { useAuth } from './context/AuthContext';

const { login, logout, user, loading, error } = useAuth();

// Login
const result = await login(email, password);
if (result.success) {
  // Handle success
}
```

### Staff Management
```jsx
import { useStaff } from './hooks/useStaff';

const { staff, createStaff, loading, error } = useStaff();

// Create new staff
const result = await createStaff(staffData);
```

### API Calls
```jsx
import { staffAPI } from './services/api';

// Direct API call
const response = await staffAPI.getAll();
```

## Component Integration Status

### ✅ Integrated Components
- **App.jsx**: Authentication context and routing
- **LogIn.jsx**: API-based authentication
- **RegisterNewStaff.jsx**: Staff management with API
- **BlueRoofHeader.jsx**: User info and logout

### 🔄 Pending Integration
- **PosTransaction.jsx**: Sales API integration
- **AdvancePayment.jsx**: Payroll API integration
- **MyProfile.jsx**: Profile management API
- **NewOrder.jsx**: Inventory API integration
- **ReportsAnalytics.jsx**: Reporting API integration

## Error Handling

### Network Errors
- Automatic retry mechanism
- Connection status indicator
- Graceful degradation

### Validation Errors
- Form validation feedback
- Server-side validation display
- User-friendly error messages

### Authentication Errors
- Automatic logout on token expiration
- Login redirect for unauthorized access
- Clear error messaging

## Development Workflow

### 1. Backend First
- Ensure backend API is running
- Test endpoints with Postman collections
- Verify database connectivity

### 2. Frontend Integration
- Update API service methods
- Create custom hooks for data management
- Integrate components with API calls
- Add error handling and loading states

### 3. Testing
- Test authentication flow
- Verify CRUD operations
- Check error scenarios
- Test offline/online connectivity

## Troubleshooting

### Common Issues

#### 1. CORS Errors
```javascript
// Backend server.js already configured with:
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

#### 2. API Connection Failed
- Check if backend server is running on port 5000
- Verify VITE_API_URL in .env file
- Check network connectivity

#### 3. Authentication Issues
- Clear localStorage and try again
- Check JWT token expiration
- Verify backend auth middleware

#### 4. Database Connection
```bash
# Check MongoDB connection in backend
cd backend
node test-db.js
```

### Development Tips

1. **Use Browser DevTools**: Monitor network requests and responses
2. **Check Console**: Look for JavaScript errors and API responses
3. **Connection Status**: Use the connection indicator in the top-right corner
4. **API Health**: Visit `/api/health` endpoint to verify backend status

## Next Steps

### Phase 1: Complete Basic Integration
- [ ] Sales API integration
- [ ] Inventory API integration  
- [ ] Payroll API integration
- [ ] Reports API integration

### Phase 2: Advanced Features
- [ ] Real-time updates with WebSocket
- [ ] Offline functionality
- [ ] Data caching and synchronization
- [ ] Advanced error recovery

### Phase 3: Production Preparation
- [ ] Environment configuration for production
- [ ] Error monitoring and logging
- [ ] Performance optimization
- [ ] Security hardening

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Staff Management
- `GET /api/staff` - Get all staff
- `POST /api/staff` - Create staff member
- `PUT /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Delete staff member

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create new sale
- `GET /api/sales/summary/daily` - Daily sales summary

### Inventory
- `GET /api/stock` - Get inventory items
- `POST /api/stock` - Add inventory item
- `PUT /api/stock/:id/stock` - Update stock levels

### Payroll
- `GET /api/payroll` - Get payroll records
- `POST /api/payroll/process` - Process payroll

For complete API documentation, see the Postman collection in the project root.