#!/bin/bash

# Build WASM module for Albion Online Dashboard
echo "🦀 Building Rust WASM module..."

# Install wasm-pack if not available
if ! command -v wasm-pack &> /dev/null; then
    echo "📦 Installing wasm-pack..."
    cargo install wasm-pack
fi

# Build for web target
wasm-pack build --target web --out-dir pkg

echo "✅ WASM build complete!"
echo "📦 Output: rust-wasm/pkg/"
