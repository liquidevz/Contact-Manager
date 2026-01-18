# Test script for user search feature

$timestamp = Get-Date -Format "yyyyMMddHHmmss"

# 1. Register User A (The Seeker)
$emailA = "seeker_$timestamp@example.com"
Write-Host "Registering Seeker with email: $emailA" -ForegroundColor Cyan

$userAResponse = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/auth/signup" -Method Post -ContentType "application/json" -Body (@{
    fullName = "Seeker User"
    email = $emailA
    password = "password123"
    professionType = "business"
} | ConvertTo-Json)

$tokenA = $userAResponse.token
if (-not $tokenA) {
    Write-Host "Failed to register User A" -ForegroundColor Red
    exit
}
Write-Host "User A (Seeker) registered" -ForegroundColor Green

# Update User A profile with NEEDS
$updateAResponse = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/profile" -Method Put -ContentType "application/json" -Headers @{Authorization="Bearer $tokenA"} -Body (@{
    whatYouWant = @("web development", "marketing")
    searchingFor = @("investor")
} | ConvertTo-Json)
Write-Host "User A profile updated with needs" -ForegroundColor Green

# 2. Register User B (The Provider - Matches User A's Need)
$emailB = "provider_$timestamp@example.com"
Write-Host "Registering Provider with email: $emailB" -ForegroundColor Cyan

$userBResponse = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/auth/signup" -Method Post -ContentType "application/json" -Body (@{
    fullName = "Provider User"
    email = $emailB
    password = "password123"
    professionType = "freelancer"
} | ConvertTo-Json)

$tokenB = $userBResponse.token
if (-not $tokenB) {
    Write-Host "Failed to register User B" -ForegroundColor Red
    exit
}
Write-Host "User B (Provider) registered" -ForegroundColor Green

# Update User B profile with OFFERS
$updateBResponse = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/profile" -Method Put -ContentType "application/json" -Headers @{Authorization="Bearer $tokenB"} -Body (@{
    whatYouCanOffer = @("web development", "seo")
    customTags = @("react")
} | ConvertTo-Json)
Write-Host "User B profile updated with offers" -ForegroundColor Green

# Get User B's Share Code
$profileB = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/profile" -Method Get -Headers @{Authorization="Bearer $tokenB"}
$codeB = $profileB.user.shareCode

if ($codeB) {
    Write-Host "User B Share Code: $codeB" -ForegroundColor Green
} else {
    # Try to generate it by calling share endpoint (dummy share)
    # Or just wait/retry if it's async (it's not async in our code)
    # The generateShareCode is called on shareWith, let's try to trigger it if needed
    # But wait, the model has generateShareCode but it's not called on signup automatically?
    # Ah, UserSchema.methods.generateShareCode exists but isn't called on creation.
    # It's called in shareWith.
    # Let's manually trigger a share to generate code for testing
    # Or we can rely on smart search first.
    Write-Host "User B has no share code yet (expected if not generated)." -ForegroundColor Yellow
}

# 3. Test Smart Search (User A searches)
Write-Host "`n--- Testing Smart Search (A searching for matches) ---" -ForegroundColor Cyan
try {
    $searchResponse = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/search/smart" -Method Get -Headers @{Authorization="Bearer $tokenA"}
    
    Write-Host "Found $($searchResponse.matches.Count) matches" -ForegroundColor Green
    $searchResponse.matches | ForEach-Object {
        Write-Host "Match: $($_.user.fullName) - Score: $($_.score)"
        Write-Host "  Matched Tags: $($_.matchedTags | ConvertTo-Json -Depth 2)"
        Write-Host "  Business Card: $($_.user.businessCard | ConvertTo-Json -Depth 2)"
    }
} catch {
    Write-Host "Smart search failed: $_" -ForegroundColor Red
}

# 4. Test Share Code Search (if we have a code)
if ($codeB) {
    Write-Host "`n--- Testing Share Code Search ---" -ForegroundColor Cyan
    try {
        $codeSearchResponse = Invoke-RestMethod -Uri "http://localhost:5007/api/v1/search/code?code=$codeB" -Method Get -Headers @{Authorization="Bearer $tokenA"}
        Write-Host "Found User: $($codeSearchResponse.user.fullName)" -ForegroundColor Green
        Write-Host "Public Data: $($codeSearchResponse.user | ConvertTo-Json -Depth 2)"
    } catch {
        Write-Host "Code search failed: $_" -ForegroundColor Red
    }
}
