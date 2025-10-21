# Blue Roof Lounge API Test Script (PowerShell)
# This script tests all CRUD operations for the API

Write-Host "🚀 Blue Roof Lounge API Testing Suite" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Yellow

$baseUrl = "http://localhost:5000/api"

function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        $params = @{
            Method = $Method
            Uri = $Uri
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        return $response | ConvertTo-Json -Depth 10
    }
    catch {
        return "Error: $($_.Exception.Message)"
    }
}

Write-Host "`n📡 Test 1: Health Check" -ForegroundColor Cyan
Write-Host "----------------------" -ForegroundColor Gray
$healthResponse = Invoke-ApiCall -Method "GET" -Uri "$baseUrl/health"
Write-Host $healthResponse

Write-Host "`n🔍 Test 2: Database Connection" -ForegroundColor Cyan
Write-Host "------------------------------" -ForegroundColor Gray
$connectionResponse = Invoke-ApiCall -Method "GET" -Uri "$baseUrl/test/connection"
Write-Host $connectionResponse

Write-Host "`n📊 Test 3: Database Statistics" -ForegroundColor Cyan
Write-Host "------------------------------" -ForegroundColor Gray
$statsResponse = Invoke-ApiCall -Method "GET" -Uri "$baseUrl/test/stats"
Write-Host $statsResponse

Write-Host "`n💾 Test 4: Create Sample Data" -ForegroundColor Cyan
Write-Host "-----------------------------" -ForegroundColor Gray
$sampleDataResponse = Invoke-ApiCall -Method "POST" -Uri "$baseUrl/test/sample-data"
Write-Host $sampleDataResponse

Write-Host "`n👤 Test 5: User Registration" -ForegroundColor Cyan
Write-Host "----------------------------" -ForegroundColor Gray
$registrationBody = @{
    username = "testmanager"
    email = "manager@bluerooflounge.com"
    password = "Manager123"
    role = "manager"
} | ConvertTo-Json

$registrationResponse = Invoke-ApiCall -Method "POST" -Uri "$baseUrl/auth/register" -Body $registrationBody
Write-Host $registrationResponse

Write-Host "`n🔐 Test 6: User Login" -ForegroundColor Cyan
Write-Host "--------------------" -ForegroundColor Gray
$loginBody = @{
    email = "manager@bluerooflounge.com"
    password = "Manager123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Method "POST" -Uri "$baseUrl/auth/login" -Body $loginBody -ContentType "application/json"
    Write-Host ($loginResponse | ConvertTo-Json -Depth 10)
    
    # Extract token for authenticated requests
    $token = $loginResponse.data.token
    $authHeaders = @{
        "Authorization" = "Bearer $token"
    }
    
    Write-Host "`n👥 Test 7: Get All Staff" -ForegroundColor Cyan
    Write-Host "-----------------------" -ForegroundColor Gray
    $staffResponse = Invoke-ApiCall -Method "GET" -Uri "$baseUrl/staff" -Headers $authHeaders
    Write-Host $staffResponse
    
    Write-Host "`n💰 Test 8: Get Sales Statistics" -ForegroundColor Cyan
    Write-Host "-------------------------------" -ForegroundColor Gray
    $salesStatsResponse = Invoke-ApiCall -Method "GET" -Uri "$baseUrl/sales/stats" -Headers $authHeaders
    Write-Host $salesStatsResponse
    
    Write-Host "`n📋 Test 9: Get User Profile" -ForegroundColor Cyan
    Write-Host "---------------------------" -ForegroundColor Gray
    $profileResponse = Invoke-ApiCall -Method "GET" -Uri "$baseUrl/auth/profile" -Headers $authHeaders
    Write-Host $profileResponse
    
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🧹 Test 10: Cleanup Test Data" -ForegroundColor Cyan
Write-Host "-----------------------------" -ForegroundColor Gray
$cleanupResponse = Invoke-ApiCall -Method "DELETE" -Uri "$baseUrl/test/cleanup"
Write-Host $cleanupResponse

Write-Host "`n✅ API Testing Complete!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Yellow
Write-Host "`n💡 Next Steps:" -ForegroundColor Blue
Write-Host "   • Test individual endpoints using Postman or Insomnia" -ForegroundColor Gray
Write-Host "   • Create real data through the frontend application" -ForegroundColor Gray
Write-Host "   • Monitor database using MongoDB Compass" -ForegroundColor Gray
Write-Host "   • Check server logs for any errors" -ForegroundColor Gray
