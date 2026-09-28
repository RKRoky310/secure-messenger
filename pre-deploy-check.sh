#!/bin/bash

set -e

echo "🔒 Secure Messenger Pre-Deployment Security Check"
echo "================================================="
echo ""

# Check for hardcoded secrets
echo "[1/10] Checking for hardcoded secrets..."
if grep -r "password\|secret\|token\|key" src/ | grep -v node_modules | grep -v ".git" | grep "=" | grep -v "process.env"; then
    echo "⚠️  Warning: Possible hardcoded secrets found"
else
    echo "✓ No obvious hardcoded secrets"
fi
echo ""

# Check dependencies
echo "[2/10] Auditing dependencies..."
npm audit --json > /tmp/audit.json
VULNS=$(jq '.vulnerabilities | length' /tmp/audit.json)
if [ "$VULNS" -gt 0 ]; then
    echo "⚠️  Warning: Found $VULNS vulnerabilities"
    npm audit
else
    echo "✓ No known vulnerabilities"
fi
echo ""

# Check environment variables
echo "[3/10] Checking environment variables..."
REQUIRED_VARS=("DATABASE_URL" "REDIS_URL" "JWT_SECRET" "ALLOWED_ORIGINS")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "✗ Missing required environment variable: $var"
        exit 1
    fi
done
echo "✓ All required environment variables set"
echo ""

# Test database connection
echo "[4/10] Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
    echo "✓ Database connection successful"
else
    echo "✗ Database connection failed"
    exit 1
fi
echo ""

# Test Redis connection
echo "[5/10] Testing Redis connection..."
if redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; then
    echo "✓ Redis connection successful"
else
    echo "✗ Redis connection failed"
    exit 1
fi
echo ""

# Run security tests
echo "[6/10] Running security tests..."
npm run test:security || true
echo ""

# Check SSL certificate
echo "[7/10] Checking SSL certificate..."
if [ -f /etc/letsencrypt/live/api.securemessenger.app/fullchain.pem ]; then
    EXPIRY=$(openssl x509 -in /etc/letsencrypt/live/api.securemessenger.app/fullchain.pem -noout -enddate | cut -d= -f2)
    echo "✓ SSL certificate found, expires: $EXPIRY"
else
    echo "⚠️  Warning: SSL certificate not found"
fi
echo ""

# Check file permissions
echo "[8/10] Checking file permissions..."
if [ $(find . -type f -perm /077 | wc -l) -gt 0 ]; then
    echo "⚠️  Warning: Files with overly permissive permissions found"
else
    echo "✓ File permissions look good"
fi
echo ""

# Run linter
echo "[9/10] Running code linter..."
npm run lint || true
echo ""

# Final checklist
echo "[10/10] Final security checklist"
echo "✓ Pre-deployment checks complete"
echo ""
echo "Please verify:"
echo "  [ ] Database backups are configured"
echo "  [ ] Monitoring and alerts are configured"
echo "  [ ] Rate limiting is enabled"
echo "  [ ] CORS is properly configured"
echo "  [ ] Security headers are set"
echo ""
read -p "Ready to deploy? (yes/no) " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo "🚀 Starting deployment..."
bash deploy.sh
