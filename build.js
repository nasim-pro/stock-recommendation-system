import esbuild from "esbuild";

esbuild.build({
    entryPoints: ["main-driver.js"],   // your entry point
    bundle: true,                // bundle all dependencies
    platform: "node",            // target Node.js
    target: ["node20"],          // node version
    outfile: "dist/bundle.js",   // output file
    format: "esm",               // keep ESM syntax
    sourcemap: true,             // optional: for debugging
    external: ["some-native-module-if-needed"], // leave native modules unbundled
})
    .then(() => {
        console.log("Build completed!");
    })
    .catch(() => process.exit(1));
