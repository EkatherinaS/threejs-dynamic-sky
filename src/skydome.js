import * as THREE from "three/webgpu";
import { getSkyLuminance } from "./luminance-equation";
import {
	abs,
	color,
	cos,
	float,
	positionLocal,
	sin,
	uniform,
	vec3,
	vec4,
	smoothstep,
	positionWorld,
	mix,
	clamp,
} from "three/tsl";

// https://publications.ibpsa.org/proceedings/bs/1999/papers/bs1999_PB-01.pdf

export class Skydome {
	constructor(theta, phi, nevg, skyColor, groundColor) {
		this.nevg = uniform(float(nevg));
		this.theta = uniform(float(theta));
		this.phi = uniform(float(phi));

		this.skyColor = uniform(vec3(1, 1, 1));
		this.setSkyColor(skyColor);

		this.groundColor = uniform(vec3(0, 0, 0));
		this.setGroundColor(groundColor);
	}

	ColorNode() {
		const pos = vec3(positionLocal.x, abs(positionLocal.y), positionLocal.z);
		const lva = getSkyLuminance(pos, this.theta, this.phi, this.nevg);

		const white = color(1, 1, 1, 1);
		const skyColor = this.skyColor.add(
			white.mul(float(lva).mul(float(0.0001))),
		);
		const groundColor = this.groundColor;

		const factor = clamp(positionWorld.y.mul(10).add(1));
		const result = mix(groundColor, skyColor, factor);
		return vec4(result, float(1.0));
	}

	setScene(scene) {
		this.scene = scene;
		this.scene.backgroundNode = this.ColorNode();
	}

	setSkyColor(color) {
		const temp = new THREE.Color(color);
		this.skyColor.value.set(temp.r, temp.g, temp.b);
	}

	setGroundColor(color) {
		const temp = new THREE.Color(color);
		this.groundColor.value.set(temp.r, temp.g, temp.b);
	}

	setNevg(nevg) {
		this.nevg.value = nevg;
	}

	setTheta(theta) {
		this.theta.value = theta;
	}

	setPhi(phi) {
		this.phi.value = phi;
	}
}
