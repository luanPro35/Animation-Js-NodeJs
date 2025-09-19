import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const FallingSparkles = ({ count = 200 }) => {
  const points = useRef();

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = THREE.MathUtils.randFloatSpread(5); // Tỏa rộng theo trục X
      const y = THREE.MathUtils.randFloat(2, 5); // Bắt đầu từ phía trên
      const z = THREE.MathUtils.randFloatSpread(5); // Tỏa rộng theo trục Z
      const velocity = new THREE.Vector3(
        0,
        -THREE.MathUtils.randFloat(0.01, 0.03),
        0
      );
      const color = new THREE.Color(
        Math.random() > 0.3 ? "#FFD700" : "#FFFFFF"
      );
      temp.push({ position: [x, y, z], velocity, color });
    }
    return temp;
  }, [count]);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    particles.forEach((p, i) => {
      pos[i * 3] = p.position[0];
      pos[i * 3 + 1] = p.position[1];
      pos[i * 3 + 2] = p.position[2];
    });
    return pos;
  }, [count, particles]);

  const colors = useMemo(() => {
    const col = new Float32Array(count * 3);
    particles.forEach((p, i) => {
      p.color.toArray(col, i * 3);
    });
    return col;
  }, [count, particles]);

  useFrame(() => {
    const positions = points.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      // Cập nhật vị trí y để rơi xuống
      positions[i * 3 + 1] += particles[i].velocity.y;

      // Thêm chút hiệu ứng gió nhẹ
      positions[i * 3] += Math.sin(i + performance.now() / 1000) * 0.001;

      // Nếu hạt rơi xuống dưới, reset lại vị trí lên trên
      if (positions[i * 3 + 1] < -2) {
        positions[i * 3 + 1] = THREE.MathUtils.randFloat(3, 5);
        positions[i * 3] = THREE.MathUtils.randFloatSpread(5);
      }
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default FallingSparkles;
