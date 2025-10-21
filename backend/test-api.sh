#!/bin/bash
# Blue Roof Lounge API Test Script
# This script tests all CRUD operations for the API

echo "🚀 Blue Roof Lounge API Testing Suite"
echo "======================================"

BASE_URL="http://localhost:5000/api"

echo ""
echo "📡 Test 1: Health Check"
echo "----------------------"
curl -s -X GET "$BASE_URL/health" | echo

echo ""
echo "🔍 Test 2: Database Connection"
echo "------------------------------"
curl -s -X GET "$BASE_URL/test/connection" | echo

echo ""
echo "📊 Test 3: Database Statistics"
echo "------------------------------"
curl -s -X GET "$BASE_URL/test/stats" | echo

echo ""
echo "👤 Test 4: User Registration"
echo "----------------------------"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john.doe@bluerooflounge.com",
    "password": "SecurePass123",
    "role": "manager"
  }' | echo

echo ""
echo "🔐 Test 5: User Login"
echo "--------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@bluerooflounge.com",
    "password": "SecurePass123"
  }')

echo $LOGIN_RESPONSE

# Extract token from response (you might need jq for this)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

echo ""
echo "🏢 Test 6: Create Position"
echo "-------------------------"
POSITION_RESPONSE=$(curl -s -X POST "$BASE_URL/positions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "positionTitle": "Bar Manager",
    "department": "Bar/Service",
    "level": "Management",
    "description": "Manage bar operations and staff",
    "responsibilities": ["Manage bar staff", "Inventory control", "Customer service"],
    "salary": {
      "minimum": 45000,
      "maximum": 65000,
      "payFrequency": "Monthly"
    }
  }')

echo $POSITION_RESPONSE

echo ""
echo "👥 Test 7: Create Staff Member"
echo "------------------------------"
curl -s -X POST "$BASE_URL/staff" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@bluerooflounge.com",
    "phoneNumber": "+254712345678",
    "nationalId": "12345678",
    "department": "Bar/Service",
    "dateOfBirth": "1990-05-15",
    "salary": 55000
  }' | echo

echo ""
echo "📦 Test 8: Create Inventory Item"
echo "--------------------------------"
curl -s -X POST "$BASE_URL/inventory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "itemName": "Heineken Beer",
    "itemId": "BEER001",
    "category": "Beer",
    "brand": "Heineken",
    "unitOfMeasure": "Bottle",
    "costPrice": 120,
    "sellingPrice": 200,
    "currentStock": 100,
    "minimumStock": 20,
    "maximumStock": 500,
    "reorderLevel": 50
  }' | echo

echo ""
echo "💰 Test 9: Create Sale Transaction"
echo "----------------------------------"
curl -s -X POST "$BASE_URL/sales" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "itemName": "Heineken Beer",
    "itemId": "BEER001",
    "sellingPrice": 200,
    "quantitySold": 5,
    "paymentMode": "Cash",
    "customer": "John Customer"
  }' | echo

echo ""
echo "📊 Test 10: Get Sales Statistics"
echo "--------------------------------"
curl -s -X GET "$BASE_URL/sales/stats" \
  -H "Authorization: Bearer $TOKEN" | echo

echo ""
echo "✅ API Testing Complete!"
echo "========================"
