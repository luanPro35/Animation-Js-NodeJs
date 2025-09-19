// EnhancedSparkleSystem.jsx
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Color,
  AdditiveBlending,
  MathUtils,
  ShaderMaterial,
  Points,
  Material,
  NormalBufferAttributes,
} from "three";

const PARTICLE_COUNT = 200;
const MAGICAL_DUST_COUNT = 100;

// Custom shader cho hiệu ứng kim tuyến
const sparkleVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  attribute float sparkle;
  
  varying vec3 vColor;
  varying float vSparkle;
  
  void main() {
    vColor = customColor;
    vSparkle = sparkle;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    gl_PointSize = size * (300.0 / -mvPosition.z) * (0.5 + sparkle * 1.5);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const sparkleFragmentShader = `
  varying vec3 vColor;
  varying float vSparkle;
  
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
    
    // Tạo hình sao 6 cánh
    float angle = atan(gl_PointCoord.y - 0.5, gl_PointCoord.x - 0.5);
    float star = abs(cos(angle * 3.0)) * 0.5 + 0.5;
    
    // Hiệu ứng lấp lánh
    float sparkleEffect = sin(vSparkle * 20.0) * 0.3 + 0.7;
    
    // Tạo gradient từ center
    float alpha = (1.0 - r * 2.0) * star * sparkleEffect;
    alpha = smoothstep(0.0, 0.6, alpha);
    
    // Màu sắc động
    vec3 finalColor = vColor * (1.0 + sparkleEffect * 0.8);
    
    gl_FragColor = vec4(finalColor, alpha * 0.9);
  }
`;

interface EnhancedSparkleSystemProps {
  isActive: boolean;
  bookPosition?: [number, number, number];
  intensity?: number;
}

export const EnhancedSparkleSystem = ({
  isActive,
  bookPosition = [0, 0, 0],
  intensity = 1.0,
}: EnhancedSparkleSystemProps) => {
  const mainSparklesRef = useRef<Points<
    BufferGeometry<NormalBufferAttributes>,
    Material | Material[]
  > | null>(null);
  const magicalDustRef = useRef<Points<
    BufferGeometry<NormalBufferAttributes>,
    Material | Material[]
  > | null>(null);
  const timeRef = useRef(0);

  const particleData = useRef({
    positions: new Float32Array(PARTICLE_COUNT * 3),
    colors: new Float32Array(PARTICLE_COUNT * 3),
    sizes: new Float32Array(PARTICLE_COUNT),
    velocities: new Float32Array(PARTICLE_COUNT * 3),
    lifespans: new Float32Array(PARTICLE_COUNT),
    ages: new Float32Array(PARTICLE_COUNT),
    sparkles: new Float32Array(PARTICLE_COUNT),
    initialSizes: new Float32Array(PARTICLE_COUNT),
  });

  const dustData = useRef({
    positions: new Float32Array(MAGICAL_DUST_COUNT * 3),
    colors: new Float32Array(MAGICAL_DUST_COUNT * 3),
    sizes: new Float32Array(MAGICAL_DUST_COUNT),
    velocities: new Float32Array(MAGICAL_DUST_COUNT * 3),
    ages: new Float32Array(MAGICAL_DUST_COUNT),
    sparkles: new Float32Array(MAGICAL_DUST_COUNT),
  });

  // Tạo geometry và material cho kim tuyến chính
  const { geometry: sparkleGeometry, material: sparkleMaterial } =
    useMemo(() => {
      const geo = new BufferGeometry();

      // Khởi tạo particles
      initializeParticles();

      geo.setAttribute(
        "position",
        new Float32BufferAttribute(particleData.current.positions, 3)
      );
      geo.setAttribute(
        "customColor",
        new Float32BufferAttribute(particleData.current.colors, 3)
      );
      geo.setAttribute(
        "size",
        new Float32BufferAttribute(particleData.current.sizes, 1)
      );
      geo.setAttribute(
        "sparkle",
        new Float32BufferAttribute(particleData.current.sparkles, 1)
      );

      const mat = new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
        },
        vertexShader: sparkleVertexShader,
        fragmentShader: sparkleFragmentShader,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      });

      return { geometry: geo, material: mat };
    }, []);

  // Tạo geometry và material cho bụi ma thuật
  const { geometry: dustGeometry, material: dustMaterial } = useMemo(() => {
    const geo = new BufferGeometry();

    initializeMagicalDust();

    geo.setAttribute(
      "position",
      new Float32BufferAttribute(dustData.current.positions, 3)
    );
    geo.setAttribute(
      "color",
      new Float32BufferAttribute(dustData.current.colors, 3)
    );
    geo.setAttribute(
      "size",
      new Float32BufferAttribute(dustData.current.sizes, 1)
    );

    const mat = new PointsMaterial({
      size: 0.02,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, []);

  function initializeParticles() {
    const goldColors = [
      new Color("#FFD700"), // Vàng kim
      new Color("#FFA500"), // Cam vàng
      new Color("#FFFF00"), // Vàng sáng
      new Color("#F0E68C"), // Khaki
      new Color("#DAA520"), // Goldenrod
      new Color("#FFE135"), // Banana yellow
      new Color("#FFEAA7"), // Light gold
      new Color("#FDCB6E"), // Warm gold
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      resetParticle(i, goldColors);
    }
  }

  function initializeMagicalDust() {
    const dustColors = [
      new Color("#FFD700").multiplyScalar(0.7),
      new Color("#FFA500").multiplyScalar(0.6),
      new Color("#FFFFFF").multiplyScalar(0.8),
      new Color("#F0E68C").multiplyScalar(0.5),
    ];

    for (let i = 0; i < MAGICAL_DUST_COUNT; i++) {
      // Vị trí xung quanh cuốn sách
      const angle = (i / MAGICAL_DUST_COUNT) * Math.PI * 2;
      const radius = 0.8 + Math.random() * 1.2;

      dustData.current.positions[i * 3] =
        Math.cos(angle) * radius + bookPosition[0];
      dustData.current.positions[i * 3 + 1] =
        Math.random() * 3 + bookPosition[1];
      dustData.current.positions[i * 3 + 2] =
        Math.sin(angle) * radius + bookPosition[2];

      // Màu sắc
      const color = dustColors[Math.floor(Math.random() * dustColors.length)];
      dustData.current.colors[i * 3] = color.r;
      dustData.current.colors[i * 3 + 1] = color.g;
      dustData.current.colors[i * 3 + 2] = color.b;

      // Kích thước và vận tốc
      dustData.current.sizes[i] = Math.random() * 3 + 1;
      dustData.current.velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      dustData.current.velocities[i * 3 + 1] = -(Math.random() * 0.3 + 0.1);
      dustData.current.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

      dustData.current.ages[i] = Math.random() * 10;
      dustData.current.sparkles[i] = Math.random();
    }
  }

  function resetParticle(index: number, goldColors: Color[]) {
    const spread = 2.5;

    // Vị trí từ trên cao
    particleData.current.positions[index * 3] =
      (Math.random() - 0.5) * spread + bookPosition[0];
    particleData.current.positions[index * 3 + 1] =
      Math.random() * 2 + 4 + bookPosition[1];
    particleData.current.positions[index * 3 + 2] =
      (Math.random() - 0.5) * spread + bookPosition[2];

    // Màu sắc
    const color = goldColors[Math.floor(Math.random() * goldColors.length)];
    particleData.current.colors[index * 3] = color.r;
    particleData.current.colors[index * 3 + 1] = color.g;
    particleData.current.colors[index * 3 + 2] = color.b;

    // Kích thước
    const size = Math.random() * 15 + 5;
    particleData.current.sizes[index] = size;
    particleData.current.initialSizes[index] = size;

    // Vận tốc với hiệu ứng gió nhẹ
    particleData.current.velocities[index * 3] = (Math.random() - 0.5) * 0.03;
    particleData.current.velocities[index * 3 + 1] = -(
      Math.random() * 1.2 +
      0.8
    );
    particleData.current.velocities[index * 3 + 2] =
      (Math.random() - 0.5) * 0.03;

    // Reset tuổi và sparkle
    particleData.current.ages[index] = 0;
    particleData.current.lifespans[index] = Math.random() * 4 + 2;
    particleData.current.sparkles[index] = Math.random() * Math.PI * 2;
  }

  useFrame((_state, delta: number) => {
    timeRef.current += delta;

    if (!mainSparklesRef.current || !magicalDustRef.current) return;

    // Cập nhật uniform time cho shader
    if (sparkleMaterial.uniforms) {
      sparkleMaterial.uniforms.time.value = timeRef.current;
    }

    // Cập nhật kim tuyến chính
    updateMainSparkles(delta);

    // Cập nhật bụi ma thuật
    updateMagicalDust(delta);

    // Cập nhật opacity dựa trên trạng thái active
    const targetOpacity = isActive ? 1.0 * intensity : 0;
    dustMaterial.opacity = MathUtils.lerp(
      dustMaterial.opacity,
      targetOpacity * 0.6,
      0.1
    );
  });

  function updateMainSparkles(delta: number) {
    let needsUpdate = false;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particleData.current.ages[i] += delta;

      // Reset particle nếu cần
      if (
        particleData.current.ages[i] > particleData.current.lifespans[i] ||
        particleData.current.positions[i * 3 + 1] < bookPosition[1] - 2
      ) {
        resetParticle(i, [
          new Color("#FFD700"),
          new Color("#FFA500"),
          new Color("#FFFF00"),
          new Color("#F0E68C"),
          new Color("#DAA520"),
          new Color("#FFE135"),
          new Color("#FFEAA7"),
          new Color("#FDCB6E"),
        ]);
        needsUpdate = true;
        continue;
      }

      // Cập nhật vị trí
      particleData.current.positions[i * 3] +=
        particleData.current.velocities[i * 3];
      particleData.current.positions[i * 3 + 1] +=
        particleData.current.velocities[i * 3 + 1];
      particleData.current.positions[i * 3 + 2] +=
        particleData.current.velocities[i * 3 + 2];

      // Hiệu ứng gió
      particleData.current.positions[i * 3] +=
        Math.sin(timeRef.current * 2 + i * 0.1) * 0.008;
      particleData.current.positions[i * 3 + 2] +=
        Math.cos(timeRef.current * 1.5 + i * 0.1) * 0.006;

      // Cập nhật sparkle effect
      particleData.current.sparkles[i] = timeRef.current + i * 0.5;

      // Hiệu ứng fade
      const ageRatio =
        particleData.current.ages[i] / particleData.current.lifespans[i];
      const alpha = Math.sin((1 - ageRatio) * Math.PI);

      // Cập nhật kích thước
      const sparkleEffect =
        Math.sin(particleData.current.sparkles[i] * 8) * 0.3 + 0.7;
      particleData.current.sizes[i] =
        particleData.current.initialSizes[i] * alpha * sparkleEffect;

      needsUpdate = true;
    }

    if (needsUpdate) {
      sparkleGeometry.attributes.position.needsUpdate = true;
      sparkleGeometry.attributes.size.needsUpdate = true;
      sparkleGeometry.attributes.sparkle.needsUpdate = true;
    }
  }

  function updateMagicalDust(delta: number) {
    let needsUpdate = false;

    for (let i = 0; i < MAGICAL_DUST_COUNT; i++) {
      dustData.current.ages[i] += delta;

      // Chuyển động tròn chậm xung quanh sách
      const angle = dustData.current.ages[i] * 0.5 + i * 0.1;
      const radius = 0.8 + Math.sin(dustData.current.ages[i] * 2) * 0.3;

      dustData.current.positions[i * 3] =
        Math.cos(angle) * radius + bookPosition[0];
      dustData.current.positions[i * 3 + 1] +=
        dustData.current.velocities[i * 3 + 1];
      dustData.current.positions[i * 3 + 2] =
        Math.sin(angle) * radius + bookPosition[2];

      // Reset nếu rơi quá thấp
      if (dustData.current.positions[i * 3 + 1] < bookPosition[1] - 1) {
        dustData.current.positions[i * 3 + 1] =
          Math.random() * 2 + 3 + bookPosition[1];
        dustData.current.ages[i] = 0;
      }

      needsUpdate = true;
    }

    if (needsUpdate) {
      dustGeometry.attributes.position.needsUpdate = true;
    }
  }

  useEffect(() => {
    if (isActive) {
      // Reset tất cả particles khi active
      initializeParticles();
      initializeMagicalDust();
    }
  }, [isActive]);

  return (
    <group>
      {/* Kim tuyến chính rơi từ trên */}
      <points
        ref={mainSparklesRef}
        geometry={sparkleGeometry}
        material={sparkleMaterial}
      />

      {/* Bụi ma thuật xung quanh sách */}
      <points
        ref={magicalDustRef}
        geometry={dustGeometry}
        material={dustMaterial}
      />

      {/* Hiệu ứng ánh sáng bổ sung */}
      {isActive && (
        <>
          <pointLight
            position={[bookPosition[0], bookPosition[1] + 2, bookPosition[2]]}
            intensity={intensity * 1.5}
            color="#FFD700"
            distance={6}
            decay={1.8}
          />
          <pointLight
            position={[
              bookPosition[0] + 1,
              bookPosition[1] + 1.5,
              bookPosition[2] + 1,
            ]}
            intensity={intensity * 0.8}
            color="#FFA500"
            distance={4}
            decay={2}
          />
          <pointLight
            position={[
              bookPosition[0] - 1,
              bookPosition[1] + 1.5,
              bookPosition[2] - 1,
            ]}
            intensity={intensity * 0.8}
            color="#FFFF00"
            distance={4}
            decay={2}
          />
        </>
      )}
    </group>
  );
};
