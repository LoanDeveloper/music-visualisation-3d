# General rules

- Keep the existing architecture: React UI + Three.js core + Web Audio API.
- No React Three Fiber or other abstraction layers.
- Prefer small, targeted edits; read files before modifying.
- Avoid new dependencies unless explicitly requested.
- Keep per-frame loops allocation-free; reuse typed arrays.
- Always cleanup in destroy() and useEffect return functions.
