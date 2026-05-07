#!/bin/bash
# Cloudflare Pages Deployment Script for MyCodeXvantaOS
# Usage: ./deploy.sh [production|preview|development]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="mycodexvantaos"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-2fead4a141ec2c677eb3bf0ac535f1d5}"

# Determine environment
ENVIRONMENT=${1:-preview}

echo -e "${BLUE}🚀 MyCodeXvantaOS Cloudflare Pages Deployment${NC}"
echo -e "${BLUE}   Environment: ${ENVIRONMENT}${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}   Installing Wrangler CLI...${NC}"
    npm install -g wrangler
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Build the application
echo -e "${YELLOW}🔨 Building Next.js application...${NC}"
NODE_ENV=production npm run build
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Deploy based on environment
echo -e "${YELLOW}🚀 Deploying to Cloudflare Pages (${ENVIRONMENT})...${NC}"

case $ENVIRONMENT in
    production)
        BRANCH="main"
        PROJECT="${PROJECT_NAME}"
        ;;
    preview)
        BRANCH="preview"
        PROJECT="${PROJECT_NAME}-preview"
        ;;
    development)
        BRANCH="develop"
        PROJECT="${PROJECT_NAME}-dev"
        ;;
    *)
        echo -e "${RED}❌ Unknown environment: ${ENVIRONMENT}${NC}"
        echo "   Usage: ./deploy.sh [production|preview|development]"
        exit 1
        ;;
esac

wrangler pages deploy .next \
    --project-name="${PROJECT}" \
    --branch="${BRANCH}" \
    --commit-dirty=true

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""

# Display deployment URLs
case $ENVIRONMENT in
    production)
        echo -e "${GREEN}📍 Production URL: https://admin.autoecoops.io${NC}"
        echo -e "${GREEN}📍 Dashboard URL: https://dashboard.autoecoops.io${NC}"
        ;;
    preview)
        echo -e "${GREEN}📍 Preview URL: https://preview.autoecoops.io${NC}"
        ;;
    development)
        echo -e "${GREEN}📍 Development URL: https://dev.autoecoops.io${NC}"
        ;;
esac

echo ""
echo -e "${BLUE}📅 Deployed at: $(date -u)${NC}"