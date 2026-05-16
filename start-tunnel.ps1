# magnet-search 公网隧道启动脚本
# 用法：PowerShell -ExecutionPolicy Bypass -File start-tunnel.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Magnet Search — 公网隧道模式" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 构建前端
Write-Host "[1/3] 构建前端..." -ForegroundColor Yellow
Set-Location "D:\Claude_Project\magnet-search"
npm run build
Write-Host "  前端构建完成" -ForegroundColor Green

# 2. 设置访问密钥（修改此处可自定义密码）
$env:ACCESS_TOKEN = "magnet-search-2024"
Write-Host ""
Write-Host "[2/3] 启动服务端 (端口 3001)..." -ForegroundColor Yellow
Write-Host "  访问密钥: magnet-search-2024" -ForegroundColor Green
Write-Host "  浏览器访问无需密钥，直接 API 调用需要 ?token=magnet-search-2024" -ForegroundColor Green

# 3. 启动服务 + 隧道
Write-Host ""
Write-Host "[3/3] 启动 Cloudflare 隧道..." -ForegroundColor Yellow

$cloudflared = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter "cloudflared.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $cloudflared) {
    Write-Host "  错误: 找不到 cloudflared.exe" -ForegroundColor Red
    exit 1
}

$cfPath = $cloudflared.FullName
Write-Host "  cloudflared 路径: $cfPath" -ForegroundColor Gray

# 启动后端（后台）
$serverJob = Start-Job -Name "magnet-server" -ScriptBlock {
    Set-Location "D:\Claude_Project\magnet-search\server"
    $env:ACCESS_TOKEN = "magnet-search-2024"
    node src/index.js
}

Start-Sleep -Seconds 3

# 启动隧道（前台，按 Ctrl+C 停止）
Write-Host ""
Write-Host "  隧道启动中，等待连接..." -ForegroundColor Yellow
Write-Host "  按 Ctrl+C 停止所有服务" -ForegroundColor Gray
Write-Host ""

try {
    & $cfPath tunnel --url http://localhost:3001 --no-autoupdate
} finally {
    Write-Host ""
    Write-Host "正在关闭服务..." -ForegroundColor Yellow
    Stop-Job -Name "magnet-server" -ErrorAction SilentlyContinue
    Remove-Job -Name "magnet-server" -ErrorAction SilentlyContinue
    Write-Host "已停止" -ForegroundColor Green
}
