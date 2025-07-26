#!/bin/bash

echo "🔥 StackBurn WSL Tauri Nuclear Fix"
echo "=================================="

# 1. Clean everything
echo "Step 1: Cleaning all caches and builds..."
rm -rf node_modules
rm -rf dist
rm -rf src-tauri/target
rm -rf .vite
rm -f package-lock.json
rm -f src-tauri/Cargo.lock

# 2. Install dependencies
echo "Step 2: Installing Node dependencies..."
npm install

echo "Step 3: Installing Rust dependencies..."
cd src-tauri
cargo update
cd ..

# 3. Build frontend with debug entry
echo "Step 4: Building frontend..."
npm run build

# 4. Verify build
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not created"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed - index.html not found"
    exit 1
fi

echo "✅ Build successful!"

# 5. Use the fixed Tauri configuration (you must create this file yourself or skip this step if not needed)
if [ -f "src-tauri/tauri.conf.fixed.json" ]; then
    echo "Step 5: Applying fixed Tauri configuration..."
    cp src-tauri/tauri.conf.fixed.json src-tauri/tauri.conf.json
else
    echo "⚠️  Fixed Tauri config not found. Skipping config override."
fi

# 6. Set permissions
echo "Step 6: Setting permissions..."
find . -type f -name "*.sh" -exec chmod +x {} \;
chmod -R 755 dist/
chmod -R 755 src-tauri/

# 7. Export WSL-safe environment
echo "Step 7: Setting WSL environment..."
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export GDK_BACKEND=x11
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):0

# 8. Start with max debug
echo "Step 8: Starting Tauri with full debugging..."
RUST_LOG_

