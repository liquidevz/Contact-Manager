# Test script for default contact lists

# Register a test user
$registerResponse = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/auth/signup" -Method Post -ContentType "application/json" -Body (@{
        fullName       = "Test User Default Lists"
        email          = "testdefaultlists@example.com"
        password       = "password123"
        professionType = "salaried"
    } | ConvertTo-Json)

Write-Host "User registered:" -ForegroundColor Green
$registerResponse | ConvertTo-Json -Depth 5

$token = $registerResponse.token

# Create a contact
$createContactResponse = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/contacts" -Method Post -ContentType "application/json" -Headers @{Authorization = "Bearer $token" } -Body (@{
        name   = "John Doe"
        mobile = "+1234567890"
        email  = "john@example.com"
    } | ConvertTo-Json)

Write-Host "`nContact created:" -ForegroundColor Green
$createContactResponse | ConvertTo-Json -Depth 5

$contactId = $createContactResponse.contact._id

# Get contact details to verify default lists
$contactDetails = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/contacts/$contactId" -Method Get -Headers @{Authorization = "Bearer $token" }

Write-Host "`nContact details with default lists:" -ForegroundColor Green
$contactDetails.contact | ConvertTo-Json -Depth 5

# Get all default lists for the contact
$defaultLists = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/contacts/$contactId/lists" -Method Get -Headers @{Authorization = "Bearer $token" }

Write-Host "`nDefault lists:" -ForegroundColor Green
$defaultLists | ConvertTo-Json -Depth 5

# Add a task
$taskResponse = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/contacts/$contactId/tasks" -Method Post -ContentType "application/json" -Headers @{Authorization = "Bearer $token" } -Body (@{
        title       = "Follow up with John"
        description = "Discuss project proposal"
        priority    = "high"
        dueDate     = "2025-12-15T10:00:00Z"
    } | ConvertTo-Json)

Write-Host "`nTask added:" -ForegroundColor Green
$taskResponse | ConvertTo-Json -Depth 5

# Add a meeting
$meetingResponse = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/contacts/$contactId/meetings" -Method Post -ContentType "application/json" -Headers @{Authorization = "Bearer $token" } -Body (@{
        title       = "Project Review Meeting"
        startTime   = "2025-12-10T14:00:00Z"
        endTime     = "2025-12-10T15:00:00Z"
        meetingInfo = @{
            location = "Conference Room A"
            agenda   = "Review Q4 progress"
        }
    } | ConvertTo-Json -Depth 3)

Write-Host "`nMeeting added:" -ForegroundColor Green
$meetingResponse | ConvertTo-Json -Depth 5

# Add a transaction
$transactionResponse = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/contacts/$contactId/transactions" -Method Post -ContentType "application/json" -Headers @{Authorization = "Bearer $token" } -Body (@{
        title           = "Payment for services"
        description     = "Q4 consulting fees"
        transactionInfo = @{
            amount          = 5007
            currency        = "USD"
            transactionType = "payment"
            paymentMethod   = "Bank Transfer"
        }
    } | ConvertTo-Json -Depth 3)

Write-Host "`nTransaction added:" -ForegroundColor Green
$transactionResponse | ConvertTo-Json -Depth 5

Write-Host "`n=== Test completed successfully! ===" -ForegroundColor Cyan
