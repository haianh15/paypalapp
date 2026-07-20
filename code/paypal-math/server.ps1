$port   = 3000
$root   = $PSScriptRoot
$prefix = "http://localhost:$port/"

$mimeMap = @{
  ".html"  = "text/html; charset=utf-8"
  ".css"   = "text/css; charset=utf-8"
  ".js"    = "application/javascript; charset=utf-8"
  ".json"  = "application/json; charset=utf-8"
  ".png"   = "image/png"
  ".jpg"   = "image/jpeg"
  ".jpeg"  = "image/jpeg"
  ".gif"   = "image/gif"
  ".svg"   = "image/svg+xml"
  ".ico"   = "image/x-icon"
  ".woff"  = "font/woff"
  ".woff2" = "font/woff2"
  ".ttf"   = "font/ttf"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  Write-Host "[ERROR] Cannot start server on port $port" -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}

Write-Host ""
Write-Host "  ======================================" -ForegroundColor Cyan
Write-Host "   PayPal Math - Server is running!" -ForegroundColor Green
Write-Host "  ======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Open: http://localhost:$port" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:$port"

while ($listener.IsListening) {
  try {
    $ctx     = $listener.GetContext()
    $req     = $ctx.Request
    $res     = $ctx.Response
    $urlPath = $req.Url.AbsolutePath

    if ($urlPath -eq "/" -or $urlPath -eq "") {
      $urlPath = "/index.html"
    }

    $relative = $urlPath.TrimStart("/").Replace("/", "\")
    $filePath = Join-Path $root $relative

    if (Test-Path $filePath -PathType Container) {
      $filePath = Join-Path $filePath "index.html"
    }

    if (Test-Path $filePath -PathType Leaf) {
      $ext   = [System.IO.Path]::GetExtension($filePath).ToLower()
      $mime  = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($filePath)

      $res.StatusCode      = 200
      $res.ContentType     = $mime
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)

      Write-Host "  [200] $urlPath" -ForegroundColor Green
    } else {
      $body  = "<h1>404 Not Found</h1><p>$urlPath</p>"
      $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)

      $res.StatusCode      = 404
      $res.ContentType     = "text/html; charset=utf-8"
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)

      Write-Host "  [404] $urlPath" -ForegroundColor Red
    }

    $res.OutputStream.Close()
  } catch {
    if ($listener.IsListening) {
      Write-Host "  [ERR] $($_.Exception.Message)" -ForegroundColor Red
    }
  }
}

$listener.Stop()
Write-Host "Server stopped." -ForegroundColor Gray
