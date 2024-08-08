import { useMemo, useRef } from "react";
import { pageAtom, pages } from "./UI";
import { Bone, BoxGeometry, Color, Float32BufferAttribute, MeshStandardMaterial, SRGBColorSpace, Skeleton, SkeletonHelper, SkinnedMesh, Uint16BufferAttribute, Vector3 } from "three";
import { useHelper, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { degToRad } from "three/src/math/MathUtils.js";
import { useAtom } from "jotai";

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71; // 4:3 ratio
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2
)

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0) // sets the anchor origin of the book to the left

//GET ALL POSITIONS FROM OUR GEOMETRY
const position = pageGeometry.attributes.position;
//DECLARE A VERTEX
const vertex = new Vector3();
// CREATE AN ARRAY OF INDEXES OF SKIN BONES
const skinIndexes = [];
// ASSOCIATED WEIGHTS FOR ABOVE INDEXES
const skinWeights = [];

//LOOP THROUGH EACH POISTION (VERTEX)
for (let i = 0; i < position.count; i++) {
  // ALL VERTICES
  vertex.fromBufferAttribute(position, i); // get the vertex
  const x = vertex.x; // get the x poisition of the vertex

  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH)); // calculate the skin index
  let skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH; // calculate the skin width

  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0); // set the skin indexes
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0); // set the skin weights
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
  useTexture.preload(`/textures/${page.front}.jpg`)
  useTexture.preload(`/textures/${page.back}.jpg`)
  useTexture.preload(`/textures/book-cover-roughness.jpg`)
})

const Page = ({number, front, back, page, ...props}) => {
  const [picture, picture2, pictureRoughness] = useTexture([
    `/textures/${front}.jpg`,
    `/textures/${back}.jpg`,
    ...(number === 0 || number === pages.length -1 
      ? [`textures/book-cover-roughness.jpg`]
      : []),
  ]); 
  picture.colorSpace = picture2.colorSpace = SRGBColorSpace;
  const group = useRef();

  const skinnedMeshRef = useRef();

  const manualSkinnedMesh = useMemo(() => {
    const bones = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      let bone = new Bone();
      bones.push(bone);
      if(i === 0) {
        bone.position.x = 0;
      } else {
        bone.position.x = SEGMENT_WIDTH;
      }
      if(i > 0) {
        bones[i - 1].add(bone); // attach the new bone to the previous bone
      }
    }
    const skeleton = new Skeleton(bones);

    const materials = [...pageMaterials,
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
          }
        )
      })
    ];
    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false; // able to see our book when bended
    mesh.add(skeleton.bones[0]); // adding root bone to our mesh
    mesh.bind(skeleton);
    return mesh;
  }, []);

  // useHelper(skinnedMeshRef, SkeletonHelper, "red") // displays bones

  useFrame(() => {
    if(!skinnedMeshRef.current){
      return;
    }
    const bones = skinnedMeshRef.current.skeleton.bones;

  })

  return (
  <group {...props} ref={group}>
    <primitive 
      object={manualSkinnedMesh} 
      ref={skinnedMeshRef} 
      position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
    />
  </group>
  )
}

export const Book = ({...props}) => {
  const [page] = useAtom(pageAtom);
  return (
  <group {...props}>
    {[...pages].map((pageData, index) => (
      <Page 
        key={index} 
        page={page}
        number={index} 
        {...pageData}
      />
    ))}
  </group>
  )
}