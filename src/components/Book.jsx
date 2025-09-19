// Thêm vào đầu file Book.jsx sau các import
import { useEffect, useMemo, useRef, useState } from "react";
import { pageAtom, pages } from "./UI";
import {
  Bone,
  BoxGeometry,
  Color,
  Float32BufferAttribute,
  MathUtils,
  MeshStandardMaterial,
  SRGBColorSpace,
  Skeleton,
  SkeletonHelper, // Re-add SkeletonHelper as it was present in original code
  SkinnedMesh,
  Uint16BufferAttribute,
  Vector3,
  PointLight, // Re-add PointLight import
} from "three";
import { useCursor, useHelper, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { degToRad } from "three/src/math/MathUtils.js";
import { useAtom } from "jotai";
import { easing } from "maath";

// ... (giữ nguyên tất cả các constants và geometry setup)

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

const easingFactor = 0.5;
const easingFactorFold = 0.3;
const insideCurveStrength = 0.18;
const outsideCurveStrength = 0.05;
const turningCurveStrength = 0.09;

const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for (let i = 0; i < position.count; i++) {
  vertex.fromBufferAttribute(position, i);
  const x = vertex.x;

  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH));
  let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;

  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
}

pageGeometry.setAttribute(
  "skinIndex",
  new Uint16BufferAttribute(skinIndexes, 4)
);
pageGeometry.setAttribute(
  "skinWeight",
  new Float32BufferAttribute(skinWeights, 4)
);

const whiteColor = new Color("white");
const emissiveColor = new Color("orange");
const goldColor = new Color("#FFD700");

const pageMaterials = [
  new MeshStandardMaterial({
    color: whiteColor,
  }),
  new MeshStandardMaterial({
    color: "#111",
  }),
  new MeshStandardMaterial({
    color: whiteColor,
  }),
  new MeshStandardMaterial({
    color: whiteColor,
  }),
];

pages.forEach((page) => {
  useTexture.preload(`/textures/${page.front}.jpg`);
  useTexture.preload(`/textures/${page.back}.jpg`);
  useTexture.preload(`/textures/book-cover-roughness.jpg`);
});

const Page = ({
  number,
  front,
  back,
  page,
  opened,
  bookClosed,
  onPageFlip,
  ...props
}) => {
  const [picture, picture2, pictureRoughness] = useTexture([
    `/textures/${front}.jpg`,
    `/textures/${back}.jpg`,
    ...(number === 0 || number === pages.length - 1
      ? [`textures/book-cover-roughness.jpg`]
      : []),
  ]);
  picture.colorSpace = picture2.colorSpace = SRGBColorSpace;
  const group = useRef();
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);

  const skinnedMeshRef = useRef();
  const magicLightRef = useRef();

  // State để theo dõi khi trang đang lật
  const [isFlipping, setIsFlipping] = useState(false);
  const sparkleIntensity = useRef(0);
  const magicGlowIntensity = useRef(0);

  const manualSkinnedMesh = useMemo(() => {
    const bones = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      let bone = new Bone();
      bones.push(bone);
      if (i === 0) {
        bone.position.x = 0;
      } else {
        bone.position.x = SEGMENT_WIDTH;
      }
      if (i > 0) {
        bones[i - 1].add(bone);
      }
    }
    const skeleton = new Skeleton(bones);

    const materials = [
      ...pageMaterials,
      new MeshStandardMaterial({
        color: whiteColor,
        map: picture,
        ...(number === 0
          ? {
              roughnessMap: pictureRoughness,
            }
          : {
              roughness: 0.1,
            }),
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
      new MeshStandardMaterial({
        color: whiteColor,
        map: picture2,
        ...(number === pages.length - 1
          ? {
              roughnessMap: pictureRoughness,
            }
          : {
              roughness: 0.1,
            }),
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
    ];
    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, []);

  useFrame((state, delta) => {
    if (!skinnedMeshRef.current) {
      return;
    }

    // Hiệu ứng emissive khi hover
    const emissiveIntensity = highlighted ? 0.22 : 0;
    skinnedMeshRef.current.material[4].emissiveIntensity =
      skinnedMeshRef.current.material[5].emissiveIntensity = MathUtils.lerp(
        skinnedMeshRef.current.material[4].emissiveIntensity,
        emissiveIntensity,
        0.1
      );

    // Detect page flipping
    if (lastOpened.current !== opened) {
      turnedAt.current = +new Date();
      lastOpened.current = opened;
      setIsFlipping(true);

      // Trigger sparkle effect callback
      if (onPageFlip) {
        onPageFlip();
      }

      setTimeout(() => setIsFlipping(false), 600); // Tăng thời gian hiệu ứng
    }

    let turningTime = Math.min(600, new Date() - turnedAt.current) / 600; // Tăng thời gian
    turningTime = Math.sin(turningTime * Math.PI);

    // Hiệu ứng kim tuyến và ánh sáng ma thuật khi lật trang
    if (isFlipping) {
      sparkleIntensity.current =
        Math.sin(state.clock.elapsedTime * 15) * 0.5 + 0.5;

      // Hiệu ứng ánh sáng ma thuật mạnh hơn
      magicGlowIntensity.current =
        Math.sin(state.clock.elapsedTime * 8) * 0.3 + 0.7;

      // Hiệu ứng gradient vàng kim nhiều lớp
      const primaryGold = new Color()
        .copy(goldColor)
        .multiplyScalar(sparkleIntensity.current * 0.4);
      const secondaryGold = new Color("#FFA500").multiplyScalar(
        magicGlowIntensity.current * 0.3
      );
      const tertiaryGold = new Color("#FFFF00").multiplyScalar(
        sparkleIntensity.current * 0.2
      );

      // Mix các màu vàng
      const finalGlow = new Color()
        .copy(primaryGold)
        .add(secondaryGold)
        .add(tertiaryGold);

      skinnedMeshRef.current.material[4].emissive = finalGlow;
      skinnedMeshRef.current.material[5].emissive = finalGlow;

      // Hiệu ứng metalness và roughness động
      const metalness =
        sparkleIntensity.current * magicGlowIntensity.current * 0.9;
      const roughness = 0.05 + (1 - sparkleIntensity.current) * 0.3;

      skinnedMeshRef.current.material[4].metalness = metalness;
      skinnedMeshRef.current.material[5].metalness = metalness;
      skinnedMeshRef.current.material[4].roughness = roughness;
      skinnedMeshRef.current.material[5].roughness = roughness;

      // Cập nhật ánh sáng ma thuật
      if (magicLightRef.current) {
        magicLightRef.current.intensity = magicGlowIntensity.current * 2;
        magicLightRef.current.color.setHex(0xffd700);
      }
    } else {
      // Fade out hiệu ứng
      sparkleIntensity.current = MathUtils.lerp(
        sparkleIntensity.current,
        0,
        0.08
      );
      magicGlowIntensity.current = MathUtils.lerp(
        magicGlowIntensity.current,
        0,
        0.08
      );

      const fadeEmissive = new Color()
        .copy(emissiveColor)
        .multiplyScalar(emissiveIntensity + sparkleIntensity.current * 0.1);

      skinnedMeshRef.current.material[4].emissive = fadeEmissive;
      skinnedMeshRef.current.material[5].emissive = fadeEmissive;

      skinnedMeshRef.current.material[4].metalness = MathUtils.lerp(
        skinnedMeshRef.current.material[4].metalness,
        0,
        0.08
      );
      skinnedMeshRef.current.material[5].metalness = MathUtils.lerp(
        skinnedMeshRef.current.material[5].metalness,
        0,
        0.08
      );

      skinnedMeshRef.current.material[4].roughness = MathUtils.lerp(
        skinnedMeshRef.current.material[4].roughness,
        0.1,
        0.08
      );
      skinnedMeshRef.current.material[5].roughness = MathUtils.lerp(
        skinnedMeshRef.current.material[5].roughness,
        0.1,
        0.08
      );

      // Fade out ánh sáng ma thuật
      if (magicLightRef.current) {
        magicLightRef.current.intensity = MathUtils.lerp(
          magicLightRef.current.intensity,
          0,
          0.1
        );
      }
    }

    // ... (giữ nguyên phần animation của bones)
    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    if (!bookClosed) {
      targetRotation += degToRad(number * 0.8);
    }
    const bones = skinnedMeshRef.current.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i];

      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity =
        Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;

      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation;

      let foldRotationAngle = degToRad(Math.sin(targetRotation) * 2);

      if (bookClosed) {
        if (i == 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }

      easing.dampAngle(
        target.rotation,
        "y",
        rotationAngle,
        easingFactor,
        delta
      );

      const foldIntensity =
        i > 8
          ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
          : 0;
      easing.dampAngle(
        target.rotation,
        "x",
        foldRotationAngle * foldIntensity,
        easingFactorFold,
        delta
      );
    }
  });

  const [_, setPage] = useAtom(pageAtom);
  const [highlighted, setHighlighted] = useState(false);
  useCursor(highlighted);

  return (
    <group
      {...props}
      ref={group}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHighlighted(true);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHighlighted(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        // `page` is the current page from the prop (delayedPage)
        // `opened` is true if the page is on the left side
        const newPage = opened ? page - 1 : page + 1;
        setPage(Math.max(0, Math.min(newPage, pages.length)));
        setHighlighted(false);
      }}
    >
      <primitive
        object={manualSkinnedMesh}
        ref={skinnedMeshRef}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
      />

      {/* Ánh sáng ma thuật khi lật trang */}
      <pointLight
        ref={magicLightRef}
        position={[0.5, 0, 0.1]}
        intensity={0}
        color="#FFD700"
        distance={2}
        decay={2}
      />
    </group>
  );
};

export const Book = ({ ...props }) => {
  const [page] = useAtom(pageAtom);
  const [delayedPage, setDelayedPage] = useState(page);
  const groupRef = useRef();
  const [rotate, setRotate] = useState(false);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = -Math.PI / 2;
    }
    const timer = setTimeout(() => {
      setRotate(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let timeout;
    if (page === -1) {
      // Nếu sách đang đóng, đợi một chút rồi mới mở trang đầu tiên
      timeout = setTimeout(() => {
        setDelayedPage(0);
      }, 800);
    } else {
      // Easing a bit the page transition
      timeout = setTimeout(() => {
        setDelayedPage(page);
      }, 300);
    }
    return () => clearTimeout(timeout);
  }, [page]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetRotationX = rotate ? degToRad(-60) : 0;
      easing.damp(
        groupRef.current.rotation,
        "x",
        targetRotationX,
        0.5, // a bit slower easing
        delta
      );
    }
  });

  return (
    <group {...props} ref={groupRef}>
      {pages.map((p, i) => (
        <Page
          key={i}
          number={i}
          front={p.front}
          back={p.back}
          page={delayedPage}
          opened={delayedPage > i}
          bookClosed={page === 0}
          onPageFlip={() => {
            // This callback can be used for any page flip related effects,
            // like playing a sound or triggering an animation.
            // For now, it's just a placeholder.
          }}
        />
      ))}
    </group>
  );
};
