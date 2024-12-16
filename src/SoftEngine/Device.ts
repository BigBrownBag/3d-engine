import { Color4, Vector3, Matrix, Vector2 } from "@babylonjs/core";
import Mesh from "./Mesh";
import Camera from "./Camera";
export default class Device {
    private backBuffer: ImageData;
    private workingCanvas: HTMLCanvasElement;
    private workingContext: CanvasRenderingContext2D;
    private workingWidth: number;
    private workingHeight: number;
    private backBufferData: ImageData["data"];

    constructor(canvas: HTMLCanvasElement) {
        this.workingCanvas = canvas;
        this.workingWidth = canvas.width;
        this.workingHeight = canvas.height;
        this.workingContext = this.workingCanvas.getContext("2d", { willReadFrequently: true })!;
    }

    // This function is called to clear the back buffer with a specific color
    public clear(): void {
        // Clearing with black color by default
        this.workingContext.clearRect(0, 0, this.workingWidth, this.workingHeight);
        // once cleared with black pixels, we're getting back the associated image data to 
        // clear out back buffer
        this.backBuffer = this.workingContext.getImageData(0, 0, this.workingWidth, this.workingHeight);
    }

    // Once everything is ready, we can flush the back buffer
    // into the front buffer. 
    public present(): void {
        this.workingContext.putImageData(this.backBuffer, 0, 0);
    }

    private putPixel(x: number, y: number, color: Color4): void {
        this.backBufferData = this.backBuffer.data;
        // As we have a 1-D Array for our back buffer
        // we need to know the equivalent cell index in 1-D based
        // on the 2D coordinates of the screen
        const index: number = ((x >> 0) + (y >> 0) * this.workingWidth) * 4;



        // RGBA color space is used by the HTML5 canvas
        this.backBufferData[index] = color.r * 255;
        this.backBufferData[index + 1] = color.g * 255;
        this.backBufferData[index + 2] = color.b * 255;
        this.backBufferData[index + 3] = color.a * 255;
    }

    // Project takes some 3D coordinates and transform them
    // in 2D coordinates using the transformation matrix
    private project(coord: Vector3, transMat: Matrix): Vector3 {
        // transforming the coordinates
        const point = Vector3.TransformCoordinates(coord, transMat);
        // The transformed coordinates will be based on coordinate system
        // starting on the center of the screen. But drawing on screen normally starts
        // from top left. We then need to transform them again to have x:0, y:0 on top left.
        const x = point.x * this.workingWidth + this.workingWidth / 2.0;
        const y = -point.y * this.workingHeight + this.workingHeight / 2.0;
        return new Vector3(x, y, point.z);
    }

    // drawPoint calls putPixel but does the clipping operation before
    private drawPoint(point: Vector2, color: Color4): void {
        // Clipping what's visible on screen
        if (point.x >= 0 && point.y >= 0 && point.x < this.workingWidth && point.y < this.workingHeight) {
            // Drawing a red point
            this.putPixel(point.x, point.y, color);
        }
    }

    // Clamping values to keep them between 0 and 1
    private clamp(value: number, min: number = 0, max: number = 1): number {
        return Math.max(min, Math.min(value, max));
    }

    // Interpolating the value between 2 vertices 
    // min is the starting point, max the ending point
    // and gradient the % between the 2 points
    private interpolate(min: number, max: number, gradient: number) {
        return min + (max - min) * this.clamp(gradient);
    }

    // drawing line between 2 points from left to right
    // papb -> pcpd
    // pa, pb, pc, pd must then be sorted before
    private processScanLine(y: number, pa: Vector3, pb: Vector3, pc: Vector3, pd: Vector3, color: Color4): void {
        // Thanks to current Y, we can compute the gradient to compute others values like
        // the starting X (sx) and ending X (ex) to draw between
        // if pa.Y == pb.Y or pc.Y == pd.Y, gradient is forced to 1
        var gradient1 = pa.y != pb.y ? (y - pa.y) / (pb.y - pa.y) : 1;
        var gradient2 = pc.y != pd.y ? (y - pc.y) / (pd.y - pc.y) : 1;

        var sx = this.interpolate(pa.x, pb.x, gradient1) >> 0;
        var ex = this.interpolate(pc.x, pd.x, gradient2) >> 0;

        // drawing a line from left (sx) to right (ex) 
        for (var x = sx; x < ex; x++) {
            this.drawPoint(new Vector2(x, y), color);
        }
    }

    private drawTriangle(p1: Vector3, p2: Vector3, p3: Vector3, color: Color4): void {
        // Sorting the points in order to always have this order on screen p1, p2 & p3
        // with p1 always up (thus having the Y the lowest possible to be near the top screen)
        // then p2 between p1 & p3
        if (p1.y > p2.y) {
            var temp = p2;
            p2 = p1;
            p1 = temp;
        }

        if (p2.y > p3.y) {
            var temp = p2;
            p2 = p3;
            p3 = temp;
        }

        if (p1.y > p2.y) {
            var temp = p2;
            p2 = p1;
            p1 = temp;
        }

        // inverse slopes
        var dP1P2: number; var dP1P3: number;

        // http://en.wikipedia.org/wiki/Slope
        // Computing slopes
        if (p2.y - p1.y > 0)
            dP1P2 = (p2.x - p1.x) / (p2.y - p1.y);
        else
            dP1P2 = 0;

        if (p3.y - p1.y > 0)
            dP1P3 = (p3.x - p1.x) / (p3.y - p1.y);
        else
            dP1P3 = 0;

        // First case where triangles are like that:
        // P1
        // -
        // -- 
        // - -
        // -  -
        // -   - P2
        // -  -
        // - -
        // -
        // P3
        if (dP1P2 > dP1P3) {
            for (var y = p1.y >> 0; y <= p3.y >> 0; y++)
            {
                if (y < p2.y) {
                    this.processScanLine(y, p1, p3, p1, p2, color);
                }
                else {
                    this.processScanLine(y, p1, p3, p2, p3, color);
                }
            }
        }
        // First case where triangles are like that:
        //       P1
        //        -
        //       -- 
        //      - -
        //     -  -
        // P2 -   - 
        //     -  -
        //      - -
        //        -
        //       P3
        else {
            for (var y = p1.y >> 0; y <= p3.y >> 0; y++)
            {
                if (y < p2.y) {
                    this.processScanLine(y, p1, p2, p1, p3, color);
                }
                else {
                    this.processScanLine(y, p2, p3, p1, p3, color);
                }
            }
        }
    }

    // The main method of the engine that re-compute each vertex projection
    // during each frame
    public render(camera: Camera, meshes: Mesh[]): void {
        const viewMatrix = Matrix.LookAtLH(camera.position, camera.target, Vector3.Up());
        const projectionMatrix = Matrix.PerspectiveFovLH(0.78, this.workingWidth / this.workingHeight, 0.01, 1.0);

        for (let index in meshes) {
            // current mesh to work on
            const currentMesh = meshes[index];
            // Beware to apply rotation before translation, then transform
            const worldMatrix = Matrix.RotationYawPitchRoll(
                currentMesh.rotation.y, currentMesh.rotation.x, currentMesh.rotation.z
            );
            const translationMatrix = worldMatrix.multiply(Matrix.Translation(
                currentMesh.position.x, currentMesh.position.y, currentMesh.position.z
            ));
            const transformMatrix = translationMatrix.multiply(viewMatrix).multiply(projectionMatrix);

            for (let i in currentMesh.faces) {
                const currentFace = currentMesh.faces[i];
                const vertexA = currentMesh.vertices[currentFace.a];
                const vertexB = currentMesh.vertices[currentFace.b];
                const vertexC = currentMesh.vertices[currentFace.c];

                const pixelA = this.project(vertexA, transformMatrix);
                const pixelB = this.project(vertexB, transformMatrix);
                const pixelC = this.project(vertexC, transformMatrix);

                const color: number = 0.25 + ((+i % currentMesh.faces.length) / currentMesh.faces.length) * 0.75;
                this.drawTriangle(pixelA, pixelB, pixelC, new Color4(color, color, color, 1));
            }
        }
    }

    private createMeshesFromData(meshData: any): Mesh[] {
            const meshes: Mesh[] = [];
            for (let meshIndex = 0; meshIndex < meshData.meshes.length; meshIndex++) {
                const verticesArray: number[] = meshData.meshes[meshIndex].vertices;
                // Faces
                const indicesArray: number[] = meshData.meshes[meshIndex].indices;

                const uvCount: number = meshData.meshes[meshIndex].uvCount;
                let verticesStep = 1;

                // Depending of the number of texture's coordinates per vertex
                // we're jumping in the vertices array  by 6, 8 & 10 windows frame
                switch (uvCount) {
                    case 0:
                        verticesStep = 6;
                        break;
                    case 1:
                        verticesStep = 8;
                        break;
                    case 2:
                        verticesStep = 10;
                        break;
                }

                // the number of interesting vertices information for us
                const verticesCount = verticesArray.length / verticesStep;
                // number of faces is logically the size of the array divided by 3 (A, B, C)
                const facesCount = indicesArray.length / 3;
                const mesh = new Mesh(meshData.meshes[meshIndex].name, verticesCount, facesCount);
                
                // Filling the Vertices array of our mesh first
                for (let index = 0; index < verticesCount; index++) {
                    const x = verticesArray[index * verticesStep];
                    const y = verticesArray[index * verticesStep + 1];
                    const z = verticesArray[index * verticesStep + 2];
                    mesh.vertices[index] = new Vector3(x, y, z);
                }
                
                // Then filling the Faces array
                for (let index = 0; index < facesCount; index++) {
                    const a = indicesArray[index * 3];
                    const b = indicesArray[index * 3 + 1];
                    const c = indicesArray[index * 3 + 2];
                    mesh.faces[index] = { a, b, c };
                }
                
                // Getting the position you've set in Blender
                const position = meshData.meshes[meshIndex].position;
                mesh.position = new Vector3(position[0], position[1], position[2]);
                meshes.push(mesh);
            }
            return meshes;
        }

    public uploadFile(fileName: string, callback: (result: Mesh[]) => void): void {
        const connect = new XMLHttpRequest();
        connect.overrideMimeType("application/babylon");
        connect.onreadystatechange = () => {
            if (connect.readyState == 4 && connect.status == 200) {
                const meshData = JSON.parse(connect.responseText);
                callback(this.createMeshesFromData(meshData));
            }
        };
        connect.open("GET", fileName);
        connect.send(null);
    }
}