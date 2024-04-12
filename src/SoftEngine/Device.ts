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
    private project(coord: Vector3, transMat: Matrix): Vector2 {
        // transforming the coordinates
        const point = Vector3.TransformCoordinates(coord, transMat);
        // The transformed coordinates will be based on coordinate system
        // starting on the center of the screen. But drawing on screen normally starts
        // from top left. We then need to transform them again to have x:0, y:0 on top left.
        const x = point.x * this.workingWidth + this.workingWidth / 2.0 >> 0;
        const y = -point.y * this.workingHeight + this.workingHeight / 2.0 >> 0;
        return (new Vector2(x, y));
    }

    // drawPoint calls putPixel but does the clipping operation before
    private drawPoint(point: Vector2): void {
        // Clipping what's visible on screen
        if (point.x >= 0 && point.y >= 0 && point.x < this.workingWidth && point.y < this.workingHeight) {
            // Drawing a red point
            this.putPixel(point.x, point.y, new Color4(1, 0, 0, 1));
        }
    }

    //  Bresenham’s line algorithm implementation
    private drawLine(firstPoint: Vector2, secondPoint: Vector2): void {
        let x0 = firstPoint.x >> 0;
        let y0 = firstPoint.y >> 0;
        const x1 = secondPoint.x >> 0;
        const y1 = secondPoint.y >> 0;
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
            this.drawPoint(new Vector2(x0, y0));

            if ((x0 == x1) && (y0 == y1)) break;
            let e2 = 2 * err;
            if (e2 > -dy) err -= dy, x0 += sx;
            if (e2 < dx) err += dx, y0 += sy;
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

                this.drawLine(pixelA, pixelB);
                this.drawLine(pixelB, pixelC);
                this.drawLine(pixelC, pixelA);
            }
        }
    }
}