import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import svgrPlugin from "vite-plugin-svgr";

import colorImages from "./colorImages";

import { exec } from "child_process";
import vitePluginRequire from "vite-plugin-require";

// https://vitejs.dev/config/
export default defineConfig({
    // This changes the out put dir from dist to build
    // comment this out if that isn't relevant for your project
    build: {
        outDir: "build",
    },
    plugins: [
        reactRefresh(),
        svgrPlugin({
            svgrOptions: {
                icon: true,
                // ...svgr options (https://react-svgr.com/docs/options/)
            },
        }),
        vitePluginRequire(),
        colorImages({
            inDir: "public",
            images: [
                {
                    path: "images/pawn.png",
                    color: "red",
                    amount: 35,
                },
                {
                    path: "images/pawn.png",
                    color: "orange",
                    amount: 45,
                },
                {
                    path: "images/pawn.png",
                    color: "green",
                },
                {
                    path: "images/pawn.png",
                    color: "blue",
                },
            ],
        }),
    ],
});
