import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import copy from "rollup-plugin-copy";
import postcss from "rollup-plugin-postcss";
import resolve from "@rollup/plugin-node-resolve";

const dev = process.env.ROLLUP_WATCH === "true";

export default {
	input: "src/main.js",
	output: {
		dir: "dist",
		format: "es",
		sourcemap: true,
	},
	plugins: [
		resolve(),
		postcss({
			extract: "style.css",
		}),
		copy({
			targets: [
				{ src: "index.html", dest: "dist" },
				{ src: "public/**/*", dest: "dist/public" },
			],
		}),
		dev &&
			serve({
				open: true,
				contentBase: "dist",
			}),
		dev &&
			livereload({
				watch: "dist",
			}),
	],
};
