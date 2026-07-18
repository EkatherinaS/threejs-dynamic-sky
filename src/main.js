import "./style.css";

import { OrbitControls } from "three/examples/jsm/Addons.js";
import * as THREE from "three/webgpu";
import { Pane } from "tweakpane";
import {
	HEIGHT,
	WIDTH,
	NEVG,
	THETA,
	PHI,
	updateNevg,
	testCube,
} from "./constants";
import {
	computeIrradianceCubemapFromLightBuffer,
	computeLightBuffer,
	getIrradianceColor,
	getIrradianceTexture,
} from "./irradiance-texture.js";
import {
	computeLuminanceCubemap,
	computeLuminanceTexture,
	getLuminanceColor,
	getLuminanceCubemap,
} from "./luminance-texture.js";
import { Skydome } from "./skydome.js";
import { updatePhi, updateTheta } from "./constants.js";
import { loadModel } from "./models.js";

// WEBGPU SETTINGS

const adapter = await navigator.gpu.requestAdapter();
if (adapter) console.log(adapter.limits);

const canvas = document.querySelector("#canvas");

const renderer = new THREE.WebGPURenderer({
	canvas,
	trackTimestamp: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(render);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
document.body.appendChild(renderer.domElement);

// SCENE SETTINGS

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera();
camera.fov = 60;
camera.aspect = window.innerWidth / window.innerHeight;
camera.near = 0.01;
camera.far = 256;
camera.position.set(100, 10, 90);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.target.set(0, 0, 0);

// COMPUTE SECTION

let updateComputeTexture = computeLuminanceTexture(NEVG, THETA, PHI).compute(
	WIDTH * HEIGHT,
);
let updateComputeCubemap = computeLuminanceCubemap(NEVG, THETA, PHI).compute(
	12 * WIDTH * HEIGHT,
);
let updateLightBuffer = computeLightBuffer().compute(12 * WIDTH * HEIGHT);
let updateIrradianceCubemap = computeIrradianceCubemapFromLightBuffer().compute(
	12 * WIDTH * HEIGHT,
);

// SKYDOME
const skydomeMesh = new Skydome(THETA, PHI, NEVG, 0x006eff, 0x262222);
skydomeMesh.setScene(scene);

// COMPUTE SHADER

function updateComputeSkydom() {
	renderer.compute(updateComputeTexture);
	renderer.compute(updateComputeCubemap);
	renderer.compute(updateLightBuffer);
	renderer.compute(updateIrradianceCubemap);
}

// RENDER

function render() {
	const pixelRatio = renderer.getPixelRatio();
	const width = window.innerWidth;
	const height = window.innerHeight;
	const needResize =
		renderer.domElement.width != Math.floor(width * pixelRatio) ||
		renderer.domElement.height != Math.floor(height * pixelRatio);

	if (needResize) {
		renderer.setSize(width, height);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		meshLuminance.position.set(-camera.aspect * 0.005, -0.0005, -0.011);
		meshIrradiance.position.set(-camera.aspect * 0.005, -0.004, -0.011);
		plane.position.set(-camera.aspect * 0.005, 0.0035, -0.011);
	}

	controls.update();

	renderer.render(scene, camera);
	renderer.resolveTimestampsAsync(THREE.TimestampQuery.RENDER);
}

scene.add(camera);

// DEBUG SECTION
const materialLuminance = new THREE.MeshBasicNodeMaterial({
	color: 0x00ff00,
});
const geometryLuminance = new THREE.PlaneGeometry(0.004, 0.003);
const meshLuminance = new THREE.Mesh(geometryLuminance, materialLuminance);
meshLuminance.position.set(-camera.aspect * 0.005, -0.0005, -0.011);
camera.add(meshLuminance);

const materialIrradiance = new THREE.MeshBasicNodeMaterial({
	color: 0x00ff00,
});
const geometryIrradiance = new THREE.PlaneGeometry(0.004, 0.003);
const meshIrradiance = new THREE.Mesh(geometryIrradiance, materialIrradiance);
meshIrradiance.position.set(-camera.aspect * 0.005, -0.004, -0.011);
camera.add(meshIrradiance);

await renderer.init();
updateComputeSkydom();

materialLuminance.colorNode = getLuminanceCubemap();
materialIrradiance.colorNode = getIrradianceTexture();
loadModel(scene);

// SETTINGS

const PARAMS = {
	skydomskycolor: 0x006eff,
	skydomgroundcolor: 0x262222,
	THETA: 0.65,
	PHI: 1.1,
	NEVG: 0.75,
};

const pane = new Pane({
	title: "Settings",
	expanded: true,
});

pane
	.addBinding(PARAMS, "skydomskycolor", {
		label: "sky color",
		view: "color",
	})
	.on("change", (ev) => {
		if (!ev.last) return;
		skydomeMesh.setSkyColor(ev.value);
	});

pane
	.addBinding(PARAMS, "skydomgroundcolor", {
		label: "ground color",
		view: "color",
	})
	.on("change", (ev) => {
		if (!ev.last) return;
		skydomeMesh.setGroundColor(ev.value);
	});

pane
	.addBinding(PARAMS, "NEVG", {
		label: "Nevg",
		min: 0.2,
		max: 1,
		step: 0.01,
	})
	.on("change", (ev) => {
		if (!ev.last) return;

		updateNevg(ev.value);
		skydomeMesh.setNevg(NEVG);

		updateComputeTexture.dispose();
		updateComputeTexture = computeLuminanceTexture(NEVG, SUN_DIR).compute(
			WIDTH * HEIGHT,
		);

		updateComputeCubemap.dispose();
		updateComputeCubemap = computeLuminanceCubemap(NEVG, SUN_DIR).compute(
			12 * WIDTH * HEIGHT,
		);

		updateComputeSkydom();
	});

pane
	.addBinding(PARAMS, "THETA", {
		label: "Theta",
		min: 0,
		max: Math.PI / 2,
		step: 0.01,
	})
	.on("change", (ev) => {
		if (!ev.last) return;

		updateTheta(ev.value);
		skydomeMesh.setTheta(THETA);

		updateComputeTexture.dispose();
		updateComputeTexture = computeLuminanceTexture(NEVG, THETA, PHI).compute(
			WIDTH * HEIGHT,
		);

		updateComputeCubemap.dispose();
		updateComputeCubemap = computeLuminanceCubemap(NEVG, THETA, PHI).compute(
			12 * WIDTH * HEIGHT,
		);

		updateComputeSkydom();
	});

pane
	.addBinding(PARAMS, "PHI", {
		label: "Phi",
		min: 0,
		max: 2 * Math.PI,
		step: 0.01,
	})
	.on("change", (ev) => {
		if (!ev.last) return;

		updatePhi(ev.value);
		skydomeMesh.setPhi(PHI);

		updateComputeTexture.dispose();
		updateComputeTexture = computeLuminanceTexture(NEVG, THETA, PHI).compute(
			WIDTH * HEIGHT,
		);

		updateComputeCubemap.dispose();
		updateComputeCubemap = computeLuminanceCubemap(NEVG, THETA, PHI).compute(
			12 * WIDTH * HEIGHT,
		);

		updateComputeSkydom();
	});
