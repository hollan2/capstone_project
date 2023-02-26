import React from "react";
import * as RK from "react-konva";
import useImage from "use-image";
import Konva from "konva";
import { Image } from "react-konva";

export enum Hat {
    None,
    Bow,
    Cap,
    Party,
    Sun,
    Winter,
    Propeller,
}

export enum Face {
    Chill,
    Glasses,
    Joy,
    Shifty,
    Smiley,
    U_U,
    owo,
}

export type RGB = { red: number; green: number; blue: number };

export function GeneratePawn(hat: Hat, face: Face, ideology: RGB): JSX.Element {
    const hatName: string = Hat[hat];
    const hatImageLocation: string =
        `pawns/pawn-hat-${hatName}.png`.toLowerCase();
    const [hatImage] = useImage(hatImageLocation);

    const faceName: string = Face[face];
    const faceImageLocation: string =
        `pawns/pawn-face-${faceName}.png`.toLowerCase();
    const [faceImage] = useImage(faceImageLocation);

    const [baseImage] = useImage("pawns/pawn-base.png");

    return (
        <RK.Group>
            {FilterPawn(hatImage, ideology)}
            {FilterPawn(baseImage, ideology)}
            {FilterPawn(faceImage, ideology)}
        </RK.Group>
    );
}

const FilterPawn = (image: HTMLImageElement | undefined, color: RGB) => {
    const imageRef: React.RefObject<Konva.Image> = React.createRef();

    // when image is loaded we need to cache the shape
    React.useEffect(() => {
        if (image) {
            // you many need to reapply cache on some props changes like shadow, stroke, etc.
            if (imageRef.current) imageRef.current.cache();
        }
    }, [image, imageRef]);

    return (
        <Image
            ref={imageRef}
            x={10}
            y={10}
            image={image}
            filters={[Konva.Filters.RGBA]}
            red={color.red}
            green={color.green}
            blue={color.blue}
            alpha={0.8}
        />
    );
};
