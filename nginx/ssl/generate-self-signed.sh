#!/bin/bash
# Script to generate self-signed SSL certificates for RevEd Kids development/testing
# For production, replace these with certificates from a trusted CA like Let's Encrypt

set -e

# Configuration
DOMAIN="yourdomain.com"
DIAMOND_DOMAIN="diamond.yourdomain.com"
CERT_DIR="/etc/nginx/ssl"
DAYS=365

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Generating self-signed SSL certificates for RevEd Kids${NC}"
echo -e "${YELLOW}⚠️  These are for DEVELOPMENT/TESTING only!${NC}"
echo -e "${YELLOW}⚠️  Use Let's Encrypt or proper CA certificates in production!${NC}"
echo

# Create SSL directory if it doesn't exist
mkdir -p $CERT_DIR

# Generate private key for main domain
echo -e "${GREEN}Generating private key for $DOMAIN...${NC}"
openssl genrsa -out $CERT_DIR/$DOMAIN.key 2048

# Generate certificate signing request
echo -e "${GREEN}Generating certificate signing request for $DOMAIN...${NC}"
cat > /tmp/csr.conf <<EOF
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
CN=$DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = www.$DOMAIN
DNS.3 = api.$DOMAIN
DNS.4 = admin.$DOMAIN
EOF

# Generate certificate signing request
openssl req -new -key $CERT_DIR/$DOMAIN.key -out /tmp/$DOMAIN.csr -config /tmp/csr.conf

# Generate self-signed certificate
echo -e "${GREEN}Generating self-signed certificate for $DOMAIN...${NC}"
openssl x509 -req -in /tmp/$DOMAIN.csr -signkey $CERT_DIR/$DOMAIN.key -out $CERT_DIR/$DOMAIN.crt -days $DAYS -extensions v3_req -extfile /tmp/csr.conf

# Generate private key for diamond subdomain
echo -e "${GREEN}Generating private key for $DIAMOND_DOMAIN...${NC}"
openssl genrsa -out $CERT_DIR/$DIAMOND_DOMAIN.key 2048

# Generate certificate signing request for diamond
echo -e "${GREEN}Generating certificate signing request for $DIAMOND_DOMAIN...${NC}"
cat > /tmp/diamond_csr.conf <<EOF
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
CN=$DIAMOND_DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DIAMOND_DOMAIN
EOF

# Generate certificate signing request for diamond
openssl req -new -key $CERT_DIR/$DIAMOND_DOMAIN.key -out /tmp/$DIAMOND_DOMAIN.csr -config /tmp/diamond_csr.conf

# Generate self-signed certificate for diamond
echo -e "${GREEN}Generating self-signed certificate for $DIAMOND_DOMAIN...${NC}"
openssl x509 -req -in /tmp/$DIAMOND_DOMAIN.csr -signkey $CERT_DIR/$DIAMOND_DOMAIN.key -out $CERT_DIR/$DIAMOND_DOMAIN.crt -days $DAYS -extensions v3_req -extfile /tmp/diamond_csr.conf

# Set appropriate permissions
chmod 600 $CERT_DIR/*.key
chmod 644 $CERT_DIR/*.crt

# Clean up temporary files
rm -f /tmp/*.csr /tmp/*csr.conf

echo
echo -e "${GREEN}✅ Self-signed certificates generated successfully!${NC}"
echo
echo -e "${YELLOW}Generated certificates:${NC}"
echo "  - $CERT_DIR/$DOMAIN.crt (expires in $DAYS days)"
echo "  - $CERT_DIR/$DOMAIN.key"
echo "  - $CERT_DIR/$DIAMOND_DOMAIN.crt (expires in $DAYS days)"
echo "  - $CERT_DIR/$DIAMOND_DOMAIN.key"
echo
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update your hosts file to point domains to localhost:"
echo "   127.0.0.1 $DOMAIN"
echo "   127.0.0.1 www.$DOMAIN"
echo "   127.0.0.1 $DIAMOND_DOMAIN"
echo
echo "2. Update nginx configuration with your actual domain names"
echo
echo "3. For production, replace with certificates from a trusted CA:"
echo "   - Let's Encrypt (free): https://letsencrypt.org/"
echo "   - Certbot tool: https://certbot.eff.org/"
echo
echo -e "${RED}⚠️  IMPORTANT: Browser will show security warnings for self-signed certificates${NC}"
echo -e "${RED}⚠️  This is expected behavior - click 'Advanced' and 'Proceed' in browser${NC}"