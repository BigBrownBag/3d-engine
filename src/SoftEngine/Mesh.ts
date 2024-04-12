import { Vector3 } from '@babylonjs/core';

export interface Face {
    a: number;
    b: number;
    c: number;
}

export default class Mesh {
    public position: Vector3;
    public rotation: Vector3;
    public vertices: Vector3[];
    public faces: Face[];
    public name: string;

    constructor(name: string, verticesCount: number, facesCount: number) {
        this.name = name;
        this.faces = new Array(facesCount);
        this.vertices = new Array(verticesCount);
        this.rotation = Vector3.Zero();
        this.position = Vector3.Zero();
    }
}