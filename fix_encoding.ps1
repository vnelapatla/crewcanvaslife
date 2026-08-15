$files = @(
    "about.html", "admin-insights.html", "casting-deck.html", "crew-search.html",
    "edit-profile.html", "event-dashboard.html", "event.html", "feed.html",
    "forgot-password.html", "form-builder.html", "home.html", "index.html",
    "landing.html", "launch-audition.html", "messages.html", "movie-quiz.html",
    "notifications.html", "pass.html", "privacy.html", "profile.html",
    "reset-password.html", "scan.html", "settings.html", "shared-audition.html",
    "terms.html"
)

$baseDir = "d:\crewcanvaslife-main\src\main\resources\static\"

foreach ($file in $files) {
    $path = Join-Path $baseDir $file
    if (Test-Path $path) {
        $bytes = [System.IO.File]::ReadAllBytes($path)
        $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        
        # Strip BOM if present
        if ($text.Length -gt 0 -and $text[0] -eq [char]0xFEFF) {
            $text = $text.Substring(1)
        }
        
        $encoding1252 = [System.Text.Encoding]::GetEncoding(1252)
        
        try {
            $originalBytes = $encoding1252.GetBytes($text)
            $fixedText = [System.Text.Encoding]::UTF8.GetString($originalBytes)
            
            [System.IO.File]::WriteAllText($path, $fixedText, (New-Object System.Text.UTF8Encoding($false)))
            Write-Host "Fixed ${file}"
        } catch {
            Write-Host "Error fixing ${file}"
        }
    }
}
