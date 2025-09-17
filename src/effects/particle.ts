import type p5 from "p5";
import type { Effect } from "./types";

const defaults = {
  particleCount: 100,
  particleSize: 3,
  speed: 1.0,
  attraction: 0.5,
  repulsion: 0.2,
  trailLength: 20,
  mode: "flow" as const,
  shape: "circle" as const,
  interaction: "attract" as const,
};

type ParticleMode = "flow" | "orbit" | "swarm" | "explosion" | "vortex" | "wave";
type ParticleShape = "circle" | "square" | "triangle" | "line" | "cross";
type InteractionType = "attract" | "repel" | "flow" | "none";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  phase: number;
  trail: Array<{ x: number; y: number; age: number }>;
};

type ParticleState = {
  particles: Particle[];
  prepared: boolean;
  lastCount: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const createParticle = (p: p5, rng: () => number, particleSize: number): Particle => {
  return {
    x: rng() * p.width,
    y: rng() * p.height,
    vx: (rng() - 0.5) * 2,
    vy: (rng() - 0.5) * 2,
    life: 1.0,
    maxLife: 0.5 + rng() * 0.5,
    size: particleSize * (0.5 + rng() * 0.5),
    phase: rng() * Math.PI * 2,
    trail: [],
  };
};

const updateParticle = (
  particle: Particle,
  p: p5,
  rng: () => number,
  mode: ParticleMode,
  speed: number,
  attraction: number,
  repulsion: number,
  time: number,
  allParticles: Particle[],
  interaction: InteractionType
) => {
  const center = { x: p.width / 2, y: p.height / 2 };

  // Update trail
  particle.trail.unshift({ x: particle.x, y: particle.y, age: 0 });
  if (particle.trail.length > 20) {
    particle.trail.pop();
  }
  particle.trail.forEach(point => point.age++);

  let fx = 0, fy = 0;

  switch (mode) {
    case "flow": {
      const noiseScale = 0.01;
      const angle = p.noise(particle.x * noiseScale, particle.y * noiseScale, time * 0.5) * Math.PI * 2;
      fx = Math.cos(angle) * speed;
      fy = Math.sin(angle) * speed;
      break;
    }

    case "orbit": {
      const dx = center.x - particle.x;
      const dy = center.y - particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const normalX = dx / dist;
        const normalY = dy / dist;
        fx = -normalY * speed;
        fy = normalX * speed;
        fx += normalX * attraction * 0.1;
        fy += normalY * attraction * 0.1;
      }
      break;
    }

    case "swarm": {
      // Boids-like behavior
      allParticles.forEach(other => {
        if (other === particle) return;
        const dx = other.x - particle.x;
        const dy = other.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 50 && dist > 0) {
          const normalX = dx / dist;
          const normalY = dy / dist;

          // Separation (repel nearby)
          if (dist < 20) {
            fx -= normalX * repulsion;
            fy -= normalY * repulsion;
          }

          // Alignment and cohesion
          fx += other.vx * attraction * 0.1;
          fy += other.vy * attraction * 0.1;
        }
      });

      // Move toward center
      const dx = center.x - particle.x;
      const dy = center.y - particle.y;
      fx += dx * 0.001 * attraction;
      fy += dy * 0.001 * attraction;
      break;
    }

    case "explosion": {
      const dx = particle.x - center.x;
      const dy = particle.y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        fx = (dx / dist) * speed * (1 + Math.sin(time * 2) * 0.5);
        fy = (dy / dist) * speed * (1 + Math.sin(time * 2) * 0.5);
      }
      break;
    }

    case "vortex": {
      const dx = center.x - particle.x;
      const dy = center.y - particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const normalX = dx / dist;
        const normalY = dy / dist;
        // Spiral inward
        fx = normalX * attraction - normalY * speed;
        fy = normalY * attraction + normalX * speed;
      }
      break;
    }

    case "wave": {
      const waveX = Math.sin(time * 2 + particle.y * 0.01) * speed;
      const waveY = Math.cos(time * 1.5 + particle.x * 0.01) * speed * 0.5;
      fx = waveX;
      fy = waveY;
      break;
    }
  }

  // Apply forces
  particle.vx += fx * 0.1;
  particle.vy += fy * 0.1;

  // Damping
  particle.vx *= 0.98;
  particle.vy *= 0.98;

  // Update position
  particle.x += particle.vx;
  particle.y += particle.vy;

  // Wrap around edges
  if (particle.x < 0) particle.x = p.width;
  if (particle.x > p.width) particle.x = 0;
  if (particle.y < 0) particle.y = p.height;
  if (particle.y > p.height) particle.y = 0;

  // Update life
  particle.life -= 0.002;
  if (particle.life <= 0) {
    // Respawn
    particle.x = rng() * p.width;
    particle.y = rng() * p.height;
    particle.vx = (rng() - 0.5) * 2;
    particle.vy = (rng() - 0.5) * 2;
    particle.life = particle.maxLife;
    particle.trail = [];
  }
};

export const particle: Effect = {
  id: "particle",
  name: "Particle",
  params: [
    { key: "particleCount", type: "int", label: "Particle Count", min: 10, max: 500, step: 10 },
    { key: "particleSize", type: "number", label: "Particle Size", min: 1, max: 20, step: 0.5 },
    { key: "speed", type: "number", label: "Speed", min: 0.1, max: 5, step: 0.1 },
    { key: "attraction", type: "number", label: "Attraction", min: 0, max: 2, step: 0.1 },
    { key: "repulsion", type: "number", label: "Repulsion", min: 0, max: 2, step: 0.1 },
    { key: "trailLength", type: "int", label: "Trail Length", min: 0, max: 50, step: 1 },
    {
      key: "mode",
      type: "select",
      label: "Behavior Mode",
      options: ["flow", "orbit", "swarm", "explosion", "vortex", "wave"],
    },
    {
      key: "shape",
      type: "select",
      label: "Particle Shape",
      options: ["circle", "square", "triangle", "line", "cross"],
    },
    {
      key: "interaction",
      type: "select",
      label: "Interaction Type",
      options: ["attract", "repel", "flow", "none"],
    },
  ],
  defaults,
  init(p, ctx, params) {
    const particleCount = clamp(Number(params.particleCount ?? defaults.particleCount), 10, 500);
    const particleSize = clamp(Number(params.particleSize ?? defaults.particleSize), 1, 20);

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(p, ctx.rng, particleSize));
    }

    const state: ParticleState = {
      particles,
      prepared: true,
      lastCount: particleCount,
    };

    p.pixelDensity(1);
    p.noiseSeed(ctx.seedHash);

    ctx.data = state;
  },
  update() {
    // No-op; all work done in render.
  },
  render(p, ctx, t, _frame, params) {
    const state = ctx.data as ParticleState | undefined;
    if (!state || !state.prepared) return;

    const particleCount = clamp(Number(params.particleCount ?? defaults.particleCount), 10, 500);
    const particleSize = clamp(Number(params.particleSize ?? defaults.particleSize), 1, 20);
    const speed = clamp(Number(params.speed ?? defaults.speed), 0.1, 5);
    const attraction = clamp(Number(params.attraction ?? defaults.attraction), 0, 2);
    const repulsion = clamp(Number(params.repulsion ?? defaults.repulsion), 0, 2);
    const trailLength = clamp(Number(params.trailLength ?? defaults.trailLength), 0, 50);
    const mode = (params.mode ?? defaults.mode) as ParticleMode;
    const shape = (params.shape ?? defaults.shape) as ParticleShape;
    const interaction = (params.interaction ?? defaults.interaction) as InteractionType;

    // Adjust particle count if changed
    if (state.lastCount !== particleCount) {
      if (particleCount > state.particles.length) {
        // Add particles
        while (state.particles.length < particleCount) {
          state.particles.push(createParticle(p, ctx.rng, particleSize));
        }
      } else {
        // Remove particles
        state.particles = state.particles.slice(0, particleCount);
      }
      state.lastCount = particleCount;
    }

    p.background(ctx.colors.paper);

    // Update and render particles
    state.particles.forEach(particle => {
      updateParticle(particle, p, ctx.rng, mode, speed, attraction, repulsion, t, state.particles, interaction);

      // Draw trail
      if (trailLength > 0) {
        p.stroke(ctx.colors.ink);
        p.noFill();
        for (let i = 1; i < Math.min(particle.trail.length, trailLength); i++) {
          const current = particle.trail[i];
          const previous = particle.trail[i - 1];
          const alpha = (1 - i / trailLength) * particle.life * 255;

          p.strokeWeight(1 + (1 - i / trailLength) * 2);
          p.stroke(ctx.colors.ink, alpha);
          p.line(previous.x, previous.y, current.x, current.y);
        }
      }

      // Draw particle
      const alpha = particle.life * 255;
      p.fill(ctx.colors.ink, alpha);
      p.stroke(ctx.colors.ink, alpha);
      p.strokeWeight(1);

      p.push();
      p.translate(particle.x, particle.y);
      p.rotate(particle.phase + t);

      switch (shape) {
        case "circle":
          p.ellipse(0, 0, particle.size, particle.size);
          break;

        case "square":
          p.rect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
          break;

        case "triangle":
          p.beginShape();
          p.vertex(0, -particle.size / 2);
          p.vertex(-particle.size / 2, particle.size / 2);
          p.vertex(particle.size / 2, particle.size / 2);
          p.endShape(p.CLOSE);
          break;

        case "line":
          p.line(-particle.size / 2, 0, particle.size / 2, 0);
          break;

        case "cross":
          p.line(-particle.size / 2, 0, particle.size / 2, 0);
          p.line(0, -particle.size / 2, 0, particle.size / 2);
          break;
      }

      p.pop();
    });
  },
};