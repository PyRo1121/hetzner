/**
 * CSS Houdini Paint Worklet - Rune Glow Effect
 * Creates procedural glow effects based on data volatility
 */

class RuneGlowPainter {
  static get inputProperties() {
    return ['--glow-intensity', '--glow-color', '--glow-size'];
  }

  paint(ctx, geom, properties) {
    // Get custom properties
    const intensity = parseFloat(properties.get('--glow-intensity').toString()) || 0.5;
    const colorValue = properties.get('--glow-color').toString().trim() || '#00d4ff';
    const glowSize = parseFloat(properties.get('--glow-size').toString()) || 20;

    // Parse color (simple hex parser)
    const color = this.parseColor(colorValue);
    
    // Create radial gradient for glow effect
    const centerX = geom.width / 2;
    const centerY = geom.height / 2;
    const maxRadius = Math.max(geom.width, geom.height) / 2;

    // Create multiple glow layers for depth
    const layers = 3;
    for (let i = 0; i < layers; i++) {
      const layerIntensity = intensity * (1 - i / layers);
      const layerSize = glowSize * (1 + i * 0.5);
      
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, maxRadius + layerSize
      );

      // Inner glow (bright)
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${layerIntensity * 0.8})`);
      
      // Mid glow
      gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${layerIntensity * 0.3})`);
      
      // Outer glow (fade out)
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, geom.width, geom.height);
    }

    // Add pulsing effect with time-based animation
    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 2) * 0.2 + 0.8;
    
    // Overlay pulse layer
    const pulseGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxRadius * pulse
    );
    
    pulseGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.4})`);
    pulseGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = pulseGradient;
    ctx.fillRect(0, 0, geom.width, geom.height);
  }

  parseColor(colorString) {
    // Simple hex color parser
    const hex = colorString.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
  }
}

// Register the paint worklet
if (typeof registerPaint !== 'undefined') {
  registerPaint('rune-glow', RuneGlowPainter);
}
