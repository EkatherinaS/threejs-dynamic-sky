import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { Fn, materialColor, vec3, vec4 } from "three/tsl";
import { getIrradianceColor } from "./irradiance-texture.js";

const loader = new GLTFLoader();
let model;
let helpers = [];

const CLOCK = "public/astronomical_monstrance_clock.glb";

export function loadModel(scene) {
	loader.load(
		CLOCK,
		(gltf) => {
			model = gltf.scene;
			model.traverse((o) => {
				if (o.isMesh) o.material.outputNode = computeGlobalLight();
			});
			scene.add(model);
		},
		undefined,
		(error) => {
			console.error(error);
		},
	);
}

const computeGlobalLight = Fn(() => {
	const irradiance = getIrradianceColor();
	return vec4(vec3(irradiance), 1.0);
});
