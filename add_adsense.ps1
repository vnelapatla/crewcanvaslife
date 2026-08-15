$dir = "d:\crewcanvaslife-main\src\main\resources\static"
$snippet = @"
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6911412543302758"
     crossorigin="anonymous"></script>
</head>
"@

Get-ChildItem -Path $dir -Filter *.html | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -notmatch "adsbygoogle\.js") {
        $content = $content -replace "(?i)</head>", $snippet
        Set-Content -Path $_.FullName -Value $content -Encoding UTF8
        Write-Host "Updated $($_.Name)"
    } else {
        Write-Host "Skipped $($_.Name) (Already has AdSense)"
    }
}
