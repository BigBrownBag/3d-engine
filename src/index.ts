import { Vector3 } from "@babylonjs/core";
import Mesh, { type Face } from "./SoftEngine/Mesh";
import Device from "./SoftEngine/Device";
import Camera from "./SoftEngine/Camera";

let canvas: HTMLCanvasElement;
let device: Device;
let mesh: Mesh;
let meshes: Mesh[] = [];
let camera: Camera;

const VERTICES = 8;
const FACES = 12;

function fillCube(mesh: Mesh): void {
    const createVector = (x: number, y: number, z: number): Vector3 => new Vector3(x, y, z);
    const createFace = (a: number, b: number, c: number): Face => ({ a, b, c });
    
    const { vertices, faces } = mesh;
    
    vertices[0] = createVector(-1, 1, 1); 
    vertices[1] = createVector(1, 1, 1);
    vertices[2] = createVector(-1, -1, 1);
    vertices[3] = createVector(1, -1, 1);
    vertices[4] = createVector(-1, 1, -1);
    vertices[5] = createVector(1, 1, -1);
    vertices[6] = createVector(1, -1, -1);
    vertices[7] = createVector(-1, -1, -1);
    
    faces[0] = createFace(0, 1, 2);
    faces[1] = createFace(1, 2, 3);
    faces[2] = createFace(1, 3, 6);
    faces[3] = createFace(1, 5, 6);
    faces[4] = createFace(0, 1, 4);
    faces[5] = createFace(1, 4, 5);
    faces[6] = createFace(2, 3, 7);
    faces[7] = createFace(3, 6, 7);
    faces[8] = createFace(0, 2, 7);
    faces[9] = createFace(0, 4, 7);
    faces[10] = createFace(4, 5, 6);
    faces[11] = createFace(4, 6, 7);
}

function createCanvasStyles(canvas: HTMLCanvasElement): void {
    canvas.style.width = "100%";
    canvas.style.minHeight = "750px";
    canvas.style.height = "100%";
    canvas.style.backgroundColor = "black";
}

function drawingIteration(): void {
    device.clear();

    // rotating slightly the cube during each frame rendered
    mesh.rotation.x += 0.015;
    mesh.rotation.y += 0.015;
    
    // Doing the various matrix operations
    device.render(camera, meshes);
    // Flushing the back buffer into the front buffer
    device.present();

    // Calling rendering loop recursively
    requestAnimationFrame(drawingIteration);
}

function render(): void {
    canvas = document.getElementById("root") as HTMLCanvasElement;
    createCanvasStyles(canvas);
    mesh = new Mesh("Cube", VERTICES, FACES);
    meshes.push(mesh);
    camera = new Camera();
    device = new Device(canvas);
    
    fillCube(mesh);
    
    camera.position = new Vector3(0, 0, 20);
    camera.target = new Vector3(0, 0, 0);

    // Calling rendering loop
    requestAnimationFrame(drawingIteration);
}

document.addEventListener("DOMContentLoaded", render);
