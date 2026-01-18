# Performance rules

- Targets: 60 fps desktop, 45+ fps mid laptops, 30+ fps high-end mobile.
- Keep render loop allocation-free and avoid heavy math in hot paths.
- If fps drops, reduce particle count, lower pixel ratio, or disable antialias.
- performanceMonitor can adapt particle count when fps is low.
