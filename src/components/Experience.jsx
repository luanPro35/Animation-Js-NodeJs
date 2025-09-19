// Experience.jsx
import { Environment, OrbitControls } from "@react-three/drei";
import { Book } from "./Book";
import { useAtom } from "jotai";
import { pageAtom, pages } from "./UI";
import { useState, useEffect } from "react";
import FallingSparkles from "./FallingSparkles"; // Import component mới

export const Experience = () => {
  const [page] = useAtom(pageAtom);
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    const isBookOpen = page > 0 && page < pages.length;

    if (isBookOpen) {
      setShowSparkles(true);
      // Giữ hiệu ứng trong 4 giây
      const timer = setTimeout(() => {
        setShowSparkles(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowSparkles(false);
    }
  }, [page]);

  return (
    <>
      <group position={[0, 0, 0]}>
        <Book />
        {showSparkles && <FallingSparkles count={200} />}
      </group>

      <OrbitControls enableDamping dampingFactor={0.1} />
      <Environment preset="studio" />

      <directionalLight
        position={[2, 5, 2]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      <ambientLight intensity={0.4} />

      <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
    </>
  );
};
