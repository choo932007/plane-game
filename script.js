let scene,
  camera,
  renderer,
  plane,
  planeBody,
  wings,
  tunnel,
  obstacles = [];
let gameOver = false;
let planeSpeed = 0.5;
let obstacleSpeed = 0.2;
let score = 0;
let topScore = 0;
let interval;
let scoreElement;

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.setClearColor(0x000000);

  // Create the plane body
  let bodyGeometry = new THREE.BoxGeometry(1, 0.5, 1);
  let bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow color
  planeBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
  planeBody.rotation.x = Math.PI / 2;

  // Create the plane wings
  let wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.5);
  let wingMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow color
  let leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
  leftWing.position.set(-1, 0, 0);
  let rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
  rightWing.position.set(1, 0, 0);

  // Combine body and wings into one group
  plane = new THREE.Group();
  plane.add(planeBody);
  plane.add(leftWing);
  plane.add(rightWing);
  plane.position.z = 0; // Start plane inside the tunnel
  scene.add(plane);

  // Create the tunnel with gradient
  let tunnelGeometry = new THREE.CylinderGeometry(10, 10, 200, 32, 1, true);
  let tunnelMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color1: { value: new THREE.Color(0x87ceeb) },
      color2: { value: new THREE.Color(0x000000) },
    },
    vertexShader: `
            varying vec3 vUv; 
            void main() {
                vUv = position; 
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
    fragmentShader: `
            uniform vec3 color1;
            uniform vec3 color2;
            varying vec3 vUv;
            void main() {
                float mixRatio = (vUv.z + 100.0) / 200.0;  // Adjust based on tunnel length
                gl_FragColor = vec4(mix(color1, color2, mixRatio), 1.0);
            }
        `,
    side: THREE.BackSide,
  });
  tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
  tunnel.rotation.z = Math.PI / 2;
  scene.add(tunnel);

  scoreElement = document.createElement("div");
  scoreElement.style.position = "absolute";
  scoreElement.style.top = "10px";
  scoreElement.style.left = "10px";
  scoreElement.style.color = "white";
  scoreElement.style.fontSize = "20px";
  scoreElement.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  scoreElement.style.padding = "5px";
  document.body.appendChild(scoreElement);

  document.addEventListener("keydown", onDocumentKeyDown, false);
  document.addEventListener("keyup", onDocumentKeyUp, false);

  for (let i = 0; i < 20; i++) {
    createDynamicObstacle();
  }

  animate();
}

function createDynamicObstacle() {
  let geometry = new THREE.BoxGeometry(1, 5, 1); // Taller rectangular obstacles
  let material = new THREE.MeshBasicMaterial({ color: 0x000000 });
  let obstacle = new THREE.Mesh(geometry, material);
  obstacle.position.x = Math.random() * 20 - 10;
  obstacle.position.y = Math.random() * 20 - 10;
  obstacle.position.z = Math.random() * -200;

  let rotateDirection = Math.random() < 0.5 ? 1 : -1; // Randomly choose direction to rotate
  obstacle.rotation.z = (rotateDirection * Math.PI) / 4; // Rotate to create crossing obstacles
  obstacles.push(obstacle);
  scene.add(obstacle);
}

function detectCollision() {
  for (let obstacle of obstacles) {
    let box1 = new THREE.Box3().setFromObject(plane);
    let box2 = new THREE.Box3().setFromObject(obstacle);
    if (box1.intersectsBox(box2)) {
      gameOver = true;
      clearInterval(interval);
      updateGameOverScreen();
      return;
    }
  }
}

function onDocumentKeyDown(event) {
  let keyCode = event.which;
  if (plane) {
    if (keyCode === 87) {
      // W
      if (plane.position.y + planeSpeed < 10)
        // Limit the plane's top boundary inside the tunnel
        plane.position.y += planeSpeed;
    } else if (keyCode === 83) {
      // S
      if (plane.position.y - planeSpeed > -10)
        // Limit the plane's bottom boundary inside the tunnel
        plane.position.y -= planeSpeed;
    } else if (keyCode === 65) {
      // A
      if (plane.position.x - planeSpeed > -10)
        // Limit the plane's left boundary inside the tunnel
        plane.position.x -= planeSpeed;
      plane.rotation.z = Math.PI / 8; // Smooth tilt left
    } else if (keyCode === 68) {
      // D
      if (plane.position.x + planeSpeed < 10)
        // Limit the plane's right boundary inside the tunnel
        plane.position.x += planeSpeed;
      plane.rotation.z = -Math.PI / 8; // Smooth tilt right
    }
  }
}

function onDocumentKeyUp(event) {
  if (plane) {
    let keyCode = event.which;
    if (keyCode === 65 || keyCode === 68) {
      plane.rotation.z = 0; // Level plane when key is released
    }
  }
}

function animate() {
  if (gameOver) return;
  requestAnimationFrame(animate);

  score += obstacleSpeed * 10;
  scoreElement.innerText = `Score: ${Math.floor(score)}`;

  for (let obstacle of obstacles) {
    obstacle.position.z += obstacleSpeed;

    if (obstacle.position.z > camera.position.z) {
      obstacle.position.z = Math.random() * -200;
      obstacle.position.x = Math.random() * 20 - 10;
      obstacle.position.y = Math.random() * 20 - 10;
    }
  }

  detectCollision(); // Check for collisions

  renderer.render(scene, camera);
}

function updateGameOverScreen() {
  document.getElementById("gameOver").style.display = "flex";
  document.getElementById(
    "currentScore"
  ).innerText = `Current Score: ${Math.floor(score)}`;
  topScore = Math.max(score, topScore);
  document.getElementById("topScore").innerText = `Top Score: ${Math.floor(
    topScore
  )}`;
}

function startGame() {
  score = 0;
  gameOver = false;
  obstacles.forEach((obstacle) => scene.remove(obstacle));
  obstacles = [];
  for (let i = 0; i < 20; i++) {
    createDynamicObstacle();
  }
  if (!scene) init();
  else animate();
  interval = setInterval(() => {
    if (!gameOver) score += obstacleSpeed * 10;
  }, 1000);
}

document.getElementById("startButton").addEventListener("click", function () {
  document.getElementById("startPage").style.display = "none";
  init();
  startGame();
});

document.getElementById("restartButton").addEventListener("click", function () {
  document.getElementById("gameOver").style.display = "none";
  startGame();
});
