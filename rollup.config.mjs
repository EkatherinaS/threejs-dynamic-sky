import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import copy from "rollup-plugin-copy";
import postcss from "rollup-plugin-postcss";
import resolve from "@rollup/plugin-node-resolve";

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
		serve({
			open: true,
			contentBase: "dist",
		}),
		livereload({
			watch: "dist",
		}),
	],
};
