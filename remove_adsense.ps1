$dir = "d:\crewcanvaslife-main\src\main\resources\static"
$allowedPages = @("about.html", "privacy.html", "terms.html", "event.html")

$regex = '(?s)\s*<!-- Google AdSense -->\s*<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js\?client=ca-pub-6911412543302758"\s*crossorigin="anonymous"></script>'

Get-ChildItem -Path $dir -Filter *.html | ForEach-Object {
    $filename = $_.Name
    $content = Get-Content $_.FullName -Raw
    
    if ($allowedPages -contains $filename) {
        Write-Host "Keeping AdSense in $filename"
    } else {
        if ($content -match $regex) {
            $content = $content -replace $regex, ""
            Set-Content -Path $_.FullName -Value $content -Encoding UTF8
            Write-Host "Removed AdSense from $filename"
        } else {
            Write-Host "No AdSense found or pattern didn't match in $filename"
        }
    }
}
