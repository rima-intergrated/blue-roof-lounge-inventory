# PowerShell script to create a test user
# Run this in PowerShell to create a new user

# Create a test Cashier user
$createUserBody = @{
    username = "testcashier"
    email = "testcashier@blueroof.com"
    password = "Password123"
    role = "Cashier"
} | ConvertTo-Json

Write-Host "Creating test cashier user..."
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $createUserBody
    Write-Host "✅ User created successfully!"
    Write-Host "Email: testcashier@blueroof.com"
    Write-Host "Password: Password123"
    Write-Host "Token: $($response.data.token.Substring(0,20))..."
} catch {
    Write-Host "❌ Error creating user: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}

# Create a test Manager user  
$createManagerBody = @{
    username = "testmanager"
    email = "testmanager@blueroof.com"
    password = "Manager123"
    role = "Manager"
} | ConvertTo-Json

Write-Host "`nCreating test manager user..."
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $createManagerBody
    Write-Host "✅ Manager created successfully!"
    Write-Host "Email: testmanager@blueroof.com"
    Write-Host "Password: Manager123"
    Write-Host "Token: $($response.data.token.Substring(0,20))..."
} catch {
    Write-Host "❌ Error creating manager: $($_.Exception.Message)"
}