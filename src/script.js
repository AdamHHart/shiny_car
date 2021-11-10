import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { Raycaster } from "three";
import { gsap } from "gsap";

/**
 * Loaders
 */
let sceneReady = false;
const loadingBarElement = document.querySelector(".loading-bar");
const loadingManager = new THREE.LoadingManager(
  // Loaded
  () => {
    // Wait a little
    window.setTimeout(() => {
      // Animate overlay
      gsap.to(overlayMaterial.uniforms.uAlpha, {
        duration: 3,
        value: 0,
        delay: 1,
      });

      // Update loadingBarElement
      loadingBarElement.classList.add("ended");
      loadingBarElement.style.transform = "";
    }, 500);
    window.setTimeout(() => {
      sceneReady = true;
    }, 2000);
  },

  // Progress
  (itemUrl, itemsLoaded, itemsTotal) => {
    // Calculate the progress and update the loadingBarElement
    const progressRatio = itemsLoaded / itemsTotal;
    loadingBarElement.style.transform = `scaleX(${progressRatio})`;
  }
);
const gltfLoader = new GLTFLoader(loadingManager);
// const dracoLoader = new DRACOLoader(loadingManager);
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);

/**
 * Base
 */
// Debug
const debugObject = {};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({
  // wireframe: true,
  transparent: true,
  uniforms: {
    uAlpha: { value: 1 },
  },
  vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
  fragmentShader: `
        uniform float uAlpha;

        void main()
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `,
});
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      // child.material.envMap = environmentMap
      child.material.envMapIntensity = debugObject.envMapIntensity;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

/**
 * Environment map
 */

// Pano Fetch Chrome Extension
// https://chrome.google.com/webstore/detail/pano-fetch/ggmfokbjchlhboclfngkneflhkopebbh/related?hl=en

// Panorama to Cubemap App
// https://jaxry.github.io/panorama-to-cubemap/

// Favourite Google StreetView Links
// https://www.google.com/maps/@40.8285461,14.2173696,3a,75y,73.16h,69.11t/data=!3m6!1e1!3m4!1sbxy_7mAF57A70AyE7cPwPQ!2e0!7i16384!8i8192

const environmentMap = cubeTextureLoader.load([
  "/textures/environmentMaps/3/px.jpg",
  "/textures/environmentMaps/3/nx.jpg",
  "/textures/environmentMaps/3/py.jpg",
  "/textures/environmentMaps/3/ny.jpg",
  "/textures/environmentMaps/3/pz.jpg",
  "/textures/environmentMaps/3/nz.jpg",
]);

environmentMap.encoding = THREE.sRGBEncoding;

// const cubeMapMaterial = new THREE.MeshStandardMaterial();
// cubeMapMaterial.map = environmentMap;
// const cubeMap = new THREE.Mesh(
//   new THREE.BoxBufferGeometry(5, 5, 5),
//   environmentMap
// );

scene.background = environmentMap;
scene.environment = environmentMap;

debugObject.envMapIntensity = 4;

// TEXTURES

loadingManager.onStart = () => {
  console.log("onload");
};
loadingManager.onLoader = () => {
  console.log("onprogress");
};
loadingManager.onError = () => {
  console.log("onerror");
};
const textureLoader = new THREE.TextureLoader(loadingManager);
const albedoTexture = textureLoader.load(
  "/textures/surfaces/cobble_albedo.png"
);
const heightTexture = textureLoader.load(
  "/textures/surfaces/cobble_height.png"
);
const normalTexture = textureLoader.load(
  "/textures/surfaces/cobble_normal.png"
);
const aoTexture = textureLoader.load("/textures/surfaces/cobble_ao.png");
const roughnessTexture = textureLoader.load(
  "/textures/surfaces/cobble_roughness.png"
);

// Texture Wrapping
albedoTexture.repeat.x = 1;
albedoTexture.repeat.y = 1;
albedoTexture.wrapS = THREE.RepeatWrapping;
albedoTexture.wrapT = THREE.RepeatWrapping;

// Floor Geometry
const geometry = new THREE.BoxBufferGeometry(8, 0.2, 8, 500, 1, 500);

// Would prefer a curved PlaneGeometry here
// const geometry = new THREE.SphereBufferGeometry(10, 1000, 1000);

const material = new THREE.MeshStandardMaterial({
  // wireframe: true,
  map: albedoTexture,
  aoMap: aoTexture,
  aoMapIntensity: 3,
  displacementMap: heightTexture,
  roughnessMap: roughnessTexture,
  normalMap: normalTexture,
});

// Material for mesh testing
// const material = new THREE.MeshStandardMaterial({ color: 0x010101 });

const floorObject = new THREE.Mesh(geometry, material);
floorObject.position.y = -1.03;
// floorObject.rotation.x = 90;

// FLOOR COBBLESTONE
scene.add(floorObject);

/**
 * Models
 */
gltfLoader.load("/models/DamagedHelmet/glTF/DamagedHelmet.gltf", (gltf) => {
  gltf.scene.scale.set(0.25, 0.25, 0.25);
  // gltf.scene.position.x = 3;
  gltf.scene.position.y = 1;
  // gltf.scene.position.z = -3;
  gltf.scene.rotation.y = Math.PI * 0.5;

  scene.add(gltf.scene);

  updateAllMaterials();
});

// Mercedes Object

// gltfLoader.load("/models/mercedes_non_compressed.glb", (gltf) => {
//   gltf.scene.scale.set(1, 1, 1);
//   // gltf.scene.position.x = 3;
//   gltf.scene.position.y = -0.42;
//   // gltf.scene.position.z = -3;
//   gltf.scene.rotation.y = Math.PI * 1;

//   scene.add(gltf.scene);

//   updateAllMaterials();
// });
// gltfLoader.load("/models/hangar.gltf", (gltf) => {
//   gltf.scene.scale.set(1, 1, 1);
//   // gltf.scene.position.x = 3;
//   gltf.scene.position.y = 0.2;
//   gltf.scene.position.x = 5;
//   // gltf.scene.position.z = -3;
//   gltf.scene.rotation.y = Math.PI * 1.5;

//   scene.add(gltf.scene);

//   updateAllMaterials();
// });

// Points of interest

const raycaster = new Raycaster();

const points = [
  {
    position: new THREE.Vector3(1.55, 0.3, -0.6),
    element: document.querySelector(".point-0"),
  },
  {
    position: new THREE.Vector3(0.5, 0.8, -1.6),
    element: document.querySelector(".point-1"),
  },
  {
    position: new THREE.Vector3(1.6, -1.3, -0.7),
    element: document.querySelector(".point-2"),
  },
];
console.log(points);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 1);
directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 3, -2.25);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(2.5, 1, -1);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  // antialias: true,
});
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 3;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.xr.enabled = true;
/**
 * Animate
 *
 *
 */

// VR Button
document.body.appendChild(VRButton.createButton(renderer));

/**
 * Animate
 */
const clock = new THREE.Clock();

renderer.setAnimationLoop(function () {
  renderer.render(scene, camera);
});

// const tick = () => {
//   // Update controls
//   controls.update();

//   if (sceneReady) {
//     //   Go through each point for html ref
//     for (const point of points) {
//       const screenPosition = point.position.clone();
//       screenPosition.project(camera);

//       raycaster.setFromCamera(screenPosition, camera);
//       const intersects = raycaster.intersectObjects(scene.children, true);
//       if (intersects.length === 0) {
//       } else {
//         const intersectionDistance = intersects[0].distance;
//         const pointDistance = point.position.distanceTo(camera.position);

//         if (intersectionDistance < pointDistance) {
//           point.element.classList.remove("visible");
//         } else {
//           point.element.classList.add("visible");
//         }
//       }

//       const translateX = screenPosition.x * sizes.width * 0.5;
//       const translateY = -screenPosition.y * sizes.height * 0.5;
//       point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
//     }
//   }
//   // Render
//   renderer.render(scene, camera);

//   // Call tick again on the next frame
//   window.requestAnimationFrame(tick);
// };

// tick();
