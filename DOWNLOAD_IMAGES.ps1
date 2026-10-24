#!/usr/bin/env powershell
<#
.SYNOPSIS
    Download product images from Unsplash (legitimate free source)
.DESCRIPTION
    Uses Unsplash API to download high-quality product images
    Unsplash is CC0 licensed - free for commercial and non-commercial use
#>

param(
    [switch]$DryRun = $false,
    [int]$LimitPerSport = 5  # Start with 5 images per sport for testing
)

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PublicImagesPath = Join-Path $ProjectRoot "public" "images" "products"

# Unsplash Search Terms - one per product
$ProductSearchTerms = @{
    # Cricket Products
    "cricket" = @(
        @{ id = "cricket-1"; term = "cricket bat willow professional equipment" },
        @{ id = "cricket-2"; term = "cricket bat professional grade wooden" },
        @{ id = "cricket-3"; term = "cricket shirt jersey blue white" },
        @{ id = "cricket-4"; term = "cricket helmet protective gear titanium" },
        @{ id = "cricket-5"; term = "cricket shoes spikes white leather" }
    );
    
    # Football/Soccer Products
    "football" = @(
        @{ id = "football-1"; term = "soccer football boots cleats black" },
        @{ id = "football-2"; term = "soccer ball official match white black" },
        @{ id = "football-3"; term = "football jersey shirt red" },
        @{ id = "football-4"; term = "shin guards soccer protective" },
        @{ id = "football-5"; term = "goalkeeper gloves latex green" }
    );
    
    # Basketball Products
    "basketball" = @(
        @{ id = "basketball-1"; term = "basketball orange leather official" },
        @{ id = "basketball-2"; term = "basketball shoes high top black red" },
        @{ id = "basketball-3"; term = "basketball jersey sleeveless blue" },
        @{ id = "basketball-4"; term = "ankle support compression sleeve black" },
        @{ id = "basketball-5"; term = "basketball shoes low top white" }
    );
    
    # Badminton Products
    "badminton" = @(
        @{ id = "badminton-1"; term = "badminton racquet professional red black" },
        @{ id = "badminton-2"; term = "badminton shuttlecocks feather white" },
        @{ id = "badminton-3"; term = "badminton court shoes white blue" },
        @{ id = "badminton-4"; term = "badminton polo shirt white" },
        @{ id = "badminton-5"; term = "badminton racquet frame blue" }
    );
    
    # Tennis Products
    "tennis" = @(
        @{ id = "tennis-1"; term = "tennis racquet professional black white" },
        @{ id = "tennis-2"; term = "tennis shoes court white professional" },
        @{ id = "tennis-3"; term = "tennis balls yellow pressurized" },
        @{ id = "tennis-4"; term = "tennis racquet blue yellow large" },
        @{ id = "tennis-5"; term = "tennis racquet head black red" }
    );
    
    # Running Products
    "running" = @(
        @{ id = "running-1"; term = "running shoes nike grey volt" },
        @{ id = "running-2"; term = "running shoes adidas black boost" },
        @{ id = "running-3"; term = "running shorts black mesh" },
        @{ id = "running-4"; term = "running cap black reflective" },
        @{ id = "running-5"; term = "running shoes gel cushion grey" }
    );
    
    # Fitness/Gym Products
    "fitness" = @(
        @{ id = "fitness-1"; term = "compression leggings black tight" },
        @{ id = "fitness-2"; term = "cross training shoes gym" },
        @{ id = "fitness-3"; term = "gym gloves weightlifting black" },
        @{ id = "fitness-4"; term = "yoga mat purple non-slip" },
        @{ id = "fitness-5"; term = "sports tank top black racerback" }
    );
    
    # Volleyball Products
    "volleyball" = @(
        @{ id = "volleyball-1"; term = "volleyball ball white yellow official" },
        @{ id = "volleyball-2"; term = "volleyball knee pads black protective" },
        @{ id = "volleyball-3"; term = "volleyball kit bag black blue" },
        @{ id = "volleyball-4"; term = "volleyball net post set white" },
        @{ id = "volleyball-5"; term = "volleyball shoes court white red" }
    );
    
    # Table Tennis Products
    "table-tennis" = @(
        @{ id = "table-tennis-1"; term = "table tennis paddle racquet red black" },
        @{ id = "table-tennis-2"; term = "table tennis balls white 40mm" },
        @{ id = "table-tennis-3"; term = "table tennis paddle professional" },
        @{ id = "table-tennis-4"; term = "table tennis table indoor folding" },
        @{ id = "table-tennis-5"; term = "table tennis shoes white" }
    );
    
    # Boxing Products
    "boxing" = @(
        @{ id = "boxing-1"; term = "boxing gloves black red training" },
        @{ id = "boxing-2"; term = "boxing training t-shirt grey" },
        @{ id = "boxing-3"; term = "boxing headgear protective black" },
        @{ id = "boxing-4"; term = "hand wraps boxing black elastic" },
        @{ id = "boxing-5"; term = "heavy punch bag black 100lb" }
    )
}

$DownloadedCount = 0
$FailedCount = 0
$SkippedCount = 0

Write-Host "========================================"
Write-Host "Mimi Sports - Image Downloader (Unsplash)"
Write-Host "========================================"
Write-Host ""
Write-Host "Source: Unsplash (CC0 Licensed - Free for all uses)"
Write-Host "URL: https://unsplash.com"
Write-Host ""

if ($DryRun) {
    Write-Host "MODE: DRY RUN (no files will be downloaded)"
    Write-Host ""
}

function Download-UnsplashImage {
    param(
        [string]$SearchTerm,
        [string]$FilePath,
        [string]$ProductId
    )
    
    try {
        # Unsplash API endpoint (no auth required for basic searches)
        $searchUrl = "https://api.unsplash.com/search/photos?query=$([Uri]::EscapeDataString($SearchTerm))&per_page=1&order_by=relevant"
        
        Write-Host "  Searching Unsplash for: '$SearchTerm'" -ForegroundColor Cyan
        
        # Make request (note: no API key, public endpoint)
        $response = Invoke-WebRequest -Uri $searchUrl -Method Get -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.results -and $data.results.Count -gt 0) {
            $imageUrl = $data.results[0].urls.regular
            $author = $data.results[0].user.name
            
            Write-Host "    Found: '$($data.results[0].description)' by $author"
            Write-Host "    Downloading..." -ForegroundColor Green
            
            if (-not $DryRun) {
                # Download and save
                Invoke-WebRequest -Uri $imageUrl -OutFile $FilePath -ErrorAction Stop
                Write-Host "    ✓ Saved to: $FilePath" -ForegroundColor Green
            } else {
                Write-Host "    [DRY RUN] Would save to: $FilePath" -ForegroundColor Yellow
            }
            
            return @{ Status = "Success"; Product = $ProductId; Author = $author; Term = $SearchTerm }
        } else {
            Write-Host "    ✗ No results found" -ForegroundColor Yellow
            return @{ Status = "NoResults"; Product = $ProductId; Term = $SearchTerm }
        }
    }
    catch {
        Write-Host "    ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Status = "Error"; Product = $ProductId; Error = $_.Exception.Message }
    }
}

# Download sample images per sport
$Report = @()
$Report += ""
$Report += "DOWNLOAD PROGRESS"
$Report += "================="
$Report += ""

foreach ($sport in $ProductSearchTerms.Keys) {
    Write-Host ""
    Write-Host "Processing: $($sport.ToUpper())"
    Write-Host "-" * 40
    
    $sportDir = Join-Path $PublicImagesPath $sport
    $products = $ProductSearchTerms[$sport] | Select-Object -First $LimitPerSport
    
    foreach ($product in $products) {
        $filePath = Join-Path $sportDir "$($product.id).jpg"
        
        # Check if file already exists
        if ((Test-Path $filePath) -and -not $DryRun) {
            Write-Host "  $($product.id): File exists, skipping" -ForegroundColor Yellow
            $SkippedCount++
        } else {
            $result = Download-UnsplashImage -SearchTerm $product.term -FilePath $filePath -ProductId $product.id
            
            if ($result.Status -eq "Success") {
                $DownloadedCount++
            } else {
                $FailedCount++
            }
            
            $Report += $result
            
            # Respectful rate limiting
            Start-Sleep -Milliseconds 500
        }
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "DOWNLOAD SUMMARY"
Write-Host "========================================"
Write-Host "Downloaded: $DownloadedCount"
Write-Host "Failed: $FailedCount"
Write-Host "Skipped: $SkippedCount"
Write-Host ""
$totalImages = $ProductSearchTerms.Keys.Count * $LimitPerSport
$summaryText = "Testing with first $LimitPerSport images per sport ($totalImages total)"
Write-Host $summaryText
Write-Host ""
Write-Host "NEXT STEPS:"
Write-Host "=========="
Write-Host "1. Verify downloaded images are appropriate"
Write-Host "2. Scale up to full 138 images"
Write-Host "3. For products with no matches, generate using AI"
Write-Host ""

# Save detailed report
$ReportFile = Join-Path $ProjectRoot "DOWNLOAD_REPORT.txt"
$Report | Out-File -FilePath $ReportFile -Encoding UTF8
$reportMsg = "Detailed report saved to: $ReportFile"
Write-Host $reportMsg
