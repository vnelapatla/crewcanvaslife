$path = "d:\crewcanvaslife-main\src\main\resources\static\crew-search.html"
$bytes = [System.IO.File]::ReadAllBytes($path)
# The file is UTF-8. Let's read it as UTF-8 to get the string.
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Strip BOM if present
if ($text.Length -gt 0 -and $text[0] -eq [char]0xFEFF) {
    $text = $text.Substring(1)
}

# Convert the string back to bytes using Windows-1252 encoding
$encoding1252 = [System.Text.Encoding]::GetEncoding(1252)
$originalBytes = $encoding1252.GetBytes($text)

# Decode those bytes as UTF-8 to get the original string with emojis
$fixedText = [System.Text.Encoding]::UTF8.GetString($originalBytes)

[System.IO.File]::WriteAllText("d:\crewcanvaslife-main\src\main\resources\static\crew-search_fixed.html", $fixedText, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Done"
