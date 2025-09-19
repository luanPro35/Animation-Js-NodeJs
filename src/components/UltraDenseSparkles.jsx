// UltraDenseSparkles.jsx - Kết hợp với DenseBookSparkles để tạo hiệu ứng cực kỳ dày đặc
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  Color,
  AdditiveBlending,
  MathUtils,
} from "three";

// Tăng cực mạnh số lượng particles cho hiệu ứng siêu dày đặc
const HEAVY_PARTICLES = 600; // Layer particles lớn
const MEDIUM_PARTICLES = 800; // Layer particles vừa
const FINE_PARTICLES = 1000; // Layer particles nhỏ, dày đặc

const BOOK_WIDTH = 1.28;
const BOOK_HEIGHT = 1.71;
const BOOK_DEPTH = 0.5;

export const UltraDenseSparkles = ({
  isActive = true,
  bookPosition = [0, 0, 0],
  intensity = 1.0,
}) => {
  // Refs cho 3 layers khác nhau
  const heavyRef = useRef();
  const mediumRef = useRef();
  const fineRef = useRef();
  const timeRef = useRef(0);

  // Data cho layer particles lớn (heavy sparkles)
  const heavyData = useRef({
    positions: new Float32Array(HEAVY_PARTICLES * 3),
    colors: new Float32Array(HEAVY_PARTICLES * 3),
    sizes: new Float32Array(HEAVY_PARTICLES),
    velocities: new Float32Array(HEAVY_PARTICLES * 3),
    ages: new Float32Array(HEAVY_PARTICLES),
    lifespans: new Float32Array(HEAVY_PARTICLES),
  });

  // Data cho layer particles vừa
  const mediumData = useRef({
    positions: new Float32Array(MEDIUM_PARTICLES * 3),
    colors: new Float32Array(MEDIUM_PARTICLES * 3),
    sizes: new Float32Array(MEDIUM_PARTICLES),
    velocities: new Float32Array(MEDIUM_PARTICLES * 3),
    ages: new Float32Array(MEDIUM_PARTICLES),
    lifespans: new Float32Array(MEDIUM_PARTICLES),
  });

  // Data cho layer particles nhỏ, dày đặc
  const fineData = useRef({
    positions: new Float32Array(FINE_PARTICLES * 3),
    colors: new Float32Array(FINE_PARTICLES * 3),
    sizes: new Float32Array(FINE_PARTICLES),
    velocities: new Float32Array(FINE_PARTICLES * 3),
    ages: new Float32Array(FINE_PARTICLES),
    lifespans: new Float32Array(FINE_PARTICLES),
  });

  // Tạo geometries và materials cho 3 layers
  const {
    heavyGeometry,
    heavyMaterial,
    mediumGeometry,
    mediumMaterial,
    fineGeometry,
    fineMaterial,
  } = useMemo(() => {
    // Heavy particles (kim tuyến lớn, ít hơn)
    const hGeo = new BufferGeometry();
    initializeLayer(heavyData.current, HEAVY_PARTICLES, {
      sizeRange: [12, 25],
      speedRange: [0.6, 1.0],
      colorIntensity: 1.2,
    });

    hGeo.setAttribute(
      "position",
      new Float32BufferAttribute(heavyData.current.positions, 3)
    );
    hGeo.setAttribute(
      "color",
      new Float32BufferAttribute(heavyData.current.colors, 3)
    );
    hGeo.setAttribute(
      "size",
      new Float32BufferAttribute(heavyData.current.sizes, 1)
    );

    const hMat = new PointsMaterial({
      size: 0.12,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    // Medium particles (kim tuyến vừa)
    const mGeo = new BufferGeometry();
    initializeLayer(mediumData.current, MEDIUM_PARTICLES, {
      sizeRange: [6, 15],
      speedRange: [0.8, 1.2],
      colorIntensity: 1.0,
    });

    mGeo.setAttribute(
      "position",
      new Float32BufferAttribute(mediumData.current.positions, 3)
    );
    mGeo.setAttribute(
      "color",
      new Float32BufferAttribute(mediumData.current.colors, 3)
    );
    mGeo.setAttribute(
      "size",
      new Float32BufferAttribute(mediumData.current.sizes, 1)
    );

    const mMat = new PointsMaterial({
      size: 0.08,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    // Fine particles (kim tuyến nhỏ, dày đặc)
    const fGeo = new BufferGeometry();
    initializeLayer(fineData.current, FINE_PARTICLES, {
      sizeRange: [2, 8],
      speedRange: [1.0, 1.6],
      colorIntensity: 0.8,
    });

    fGeo.setAttribute(
      "position",
      new Float32BufferAttribute(fineData.current.positions, 3)
    );
    fGeo.setAttribute(
      "color",
      new Float32BufferAttribute(fineData.current.colors, 3)
    );
    fGeo.setAttribute(
      "size",
      new Float32BufferAttribute(fineData.current.sizes, 1)
    );

    const fMat = new PointsMaterial({
      size: 0.04,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    return {
      heavyGeometry: hGeo,
      heavyMaterial: hMat,
      mediumGeometry: mGeo,
      mediumMaterial: mMat,
      fineGeometry: fGeo,
      fineMaterial: fMat,
    };
  }, []);

  function initializeLayer(data, count, config) {
    const goldShades = [
      new Color("#FFD700"), // Vàng kim
      new Color("#FFC700"), // Vàng kim đậm
      new Color("#FFED4E"), // Vàng sáng
      new Color("#FFA500"), // Cam vàng
      new Color("#FFDF00"), // Vàng school bus
      new Color("#FFBF00"), // Amber
      new Color("#FFE135"), // Vàng chuối
      new Color("#F9D71C"), // Vàng DHL
      new Color("#DAA520"), // Goldenrod
      new Color("#B8860B"), // Dark goldenrod
      new Color("#FFEAA7"), // Light gold
      new Color("#FDCB6E"), // Warm gold
      new Color("#E17055"), // Terracotta gold
      new Color("#74B9FF"), // Light blue gold
    ];

    for (let i = 0; i < count; i++) {
      resetParticleInLayer(i, data, goldShades, config);
    }
  }

  function resetParticleInLayer(index, data, colorPalette, config) {
    // Phân bố đều trong vùng cuốn sách, hơi rộng hơn một chút để tạo hiệu ứng tự nhiên
    const margin = 0.1; // Margin nhỏ để kim tuyến không bị cắt cứng
    const x = (Math.random() - 0.5) * (BOOK_WIDTH + margin) + bookPosition[0];
    const y = Math.random() * 4 + bookPosition[1] + 1.5; // Tăng chiều cao spawn
    const z = (Math.random() - 0.5) * (BOOK_DEPTH + margin) + bookPosition[2];

    data.positions[index * 3] = x;
    data.positions[index * 3 + 1] = y;
    data.positions[index * 3 + 2] = z;

    // Màu sắc với variation
    const baseColor =
      colorPalette[Math.floor(Math.random() * colorPalette.length)];
    const variation = config.colorIntensity * (0.8 + Math.random() * 0.4);

    data.colors[index * 3] = baseColor.r * variation;
    data.colors[index * 3 + 1] = baseColor.g * variation;
    data.colors[index * 3 + 2] = baseColor.b * variation;

    // Kích thước theo config
    const size =
      config.sizeRange[0] +
      Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
    data.sizes[index] = size;

    // Vận tốc theo config
    const speed =
      config.speedRange[0] +
      Math.random() * (config.speedRange[1] - config.speedRange[0]);
    data.velocities[index * 3] = (Math.random() - 0.5) * 0.015; // Drift X
    data.velocities[index * 3 + 1] = -speed; // Fall speed Y
    data.velocities[index * 3 + 2] = (Math.random() - 0.5) * 0.015; // Drift Z

    // Reset tuổi
    data.ages[index] = 0;
    data.lifespans[index] = Math.random() * 4 + 2;
  }

  useFrame((state, delta) => {
    if (!isActive) return;

    timeRef.current += delta;

    // Cập nhật cả 3 layers
    updateLayer(heavyData.current, HEAVY_PARTICLES, heavyGeometry, delta, {
      sizeRange: [12, 25],
      speedRange: [0.6, 1.0],
      colorIntensity: 1.2,
    });

    updateLayer(mediumData.current, MEDIUM_PARTICLES, mediumGeometry, delta, {
      sizeRange: [6, 15],
      speedRange: [0.8, 1.2],
      colorIntensity: 1.0,
    });

    updateLayer(fineData.current, FINE_PARTICLES, fineGeometry, delta, {
      sizeRange: [2, 8],
      speedRange: [1.0, 1.6],
      colorIntensity: 0.8,
    });

    // Cập nhật opacity theo intensity
    heavyMaterial.opacity = MathUtils.lerp(
      heavyMaterial.opacity,
      isActive ? 0.9 * intensity : 0,
      0.1
    );
    mediumMaterial.opacity = MathUtils.lerp(
      mediumMaterial.opacity,
      isActive ? 0.8 * intensity : 0,
      0.1
    );
    fineMaterial.opacity = MathUtils.lerp(
      fineMaterial.opacity,
      isActive ? 0.7 * intensity : 0,
      0.1
    );
  });

  function updateLayer(data, count, geometry, delta, config) {
    let needsUpdate = false;

    const goldShades = [
      new Color("#FFD700"),
      new Color("#FFC700"),
      new Color("#FFED4E"),
      new Color("#FFA500"),
      new Color("#FFDF00"),
      new Color("#FFBF00"),
      new Color("#FFE135"),
      new Color("#F9D71C"),
      new Color("#DAA520"),
      new Color("#B8860B"),
      new Color("#FFEAA7"),
      new Color("#FDCB6E"),
    ];

    for (let i = 0; i < count; i++) {
      data.ages[i] += delta;

      // Reset khi particle rơi xuống dưới hoặc hết tuổi thọ
      if (
        data.positions[i * 3 + 1] < bookPosition[1] - 0.5 ||
        data.ages[i] > data.lifespans[i]
      ) {
        resetParticleInLayer(i, data, goldShades, config);
        needsUpdate = true;
        continue;
      }

      // Cập nhật vị trí
      data.positions[i * 3] += data.velocities[i * 3];
      data.positions[i * 3 + 1] += data.velocities[i * 3 + 1];
      data.positions[i * 3 + 2] += data.velocities[i * 3 + 2];

      // Hiệu ứng gió tự nhiên với các frequency khác nhau cho mỗi layer
      const windX = Math.sin(timeRef.current * 1.5 + i * 0.05) * 0.002;
      const windZ = Math.cos(timeRef.current * 1.2 + i * 0.08) * 0.0025;

      data.positions[i * 3] += windX;
      data.positions[i * 3 + 2] += windZ;

      // Giữ particles trong bounds, với soft boundaries
      const margin = 0.05;
      const bookLeft = bookPosition[0] - BOOK_WIDTH / 2 - margin;
      const bookRight = bookPosition[0] + BOOK_WIDTH / 2 + margin;
      const bookFront = bookPosition[2] - BOOK_DEPTH / 2 - margin;
      const bookBack = bookPosition[2] + BOOK_DEPTH / 2 + margin;

      // Soft wrap around
      if (data.positions[i * 3] < bookLeft) {
        data.positions[i * 3] = bookRight;
      } else if (data.positions[i * 3] > bookRight) {
        data.positions[i * 3] = bookLeft;
      }

      if (data.positions[i * 3 + 2] < bookFront) {
        data.positions[i * 3 + 2] = bookBack;
      } else if (data.positions[i * 3 + 2] > bookBack) {
        data.positions[i * 3 + 2] = bookFront;
      }

      needsUpdate = true;
    }

    if (needsUpdate) {
      geometry.attributes.position.needsUpdate = true;
    }
  }

  return (
    <group>
      {/* Layer 1: Heavy sparkles (lớn, ít) */}
      <points
        ref={heavyRef}
        geometry={heavyGeometry}
        material={heavyMaterial}
      />

      {/* Layer 2: Medium sparkles (vừa) */}
      <points
        ref={mediumRef}
        geometry={mediumGeometry}
        material={mediumMaterial}
      />

      {/* Layer 3: Fine sparkles (nhỏ, dày đặc) */}
      <points ref={fineRef} geometry={fineGeometry} material={fineMaterial} />
    </group>
  );
};
