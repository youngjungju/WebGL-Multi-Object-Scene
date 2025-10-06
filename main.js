// Vertex shader program
const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;
    }
`;

// Fragment shader program
const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
        gl_FragColor = vColor;
    }
`;

// Global variables
let gl;
let shaderProgram;
let programInfo;
let buffers = {};
let animationEnabled = true;
let animationTime = 0;

// User control values
let userRotX = 0;
let userRotY = 0;
let userRotZ = 0;
let userScale = 1.0;
let userTransX = 0.0;
let userTransY = 0.0;

// Initialize WebGL
function initWebGL() {
    const canvas = document.getElementById('glCanvas');
    gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    initBuffers();
    setupControls();
    drawScene();
}

// Initialize shader program
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

// Load shader
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// Initialize buffers for multiple objects
function initBuffers() {
    // Cube
    buffers.cube = initCubeBuffer();

    // Pyramid
    buffers.pyramid = initPyramidBuffer();

    // Octahedron
    buffers.octahedron = initOctahedronBuffer();

    // Star (2D shape)
    buffers.star = initStarBuffer();
}

// Create cube buffer
function initCubeBuffer() {
    const positions = [
        // Front face
        -0.5, -0.5,  0.5,
         0.5, -0.5,  0.5,
         0.5,  0.5,  0.5,
        -0.5,  0.5,  0.5,

        // Back face
        -0.5, -0.5, -0.5,
        -0.5,  0.5, -0.5,
         0.5,  0.5, -0.5,
         0.5, -0.5, -0.5,

        // Top face
        -0.5,  0.5, -0.5,
        -0.5,  0.5,  0.5,
         0.5,  0.5,  0.5,
         0.5,  0.5, -0.5,

        // Bottom face
        -0.5, -0.5, -0.5,
         0.5, -0.5, -0.5,
         0.5, -0.5,  0.5,
        -0.5, -0.5,  0.5,

        // Right face
         0.5, -0.5, -0.5,
         0.5,  0.5, -0.5,
         0.5,  0.5,  0.5,
         0.5, -0.5,  0.5,

        // Left face
        -0.5, -0.5, -0.5,
        -0.5, -0.5,  0.5,
        -0.5,  0.5,  0.5,
        -0.5,  0.5, -0.5,
    ];

    const colors = [
        [1.0, 0.0, 0.0, 1.0], // Front - Red
        [0.0, 1.0, 0.0, 1.0], // Back - Green
        [0.0, 0.0, 1.0, 1.0], // Top - Blue
        [1.0, 1.0, 0.0, 1.0], // Bottom - Yellow
        [1.0, 0.0, 1.0, 1.0], // Right - Magenta
        [0.0, 1.0, 1.0, 1.0], // Left - Cyan
    ];

    let faceColors = [];
    for (let i = 0; i < colors.length; i++) {
        faceColors = faceColors.concat(colors[i], colors[i], colors[i], colors[i]);
    }

    const indices = [
        0,  1,  2,    0,  2,  3,  // front
        4,  5,  6,    4,  6,  7,  // back
        8,  9,  10,   8,  10, 11, // top
        12, 13, 14,   12, 14, 15, // bottom
        16, 17, 18,   16, 18, 19, // right
        20, 21, 22,   20, 22, 23, // left
    ];

    return {
        position: createBuffer(positions),
        color: createBuffer(faceColors),
        indices: createIndexBuffer(indices),
        vertexCount: indices.length,
    };
}

// Create pyramid buffer
function initPyramidBuffer() {
    const positions = [
        // Base
        -0.5, -0.5,  0.5,
         0.5, -0.5,  0.5,
         0.5, -0.5, -0.5,
        -0.5, -0.5, -0.5,

        // Apex
         0.0,  0.5,  0.0,
         0.0,  0.5,  0.0,
         0.0,  0.5,  0.0,
         0.0,  0.5,  0.0,
    ];

    const colors = [
        1.0, 1.0, 0.0, 1.0, // Yellow
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,

        1.0, 0.5, 0.0, 1.0, // Orange
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
        1.0, 0.5, 0.0, 1.0,
    ];

    const indices = [
        0, 1, 2,  0, 2, 3, // Base
        0, 1, 4, // Front
        1, 2, 5, // Right
        2, 3, 6, // Back
        3, 0, 7, // Left
    ];

    return {
        position: createBuffer(positions),
        color: createBuffer(colors),
        indices: createIndexBuffer(indices),
        vertexCount: indices.length,
    };
}

// Create octahedron buffer
function initOctahedronBuffer() {
    const positions = [
        // Top pyramid
         0.0,  0.6,  0.0, // Top
        -0.4,  0.0,  0.4, // Front-left
         0.4,  0.0,  0.4, // Front-right
         0.4,  0.0, -0.4, // Back-right
        -0.4,  0.0, -0.4, // Back-left

        // Bottom pyramid
         0.0, -0.6,  0.0, // Bottom
    ];

    const colors = [
        0.0, 1.0, 1.0, 1.0, // Cyan
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        0.0, 1.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0, // Magenta
    ];

    const indices = [
        // Top pyramid
        0, 1, 2,
        0, 2, 3,
        0, 3, 4,
        0, 4, 1,

        // Bottom pyramid
        5, 2, 1,
        5, 3, 2,
        5, 4, 3,
        5, 1, 4,
    ];

    return {
        position: createBuffer(positions),
        color: createBuffer(colors),
        indices: createIndexBuffer(indices),
        vertexCount: indices.length,
    };
}

// Create star buffer
function initStarBuffer() {
    const points = 5;
    const outerRadius = 0.5;
    const innerRadius = 0.2;

    let positions = [0.0, 0.0, 0.0]; // Center
    let colors = [1.0, 1.0, 1.0, 1.0]; // White center

    for (let i = 0; i <= points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;

        positions.push(
            radius * Math.cos(angle - Math.PI / 2),
            radius * Math.sin(angle - Math.PI / 2),
            0.0
        );

        if (i % 2 === 0) {
            colors.push(1.0, 0.8, 0.0, 1.0); // Gold for outer points
        } else {
            colors.push(1.0, 1.0, 0.5, 1.0); // Light yellow for inner points
        }
    }

    let indices = [];
    for (let i = 1; i <= points * 2; i++) {
        indices.push(0, i, i + 1);
    }

    return {
        position: createBuffer(positions),
        color: createBuffer(colors),
        indices: createIndexBuffer(indices),
        vertexCount: indices.length,
    };
}

// Helper function to create buffer
function createBuffer(data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return buffer;
}

// Helper function to create index buffer
function createIndexBuffer(data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
    return buffer;
}

// Setup UI controls
function setupControls() {
    const rotX = document.getElementById('rotX');
    const rotY = document.getElementById('rotY');
    const rotZ = document.getElementById('rotZ');
    const transX = document.getElementById('transX');
    const transY = document.getElementById('transY');
    const toggleBtn = document.getElementById('toggleAnimation');
    const resetBtn = document.getElementById('resetView');

    rotX.addEventListener('input', (e) => {
        userRotX = parseFloat(e.target.value);
        document.getElementById('rotXValue').textContent = userRotX;
    });

    rotY.addEventListener('input', (e) => {
        userRotY = parseFloat(e.target.value);
        document.getElementById('rotYValue').textContent = userRotY;
    });

    rotZ.addEventListener('input', (e) => {
        userRotZ = parseFloat(e.target.value);
        document.getElementById('rotZValue').textContent = userRotZ;
    });

    transX.addEventListener('input', (e) => {
        userTransX = parseFloat(e.target.value);
        document.getElementById('transXValue').textContent = userTransX.toFixed(1);
    });

    transY.addEventListener('input', (e) => {
        userTransY = parseFloat(e.target.value);
        document.getElementById('transYValue').textContent = userTransY.toFixed(1);
    });

    toggleBtn.addEventListener('click', () => {
        animationEnabled = !animationEnabled;
        toggleBtn.textContent = animationEnabled ? 'Stop Animation' : 'Start Animation';
    });

    resetBtn.addEventListener('click', () => {
        userRotX = 0;
        userRotY = 0;
        userRotZ = 0;
        userScale = 1.0;
        userTransX = 0.0;
        userTransY = 0.0;

        rotX.value = 0;
        rotY.value = 0;
        rotZ.value = 0;
        transX.value = 0;
        transY.value = 0;

        document.getElementById('rotXValue').textContent = '0';
        document.getElementById('rotYValue').textContent = '0';
        document.getElementById('rotZValue').textContent = '0';
        document.getElementById('transXValue').textContent = '0.0';
        document.getElementById('transYValue').textContent = '0.0';
    });
}

// Matrix operations
function createProjectionMatrix() {
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    return projectionMatrix;
}

function createModelViewMatrix(translateX, translateY, translateZ, rotateX, rotateY, rotateZ, scaleVal) {
    const modelViewMatrix = mat4.create();

    // Apply user transformations
    mat4.translate(modelViewMatrix, modelViewMatrix, [userTransX, userTransY, -8.0]);
    mat4.rotateX(modelViewMatrix, modelViewMatrix, userRotX * Math.PI / 180);
    mat4.rotateY(modelViewMatrix, modelViewMatrix, userRotY * Math.PI / 180);
    mat4.rotateZ(modelViewMatrix, modelViewMatrix, userRotZ * Math.PI / 180);
    mat4.scale(modelViewMatrix, modelViewMatrix, [userScale, userScale, userScale]);

    // Apply object-specific transformations
    mat4.translate(modelViewMatrix, modelViewMatrix, [translateX, translateY, translateZ]);
    mat4.rotateX(modelViewMatrix, modelViewMatrix, rotateX);
    mat4.rotateY(modelViewMatrix, modelViewMatrix, rotateY);
    mat4.rotateZ(modelViewMatrix, modelViewMatrix, rotateZ);
    mat4.scale(modelViewMatrix, modelViewMatrix, [scaleVal, scaleVal, scaleVal]);

    return modelViewMatrix;
}

// Draw object
function drawObject(buffer, modelViewMatrix, projectionMatrix) {
    // Position
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }

    // Color
    {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.color);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    }

    // Indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indices);

    // Set uniforms
    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
    );
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
    );

    // Draw
    {
        const vertexCount = buffer.vertexCount;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}

// Draw scene
function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projectionMatrix = createProjectionMatrix();

    if (animationEnabled) {
        animationTime += 0.01;
    }

    // Draw rotating cube (animated)
    const cubeMatrix = createModelViewMatrix(
        -2.0, 1.0, 0.0,
        animationTime, animationTime * 0.7, 0,
        0.8
    );
    drawObject(buffers.cube, cubeMatrix, projectionMatrix);

    // Draw pyramid (static)
    const pyramidMatrix = createModelViewMatrix(
        2.0, 1.0, 0.0,
        0, 0, 0,
        0.8
    );
    drawObject(buffers.pyramid, pyramidMatrix, projectionMatrix);

    // Draw octahedron (animated - orbiting)
    const orbitRadius = 1.5;
    const octahedronMatrix = createModelViewMatrix(
        Math.cos(animationTime) * orbitRadius,
        -1.5,
        Math.sin(animationTime) * orbitRadius,
        animationTime * 2, 0, animationTime,
        0.6
    );
    drawObject(buffers.octahedron, octahedronMatrix, projectionMatrix);

    // Draw star (animated - pulsing)
    const pulseScale = 0.8 + Math.sin(animationTime * 2) * 0.2;
    const starMatrix = createModelViewMatrix(
        0, -1.5, 0,
        0, 0, animationTime * 0.5,
        pulseScale
    );
    drawObject(buffers.star, starMatrix, projectionMatrix);

    requestAnimationFrame(drawScene);
}

// Matrix library (mat4)
const mat4 = {
    create: function() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    },

    perspective: function(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);

        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) * nf;
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[14] = 2 * far * near * nf;
        out[15] = 0;
        return out;
    },

    translate: function(out, a, v) {
        const x = v[0], y = v[1], z = v[2];

        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];

        if (a !== out) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];
            out[7] = a[7];
            out[8] = a[8];
            out[9] = a[9];
            out[10] = a[10];
            out[11] = a[11];
        }

        return out;
    },

    rotateX: function(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a10 = a[4];
        const a11 = a[5];
        const a12 = a[6];
        const a13 = a[7];
        const a20 = a[8];
        const a21 = a[9];
        const a22 = a[10];
        const a23 = a[11];

        if (a !== out) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
        }

        out[4] = a10 * c + a20 * s;
        out[5] = a11 * c + a21 * s;
        out[6] = a12 * c + a22 * s;
        out[7] = a13 * c + a23 * s;
        out[8] = a20 * c - a10 * s;
        out[9] = a21 * c - a11 * s;
        out[10] = a22 * c - a12 * s;
        out[11] = a23 * c - a13 * s;

        return out;
    },

    rotateY: function(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a20 = a[8];
        const a21 = a[9];
        const a22 = a[10];
        const a23 = a[11];

        if (a !== out) {
            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];
            out[7] = a[7];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
        }

        out[0] = a00 * c - a20 * s;
        out[1] = a01 * c - a21 * s;
        out[2] = a02 * c - a22 * s;
        out[3] = a03 * c - a23 * s;
        out[8] = a00 * s + a20 * c;
        out[9] = a01 * s + a21 * c;
        out[10] = a02 * s + a22 * c;
        out[11] = a03 * s + a23 * c;

        return out;
    },

    rotateZ: function(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a10 = a[4];
        const a11 = a[5];
        const a12 = a[6];
        const a13 = a[7];

        if (a !== out) {
            out[8] = a[8];
            out[9] = a[9];
            out[10] = a[10];
            out[11] = a[11];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
        }

        out[0] = a00 * c + a10 * s;
        out[1] = a01 * c + a11 * s;
        out[2] = a02 * c + a12 * s;
        out[3] = a03 * c + a13 * s;
        out[4] = a10 * c - a00 * s;
        out[5] = a11 * c - a01 * s;
        out[6] = a12 * c - a02 * s;
        out[7] = a13 * c - a03 * s;

        return out;
    },

    scale: function(out, a, v) {
        const x = v[0], y = v[1], z = v[2];

        out[0] = a[0] * x;
        out[1] = a[1] * x;
        out[2] = a[2] * x;
        out[3] = a[3] * x;
        out[4] = a[4] * y;
        out[5] = a[5] * y;
        out[6] = a[6] * y;
        out[7] = a[7] * y;
        out[8] = a[8] * z;
        out[9] = a[9] * z;
        out[10] = a[10] * z;
        out[11] = a[11] * z;

        if (a !== out) {
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
        }

        return out;
    }
};

// Start the application
window.onload = initWebGL;
