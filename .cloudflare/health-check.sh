#!/bin/bash
# Cloudflare Pages Health Check Script for MyCodeXvantaOS
# Usage: ./health-check.sh [production|preview|development]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Determine environment
ENVIRONMENT=${1:-production}

echo -e "${BLUE}🏥 MyCodeXvantaOS Health Check${NC}"
echo -e "${BLUE}   Environment: ${ENVIRONMENT}${NC}"
echo ""

# Set URLs based on environment
case $ENVIRONMENT in
    production)
        BASE_URL="https://admin.autoecoops.io"
        ;;
    preview)
        BASE_URL="https://preview.autoecoops.io"
        ;;
    development)
        BASE_URL="https://dev.autoecoops.io"
        ;;
    *)
        echo -e "${RED}❌ Unknown environment: ${ENVIRONMENT}${NC}"
        exit 1
        ;;
esac

# Track results
PASS=0
FAIL=0
WARN=0

# Function to check HTTP endpoint
check_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -n "   Checking ${name}... "
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${url}" --connect-timeout 10 --max-time 30 2>/dev/null || echo "000")
    
    if [ "${HTTP_STATUS}" = "${expected_status}" ]; then
        echo -e "${GREEN}✅ PASS (HTTP ${HTTP_STATUS})${NC}"
        ((PASS++))
    elif [ "${HTTP_STATUS}" = "000" ]; then
        echo -e "${RED}❌ FAIL (Connection failed)${NC}"
        ((FAIL++))
    else
        echo -e "${YELLOW}⚠️ WARN (Expected ${expected_status}, got ${HTTP_STATUS})${NC}"
        ((WARN++))
    fi
}

# Function to check DNS resolution
check_dns() {
    local domain="$1"
    
    echo -n "   Checking DNS for ${domain}... "
    
    if nslookup "${domain}" > /dev/null 2>&1; then
        IP=$(nslookup "${domain}" 2>/dev/null | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
        echo -e "${GREEN}✅ PASS (Resolved to ${IP})${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL (DNS resolution failed)${NC}"
        ((FAIL++))
    fi
}

# Function to check SSL certificate
check_ssl() {
    local domain="$1"
    
    echo -n "   Checking SSL certificate for ${domain}... "
    
    if echo | openssl s_client -connect "${domain}:443" -servername "${domain}" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
        EXPIRY=$(echo | openssl s_client -connect "${domain}:443" -servername "${domain}" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        echo -e "${GREEN}✅ PASS (Expires: ${EXPIRY})${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL (SSL check failed)${NC}"
        ((FAIL++))
    fi
}

# Run health checks
echo -e "${YELLOW}🌐 HTTP Endpoint Checks${NC}"
check_endpoint "Homepage" "${BASE_URL}" "200"
check_endpoint "API Health" "${BASE_URL}/api/health" "200"
check_endpoint "Dashboard" "${BASE_URL}/dashboard" "200"
echo ""

echo -e "${YELLOW}🔍 DNS Resolution Checks${NC}"
check_dns "admin.autoecoops.io"
check_dns "dashboard.autoecoops.io"
check_dns "preview.autoecoops.io"
echo ""

echo -e "${YELLOW}🔒 SSL Certificate Checks${NC}"
check_ssl "admin.autoecoops.io"
check_ssl "preview.autoecoops.io"
echo ""

# Summary
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Health Check Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Passed: ${PASS}${NC}"
echo -e "${YELLOW}⚠️  Warnings: ${WARN}${NC}"
echo -e "${RED}❌ Failed: ${FAIL}${NC}"
echo ""

if [ "${FAIL}" -gt 0 ]; then
    echo -e "${RED}❌ Health check FAILED - Some checks did not pass${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Health check PASSED - All critical checks passed${NC}"
    exit 0
fi