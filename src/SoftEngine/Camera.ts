import { Vector3 } from '@babylonjs/core';

export default class Camera {
    public position: Vector3;
    public target: Vector3;

    constructor() {
        this.position = Vector3.Zero();
        this.target = Vector3.Zero();
    }
}