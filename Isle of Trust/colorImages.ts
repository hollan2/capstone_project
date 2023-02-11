import { exec } from "child_process";
import { mkdir } from "fs";
import path from "path";

interface Image {
    path: string;
    name?: string;
    color: string;
    amount?: number;
}

interface ColorImageConfig {
    inDir: string;
    images: Image[];
}

export default function colorImages(config: ColorImageConfig) {
    let buildConfig;
    return {
        name: "color-images",
        configResolved(config) {
            buildConfig = config;
        },
        buildStart(options) {
            for (const image of config.images) {
                colorImage(image, config.inDir, buildConfig.build.outDir);
            }
        },
    };
}

function colorImage(image: Image, inDir: string, outDir: string) {
    const extension = path.extname(image.path);
    const outFilename = path.join(
        path.dirname(image.path),
        path.basename(image.path, extension) +
            "-" +
            (image.name ?? image.color) +
            extension
    );

    const inFile = path.join(inDir, image.path);
    const outFile = path.join(outDir, outFilename);

    let executable: string;
    if (process.platform === "win32") {
        executable = "magick convert";
    } else {
        executable = "convert";
    }

    mkdir(path.dirname(outFile), { recursive: true }, (err) => {
        if (err) throw err;
    });

    // quoting removed for Windows support
    const command = `${executable} -fill ${image.color} -colorize ${
        image.amount ?? 25
    } ${inFile} ${outFile}`;

    exec(command, (error, _, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
        }

        if (stderr) {
            console.log(`error: ${stderr}`);
        }
    });
}
