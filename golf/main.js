"use strict";

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger'

import { ARButton } from 'three/addons/webxr/ARButton.js';

import { InteractiveGroup } from 'three/addons/interactive/InteractiveGroup.js';
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';

let container;
let camera, scene, renderer;
let controller;

let reticle;
let cannonDebugger;
const cursor = new THREE.Vector3();


let hitTestSource = null;
let hitTestSourceRequested = false;

let count = 0;

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0)
});

const groundBody = new CANNON.Body({
  //mass: 10
  // side: DoubleSide,
  shape: new CANNON.Plane(),
  type: CANNON.Body.STATIC,
  material: new CANNON.Material()
});

groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

const groundGeo = new THREE.PlaneGeometry(1, 1);
const groundMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  // side: DoubleSide,
  // wireframe: true
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);


const sphereGeometry = new THREE.SphereGeometry(0.1);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

const sphereBody = new CANNON.Body({
  mass: 10,
  shape: new CANNON.Sphere(0.1),
  position: new CANNON.Vec3(0, 0.5, 0),
  material: new CANNON.Material()
});

sphereBody.linearDamping = 0.21;
sphereBody.angularDamping = 0.9;

const parameters = {
  radius: 0.6,
  tube: 0.2,
  tubularSegments: 150,
  radialSegments: 20,
  p: 2,
  q: 3,
  thickness: 0.5
};

const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const line = new THREE.Line(lineGeometry, lineMaterial);

let isMouseDownOnSphere = false;

init();
initCannonDebugger();
animate();

function init() {

  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  //

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  //

  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  //

  // const gui = new GUI({ width: 300 });

  // const group = new InteractiveGroup(renderer, camera);
  // scene.add(group);

  // const mesh = new HTMLMesh(gui.domElement);
  // mesh.position.x = - 0.75;
  // mesh.position.y = 1.5;
  // mesh.position.z = - 0.5;
  // mesh.rotation.y = Math.PI / 4;
  // mesh.scale.setScalar(2);
  // group.add(mesh);


  function onSelectStart() {

    count++;

    if (count < 3) {
      if (reticle.visible) {
        if (count == 1) {
          reticle.matrix.decompose(groundMesh.position, groundMesh.quaternion, groundMesh.scale);
          world.addBody(groundBody);
          scene.add(groundMesh);
        } else if (count == 2) {
          reticle.matrix.decompose(sphereMesh.position, sphereMesh.quaternion, sphereMesh.scale);
          scene.add(sphereMesh);
          world.addBody(sphereBody);
          scene.remove(reticle);
        }
      }
    } else {

      sphereMesh.material.color.set(0xff0000);
      this.userData.startPos = sphereMesh.position;

    }
  }

  function onSelectEnd() {
    if (count > 2) {
      const startPos = sphereMesh.position.clone();

      const endPos = controller.position.clone();

      const directionFinal = new THREE.Vector3().subVectors(startPos, endPos).normalize();

      sphereBody.applyImpulse(directionFinal.multiplyScalar(10), sphereBody.position);

      sphereMesh.material.color.set(0x0000ff);
    }
  }



  controller = renderer.xr.getController(0);
  controller.addEventListener('selectstart', onSelectStart);
  controller.addEventListener('selectend', onSelectEnd);
  scene.add(controller);

  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 32).rotateX(- Math.PI / 2),
    new THREE.MeshBasicMaterial()
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  //

  window.addEventListener('resize', onWindowResize);

}

function initCannonDebugger() {
  cannonDebugger = new CannonDebugger(scene, world, {
    onInit(body, mesh) {
    },
  })
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}


//

function animate() {

  renderer.setAnimationLoop(render);

}

world.fixedTimeStep = 1 / 120;

function render(timestamp, frame) {

  world.fixedStep();

  groundMesh.position.copy(groundBody.position);
  groundMesh.quaternion.copy(groundBody.quaternion);

  sphereMesh.position.copy(sphereBody.position);
  sphereMesh.quaternion.copy(sphereBody.quaternion);


  if (frame) {

    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (hitTestSourceRequested === false) {

      session.requestReferenceSpace('viewer').then(function (referenceSpace) {

        session.requestHitTestSource({ space: referenceSpace }).then(function (source) {

          hitTestSource = source;

        });

      });

      session.addEventListener('end', function () {

        hitTestSourceRequested = false;
        hitTestSource = null;

      });

      hitTestSourceRequested = true;

    }

    if (hitTestSource) {

      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length) {

        const hit = hitTestResults[0];

        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);

      } else {

        reticle.visible = false;

      }

    }

  }

  renderer.render(scene, camera);

}