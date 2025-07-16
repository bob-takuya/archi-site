#!/bin/bash

# Test production build with the database fixes

echo "🚀 Testing production build with database fixes..."
echo "================================================"

# Change to project directory
cd ~/ai-creative-team/archi-site

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist

# Build the project
echo "🔨 Building production version..."
npm run build

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Check for the critical files in dist
    echo ""
    echo "📁 Checking critical files in dist..."
    
    if [ -f "dist/sqlite.worker.js" ]; then
        echo "✅ sqlite.worker.js found"
    else
        echo "❌ sqlite.worker.js NOT found"
    fi
    
    if [ -f "dist/sql-wasm.wasm" ]; then
        echo "✅ sql-wasm.wasm found"
    else
        echo "❌ sql-wasm.wasm NOT found"
    fi
    
    if [ -d "dist/db" ]; then
        echo "✅ db directory found"
        ls -la dist/db/ | head -5
    else
        echo "❌ db directory NOT found"
    fi
    
    # Preview the build
    echo ""
    echo "🌐 Starting preview server..."
    echo "Open http://localhost:4173/archi-site/ to test"
    echo "Press Ctrl+C to stop"
    npm run preview
    
else
    echo "❌ Build failed!"
    exit 1
fi