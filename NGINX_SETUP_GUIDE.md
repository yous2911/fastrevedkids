# Nginx Reverse Proxy Setup Guide for RevEd Kids

## 🚀 Production-Ready Nginx Configuration

This guide covers the complete setup of a production-ready Nginx reverse proxy for the RevEd Kids application with SSL termination, security hardening, and performance optimization.

## 📁 File Structure

```
nginx/
├── nginx.conf                 # Main Nginx configuration
├── ssl/                      # SSL certificates directory
│   ├── yourdomain.com.crt    # Main domain certificate
│   ├── yourdomain.com.key    # Main domain private key
│   ├── diamond.yourdomain.com.crt  # Diamond app certificate
│   ├── diamond.yourdomain.com.key  # Diamond app private key
│   ├── generate-self-signed.sh     # Linux/Mac certificate generator
│   ├── generate-self-signed.ps1    # Windows certificate generator
│   ├── openssl.conf          # OpenSSL configuration for main domain
│   └── diamond-openssl.conf  # OpenSSL configuration for diamond domain
└── conf.d/                   # Additional configuration files
    ├── security.conf         # Security headers and rules
    └── performance.conf      # Performance optimizations
```

## 🔧 Configuration Features

### SSL/TLS Security
- **TLS 1.2 and 1.3 only** with modern cipher suites
- **HSTS** with preloading and subdomain inclusion
- **OCSP stapling** for certificate validation
- **SSL session caching** for performance
- **Perfect Forward Secrecy** with ECDHE key exchange

### Security Headers
- **Content Security Policy (CSP)** with strict directives
- **X-Frame-Options**: DENY to prevent clickjacking
- **X-Content-Type-Options**: nosniff to prevent MIME sniffing
- **X-XSS-Protection**: Block XSS attacks
- **Referrer-Policy**: Control referrer information
- **Permissions-Policy**: Disable dangerous browser features

### Rate Limiting
- **Global rate limiting**: 30 requests/second
- **API rate limiting**: 15 requests/second  
- **Auth endpoints**: 5 requests/minute
- **File uploads**: 2 requests/second
- **Connection limits**: 20 per IP, 1000 per server

### Performance Optimization
- **Gzip compression** with optimal settings
- **HTTP/2** support for better performance
- **Proxy caching** for static content and APIs
- **Connection pooling** to backend services
- **Static file serving** with long-term caching
- **Load balancing** with health checks

### Monitoring & Logging
- **Enhanced access logs** with timing information
- **Security-focused auth logs** for monitoring
- **Error logging** with appropriate levels
- **Health check endpoints** for monitoring tools

## 🏗️ Setup Instructions

### 1. Generate SSL Certificates

#### For Development/Testing (Self-Signed)

**Linux/Mac:**
```bash
cd nginx/ssl
chmod +x generate-self-signed.sh
./generate-self-signed.sh
```

**Windows:**
```powershell
cd nginx\ssl
.\generate-self-signed.ps1
```

#### For Production (Let's Encrypt)

Install Certbot:
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx

# macOS
brew install certbot
```

Generate certificates:
```bash
# Replace with your actual domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d diamond.yourdomain.com

# Update nginx config to use Let's Encrypt paths:
# ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

### 2. Update Domain Configuration

Edit `nginx/nginx.conf` and replace placeholder domains:
```bash
# Replace these placeholders with your actual domains:
# yourdomain.com → your-actual-domain.com
# diamond.yourdomain.com → diamond.your-actual-domain.com
```

### 3. Configure Hosts File (Development)

**Linux/Mac** (`/etc/hosts`):
```
127.0.0.1 yourdomain.com
127.0.0.1 www.yourdomain.com  
127.0.0.1 diamond.yourdomain.com
```

**Windows** (`C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1 yourdomain.com
127.0.0.1 www.yourdomain.com
127.0.0.1 diamond.yourdomain.com
```

### 4. Update Docker Compose

Ensure your `docker-compose.prod.yml` includes the Nginx service:

```yaml
services:
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - /var/cache/nginx:/var/cache/nginx
    depends_on:
      - backend-prod
      - frontend-main-prod
      - frontend-diamond-prod
    networks:
      - prod-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 5s
      retries: 3
```

## 🚦 Testing the Configuration

### 1. Validate Nginx Configuration
```bash
# Test configuration syntax
docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -t

# Reload configuration (if running)
docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -s reload
```

### 2. Test SSL Configuration
```bash
# Test SSL handshake
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check certificate details
openssl x509 -in nginx/ssl/yourdomain.com.crt -text -noout
```

### 3. Test Security Headers
```bash
# Check security headers
curl -I https://yourdomain.com

# Test rate limiting
for i in {1..10}; do curl -w "%{http_code}\n" -o /dev/null -s https://yourdomain.com/api/health; done
```

### 4. Performance Testing
```bash
# Test gzip compression
curl -H "Accept-Encoding: gzip" -I https://yourdomain.com

# Test HTTP/2
curl --http2 -I https://yourdomain.com
```

## 🔍 Monitoring & Maintenance

### Log Files
- **Access logs**: `/var/log/nginx/yourdomain.com.access.log`
- **Error logs**: `/var/log/nginx/yourdomain.com.error.log`  
- **Auth logs**: `/var/log/nginx/auth.log`
- **Diamond logs**: `/var/log/nginx/diamond.yourdomain.com.access.log`

### Key Metrics to Monitor
- **Response times** (upstream connect/header/response times)
- **Error rates** (4xx/5xx responses)
- **Rate limiting** (blocked requests)
- **SSL certificate expiration**
- **Cache hit rates**

### Regular Maintenance
- **Weekly**: Review access and error logs
- **Monthly**: Check SSL certificate expiration dates
- **Quarterly**: Update Nginx version and security patches
- **As needed**: Tune rate limiting based on traffic patterns

## 🛡️ Security Best Practices

### Certificate Management
- Use certificates from trusted CAs in production
- Enable automatic certificate renewal with Let's Encrypt
- Monitor certificate expiration dates
- Use strong private keys (2048-bit RSA minimum)

### Access Control  
- Restrict access to sensitive endpoints (admin, internal APIs)
- Implement IP allowlisting for administrative interfaces
- Use fail2ban or similar tools to block malicious IPs
- Monitor authentication logs for brute force attempts

### Configuration Security
- Keep Nginx updated to latest stable version
- Regularly review and update security headers
- Test configuration changes in staging environment
- Backup configuration files before changes

## 🚨 Troubleshooting

### Common Issues

**SSL Certificate Errors:**
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/yourdomain.com.crt -noout -dates

# Verify certificate chain
openssl verify -CAfile ca-bundle.crt yourdomain.com.crt
```

**Backend Connection Issues:**
```bash
# Test backend connectivity
docker-compose exec nginx-proxy ping backend-prod

# Check upstream status
curl -I http://localhost/api/health
```

**Rate Limiting Too Strict:**
```bash
# Check current limits in nginx.conf
grep "limit_req_zone" nginx/nginx.conf

# Adjust burst values as needed
limit_req zone=api burst=50 nodelay;
```

**Performance Issues:**
```bash
# Check worker processes
grep "worker_processes" nginx/nginx.conf

# Monitor connection usage
ss -tuln | grep :80
ss -tuln | grep :443
```

## 📈 Scaling Considerations

### Load Balancing
Add multiple backend instances:
```nginx
upstream backend_servers {
    least_conn;
    server backend-prod-1:3003 max_fails=3 fail_timeout=30s;
    server backend-prod-2:3003 max_fails=3 fail_timeout=30s;
    server backend-prod-3:3003 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

### Caching Strategy  
- Enable Redis for session storage
- Implement CDN for static assets
- Use Nginx proxy caching for API responses
- Consider Varnish for complex caching needs

### High Availability
- Deploy Nginx instances behind a load balancer
- Use shared storage for SSL certificates
- Implement health checks for all services
- Set up monitoring and alerting

---

**📞 Support**
- Documentation: Check this guide and nginx.conf comments
- Logs: Review `/var/log/nginx/` for detailed error information  
- Community: Nginx documentation at https://nginx.org/en/docs/
- Security: Report issues to security@yourdomain.com