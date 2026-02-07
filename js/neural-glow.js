/**
 * Neural Glow Effect
 * Ported from React to Vanilla JS
 */

export function initNeuralGlow(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    let gl;
    let program;
    let uniforms = {};
    const pointer = { x: 0, y: 0, tX: 0, tY: 0 };
    let animationFrameId;

    /* =========================================
       Shaders
       ========================================= */
    const vertexShaderSource = `
        precision mediump float;

        attribute vec2 a_position;
        varying vec2 vUv;

        void main() {
            vUv = .5 * (a_position + 1.);
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;

        varying vec2 vUv;
        uniform float u_time;
        uniform float u_ratio;
        uniform vec2 u_pointer_position;
        uniform float u_scroll_progress;

        vec2 rotate(vec2 uv, float th) {
            return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
        }

        float neuro_shape(vec2 uv, float t, float p) {
            vec2 sine_acc = vec2(0.);
            vec2 res = vec2(0.);
            float scale = 8.;

            for (int j = 0; j < 15; j++) {
                uv = rotate(uv, 1.);
                sine_acc = rotate(sine_acc, 1.);
                vec2 layer = uv * scale + float(j) + sine_acc - t;
                sine_acc += sin(layer) + 2.4 * p;
                res += (.5 + .5 * cos(layer)) / scale;
                scale *= (1.2);
            }
            return res.x + res.y;
        }

        void main() {
            vec2 uv = .5 * vUv;
            uv.x *= u_ratio;

            vec2 pointer = vUv - u_pointer_position;
            pointer.x *= u_ratio;
            float p = clamp(length(pointer), 0., 1.);
            p = .5 * pow(1. - p, 2.);

            float t = .001 * u_time;
            vec3 color = vec3(0.);

            float noise = neuro_shape(uv, t, p);

            noise = 1.2 * pow(noise, 3.);
            noise += pow(noise, 10.);
            noise = max(.0, noise - .5);
            noise *= (1. - length(vUv - .5));

            // 4-Color Palette
            vec3 cBlue = vec3(0.2, 0.4, 1.0); // Electric Blue (Start)
            vec3 cPurple = vec3(0.6, 0.1, 0.9);
            vec3 cCyan = vec3(0.0, 0.8, 0.9);
            vec3 cMagenta = vec3(0.9, 0.1, 0.5);
            
            float s = u_scroll_progress * 3.0;
            
            // Phase offsets to ensure we start at cBlue (mix factors ~0)
            float m1 = sin(s - 1.57) * 0.5 + 0.5; // Starts at 0
            float m2 = cos(s) * 0.5 + 0.5;
            float mFinal = sin(s * 0.5 - 1.57) * 0.5 + 0.5; // Starts at 0
            
            vec3 mix1 = mix(cBlue, cPurple, m1);
            vec3 mix2 = mix(cCyan, cMagenta, m2);
            vec3 finalColor = mix(mix1, mix2, mFinal);
            
            color = finalColor * noise;
            
            gl_FragColor = vec4(color, noise);
        }
    `;

    /* =========================================
       WebGL Helpers
       ========================================= */
    function createShader(gl, sourceCode, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createShaderProgram(gl, vertexShader, fragmentShader) {
        const prog = gl.createProgram();
        gl.attachShader(prog, vertexShader);
        gl.attachShader(prog, fragmentShader);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(prog));
            return null;
        }
        return prog;
    }

    function getUniformLocations(gl, program) {
        let locs = {};
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
            const info = gl.getActiveUniform(program, i);
            locs[info.name] = gl.getUniformLocation(program, info.name);
        }
        return locs;
    }

    /* =========================================
       Initialization
       ========================================= */
    function init() {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.warn('WebGL not supported');
            return;
        }

        const vs = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
        const fs = createShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
        program = createShaderProgram(gl, vs, fs);
        if (!program) return;

        uniforms = getUniformLocations(gl, program);

        // Buffer setup
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]); // Triangle strip for full quad
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.useProgram(program);
        
        const positionLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        resize();
        window.addEventListener('resize', resize);
        
        // Initial Pointer Center
        pointer.tX = window.innerWidth / 2;
        pointer.tY = window.innerHeight / 2;
        pointer.x = window.innerWidth / 2;
        pointer.y = window.innerHeight / 2;

        window.addEventListener('pointermove', e => {
            pointer.tX = e.clientX;
            pointer.tY = e.clientY;
        });
        
        window.addEventListener('touchmove', e => {
            pointer.tX = e.touches[0].clientX;
            pointer.tY = e.touches[0].clientY;
        });

        render();
    }

    function resize() {
        if (!canvas || !gl) return;
        const dpr = Math.min(window.devicePixelRatio, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        
        if (uniforms.u_ratio) {
            gl.useProgram(program); // Ensure program is active before setting uniforms
            gl.uniform1f(uniforms.u_ratio, canvas.width / canvas.height);
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function render() {
        if (!gl || !program) return;

        // Smooth pointer
        pointer.x += (pointer.tX - pointer.x) * 0.1; // Slower lerp for smoother feel
        pointer.y += (pointer.tY - pointer.y) * 0.1;

        const time = performance.now();
        gl.useProgram(program);

        if (uniforms.u_time) gl.uniform1f(uniforms.u_time, time);
        if (uniforms.u_pointer_position) {
            gl.uniform2f(
                uniforms.u_pointer_position,
                pointer.x / window.innerWidth,
                1 - pointer.y / window.innerHeight // Flip Y for GL coords
            );
        }
        if (uniforms.u_scroll_progress) {
             gl.uniform1f(
                uniforms.u_scroll_progress,
                window.pageYOffset / (2 * window.innerHeight)
             );
        }

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        animationFrameId = requestAnimationFrame(render);
    }

    init();
}
