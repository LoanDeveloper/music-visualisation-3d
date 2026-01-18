# Particle system rules

- ParticleSystem uses BufferGeometry with position and color Float32Array attributes.
- Do not allocate in update(); modify arrays in place.
- Only mark position.needsUpdate and color.needsUpdate when arrays change.
- Default count is 10k; adjust via ThreeScene or setParticleCount.
- Theme updates must refresh colors and mark color.needsUpdate.
