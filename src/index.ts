import { Vector3 } from "@babylonjs/core";
import Mesh from "./SoftEngine/Mesh";
import Device from "./SoftEngine/Device";
import Camera from "./SoftEngine/Camera";

let canvas: HTMLCanvasElement;
let device: Device;
let meshes: Mesh[] = [];
let camera: Camera;

function createCanvasStyles(canvas: HTMLCanvasElement): void {
    canvas.style.width = "100%";
    canvas.style.minHeight = "750px";
    canvas.style.height = "100%";
    canvas.style.backgroundColor = "black";
}

function drawingIteration(): void {
    device.clear();

    for (let mesh of meshes) {
        mesh.rotation.x += 0.015;
        mesh.rotation.y += 0.015;
    }    
    
    // Doing the various matrix operations
    device.render(camera, meshes);
    // Flushing the back buffer into the front buffer
    device.present();

    // Calling rendering loop recursively
    requestAnimationFrame(drawingIteration);
}

function onload(data: Mesh[]): void {
    meshes = data;
    requestAnimationFrame(drawingIteration);
}

function render(): void {
    canvas = document.getElementById("root") as HTMLCanvasElement;
    createCanvasStyles(canvas);
    camera = new Camera();
    device = new Device(canvas);
    
    camera.position = new Vector3(0, 0, 7);
    camera.target = new Vector3(0, 0, 0);

    device.uploadFile("./monkey.babylon", onload);
}

document.addEventListener("DOMContentLoaded", render);
