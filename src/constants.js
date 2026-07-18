import * as THREE from "three/webgpu";

export const WIDTH = 32;
export const HEIGHT = 32;

export let THETA = 1.3;
export let PHI = 1.1;
export let NEVG = 0.85;

export function updateNevg(value) {
	NEVG = value;
}

export function updateTheta(value) {
	THETA = value;
}

export function updatePhi(value) {
	PHI = value;
}

export const luminanceStorageTexture = new THREE.StorageTexture(WIDTH, HEIGHT);
export const luminanceStorageCubemap = new THREE.StorageTexture(
	4 * WIDTH,
	3 * HEIGHT,
);
export const irradianceStorageCubemap = new THREE.StorageTexture(
	4 * WIDTH,
	3 * HEIGHT,
);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({
	color: 0xff0000,
});
export const testCube = new THREE.Mesh(geometry, material);
