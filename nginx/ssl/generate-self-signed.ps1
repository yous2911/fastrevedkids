# PowerShell script to generate self-signed SSL certificates for RevEd Kids on Windows
# For production, replace these with certificates from a trusted CA like Let's Encrypt

param(
    [string]$Domain = "yourdomain.com",
    [string]$DiamondDomain = "diamond.yourdomain.com",
    [int]$Days = 365
)

# Configuration
$CertDir = "C:\Users\rachida\Desktop\fastrevedkids\nginx\ssl"
$OpensslPath = "openssl" # Assumes OpenSSL is in PATH

Write-Host "🔐 Generating self-signed SSL certificates for RevEd Kids" -ForegroundColor Green
Write-Host "⚠️  These are for DEVELOPMENT/TESTING only!" -ForegroundColor Yellow
Write-Host "⚠️  Use Let's Encrypt or proper CA certificates in production!" -ForegroundColor Yellow
Write-Host

# Check if OpenSSL is available
try {
    & $OpensslPath version | Out-Null
} catch {
    Write-Host "❌ OpenSSL not found in PATH. Please install OpenSSL first." -ForegroundColor Red
    Write-Host "Download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    exit 1
}

# Create SSL directory if it doesn't exist
if (-not (Test-Path $CertDir)) {
    New-Item -ItemType Directory -Path $CertDir -Force | Out-Null
}

# Generate private key for main domain
Write-Host "Generating private key for $Domain..." -ForegroundColor Green
& $OpensslPath genrsa -out "$CertDir\$Domain.key" 2048

# Create CSR configuration for main domain
$CsrConfig = @"
[req]
default_bits = 2048
prompt = no
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=State
L=City
O=RevEd Kids
OU=Development
CN=$Domain

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $Domain
DNS.2 = www.$Domain
DNS.3 = api.$Domain
DNS.4 = admin.$Domain
"@

$CsrConfigPath = "$env:TEMP\csr.conf"
$CsrConfig | Out-File -FilePath $CsrConfigPath -Encoding ASCII

# Generate certificate signing request
Write-Host "Generating certificate signing request for $Domain..." -ForegroundColor Green
& $OpensslPath req -new -key "$CertDir\$Domain.key" -out "$env:TEMP\$Domain.csr" -config $CsrConfigPath

# Generate self-signed certificate
Write-Host "Generating self-signed certificate for $Domain..." -ForegroundColor Green
& $OpensslPath x509 -req -in "$env:TEMP\$Domain.csr" -signkey "$CertDir\$Domain.key" -out "$CertDir\$Domain.crt" -days $Days -extensions v3_req -extfile $CsrConfigPath

# Generate private key for diamond subdomain
Write-Host "Generating private key for $DiamondDomain..." -ForegroundColor Green
& $OpensslPath genrsa -out "$CertDir\$DiamondDomain.key" 2048

# Create CSR configuration for diamond domain
$DiamondCsrConfig = @"
[req]
default_bits = 2048
prompt = no
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=State
L=City
O=RevEd Kids
OU=Development
CN=$DiamondDomain

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DiamondDomain
"@

$DiamondCsrConfigPath = "$env:TEMP\diamond_csr.conf"
$DiamondCsrConfig | Out-File -FilePath $DiamondCsrConfigPath -Encoding ASCII

# Generate certificate signing request for diamond
Write-Host "Generating certificate signing request for $DiamondDomain..." -ForegroundColor Green
& $OpensslPath req -new -key "$CertDir\$DiamondDomain.key" -out "$env:TEMP\$DiamondDomain.csr" -config $DiamondCsrConfigPath

# Generate self-signed certificate for diamond
Write-Host "Generating self-signed certificate for $DiamondDomain..." -ForegroundColor Green
& $OpensslPath x509 -req -in "$env:TEMP\$DiamondDomain.csr" -signkey "$CertDir\$DiamondDomain.key" -out "$CertDir\$DiamondDomain.crt" -days $Days -extensions v3_req -extfile $DiamondCsrConfigPath

# Clean up temporary files
Remove-Item "$env:TEMP\*.csr" -ErrorAction SilentlyContinue
Remove-Item "$env:TEMP\*csr.conf" -ErrorAction SilentlyContinue

Write-Host
Write-Host "✅ Self-signed certificates generated successfully!" -ForegroundColor Green
Write-Host
Write-Host "Generated certificates:" -ForegroundColor Yellow
Write-Host "  - $CertDir\$Domain.crt (expires in $Days days)"
Write-Host "  - $CertDir\$Domain.key"
Write-Host "  - $CertDir\$DiamondDomain.crt (expires in $Days days)"
Write-Host "  - $CertDir\$DiamondDomain.key"
Write-Host
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your hosts file (C:\Windows\System32\drivers\etc\hosts):"
Write-Host "   127.0.0.1 $Domain"
Write-Host "   127.0.0.1 www.$Domain"
Write-Host "   127.0.0.1 $DiamondDomain"
Write-Host
Write-Host "2. Update nginx configuration with your actual domain names"
Write-Host
Write-Host "3. For production, replace with certificates from a trusted CA:"
Write-Host "   - Let's Encrypt (free): https://letsencrypt.org/"
Write-Host "   - Certbot tool: https://certbot.eff.org/"
Write-Host
Write-Host "⚠️  IMPORTANT: Browser will show security warnings for self-signed certificates" -ForegroundColor Red
Write-Host "⚠️  This is expected behavior - click 'Advanced' and 'Proceed' in browser" -ForegroundColor Red