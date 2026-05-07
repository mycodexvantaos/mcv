#!/bin/bash
# Cloudflare DNS Configuration Script for MyCodeXvantaOS
# Usage: ./dns-config.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-2fead4a141ec2c677eb3bf0ac535f1d5}"
ZONE_ID="${CLOUDFLARE_ZONE_ID:-1bdb04f9da82872cdff76d8515b85246}"
API_TOKEN="${CLOUDFLARE_API_TOKEN}"
BASE_DOMAIN="autoecoops.io"

echo -e "${BLUE}🌐 MyCodeXvantaOS DNS Configuration${NC}"
echo -e "${BLUE}   Domain: ${BASE_DOMAIN}${NC}"
echo -e "${BLUE}   Zone ID: ${ZONE_ID}${NC}"
echo ""

# Check if API token is set
if [ -z "${API_TOKEN}" ]; then
    echo -e "${RED}❌ CLOUDFLARE_API_TOKEN environment variable is not set!${NC}"
    echo "   Please set it: export CLOUDFLARE_API_TOKEN=your_token"
    exit 1
fi

# Function to create DNS record
create_dns_record() {
    local type="$1"
    local name="$2"
    local content="$3"
    local proxied="${4:-true}"
    
    echo -n "   Creating ${type} record for ${name}... "
    
    RESPONSE=$(curl -s -X POST \
        "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
        -H "Authorization: Bearer ${API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "{
            \"type\": \"${type}\",
            \"name\": \"${name}\",
            \"content\": \"${content}\",
            \"proxied\": ${proxied},
            \"ttl\": 1
        }")
    
    if echo "${RESPONSE}" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Created${NC}"
    else
        ERROR=$(echo "${RESPONSE}" | jq -r '.errors[0].message' 2>/dev/null || echo "Unknown error")
        if [[ "${ERROR}" == *"already exists"* ]] || [[ "${ERROR}" == *"conflict"* ]]; then
            echo -e "${YELLOW}⚠️ Already exists${NC}"
        else
            echo -e "${RED}❌ Failed: ${ERROR}${NC}"
        fi
    fi
}

# Function to create CNAME record for Cloudflare Pages
create_pages_cname() {
    local subdomain="$1"
    local target="$2"
    
    create_dns_record "CNAME" "${subdomain}" "${target}" true
}

echo -e "${YELLOW}📋 Creating DNS records for Cloudflare Pages...${NC}"
echo ""

# Main application domains
echo -e "${BLUE}   Main Application Domains${NC}"
create_pages_cname "admin" "mycodexvantaos.pages.dev"
create_pages_cname "dashboard" "mycodexvantaos.pages.dev"
create_pages_cname "preview" "mycodexvantaos-preview.pages.dev"
create_pages_cname "dev" "mycodexvantaos-dev.pages.dev"
echo ""

# API subdomain
echo -e "${BLUE}   API Subdomain${NC}"
create_pages_cname "api" "mycodexvantaos.pages.dev"
echo ""

# Wildcard for preview deployments
echo -e "${BLUE}   Wildcard for Preview Deployments${NC}"
create_pages_cname "*" "mycodexvantaos-preview.pages.dev"
echo ""

# Verify DNS records
echo -e "${YELLOW}🔍 Verifying DNS records...${NC}"
echo ""

sleep 5

for subdomain in admin dashboard preview dev api; do
    echo -n "   Verifying ${subdomain}.${BASE_DOMAIN}... "
    if nslookup "${subdomain}.${BASE_DOMAIN}" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Resolved${NC}"
    else
        echo -e "${YELLOW}⚠️ Not yet propagated (may take up to 5 minutes)${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ DNS configuration completed!${NC}"
echo -e "${BLUE}   Note: DNS propagation may take up to 5 minutes${NC}"