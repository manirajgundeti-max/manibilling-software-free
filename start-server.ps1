<#
.SYNOPSIS
    Mani Mobile Services - Zero-Dependency Local Web Server (PowerShell)
    Allows opening the billing app locally and on other devices/mobiles connected to the same Wi-Fi.
#>

$port = 8080
$folder = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MANI MOBILE SERVICES - BILLING WEB APPLICATION         " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Serving files from: $folder" -ForegroundColor Gray

# Get Local IP address for mobile access
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress

Write-Host "`nOpen in your browser on this PC:" -ForegroundColor Green
Write-Host "  -> http://localhost:$port" -ForegroundColor White
if ($localIp) {
    Write-Host "`nOpen on Mobile Phones / Tablets on same Wi-Fi:" -ForegroundColor Green
    Write-Host "  -> http://${localIp}:$port" -ForegroundColor White
}
Write-Host "`nPress Ctrl+C to stop the server.`n" -ForegroundColor DarkGray

# Open default browser automatically
Start-Process "http://localhost:$port"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:$port/")
try {
    $listener.Start()
} catch {
    # If wildcard binding requires admin, fall back to localhost
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
}

$mimeTypes = @{
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $rawUrl = $request.RawUrl.Split('?')[0]
    if ($rawUrl -eq "/" -or [string]::IsNullOrWhiteSpace($rawUrl)) {
        $rawUrl = "/index.html"
    }

    $relativePath = $rawUrl.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    $filePath = [System.IO.Path]::Combine($folder, $relativePath)

    if ([System.IO.File]::Exists($filePath)) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
        $response.ContentType = $contentType

        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $response.StatusCode = 404
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    }
    $response.OutputStream.Close()
}
