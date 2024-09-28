'use strict';
import { get_shader, init_shaders } from './shaders.js';

const numVertices  = 36;
let gl = null;
let program = null;
const points = [];
const colors = [];

let movement = false;     // Do we rotate?
let spinX = 0;
let spinY = 0;
let origX = null;
let origY = null;

let matrixLoc = null;


const [vertex_shader, fragment_shader] = [
	'shaders/billy/vertex-shader.glsl',
	'shaders/billy/fragment-shader.glsl'
].map(get_shader);

export async function init() {
	const canvas = document.querySelector('#billy-canvas');
	gl = WebGLUtils.setupWebGL(canvas);

	if (!gl)
		alert("WebGL is not available");

	colorCube();

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	gl.enable(gl.DEPTH_TEST);

	program = await init_shaders(gl, await vertex_shader, await fragment_shader);
	gl.useProgram(program);

	const cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	const vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	const vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

	const vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray( vPosition );

	matrixLoc = gl.getUniformLocation(program, "transform");

	//event listeners for mouse
	canvas.addEventListener("mousedown", function(e){
		movement = true;
		origX = e.offsetX;
		origY = e.offsetY;
		e.preventDefault(); // Disable drag and drop
	});

	canvas.addEventListener("mouseup", function(e){
		movement = false;
	});

	canvas.addEventListener("mousemove", function(e){
		if(movement) {
			spinY = (spinY + (origX - e.offsetX)) % 360;
			spinX = (spinX + (origY - e.offsetY)) % 360;
			origX = e.offsetX;
			origY = e.offsetY;
		}
	});

	render();
}

function colorCube() {
	quad(1, 0, 3, 2);
	quad(2, 3, 7, 6);
	quad(3, 0, 4, 7);
	quad(6, 5, 1, 2);
	quad(4, 5, 6, 7);
	quad(5, 4, 0, 1);
}

function quad(a, b, c, d) {
	const vertices = [
		vec3(-0.5, -0.5,	0.5),
		vec3(-0.5,	0.5,	0.5),
		vec3( 0.5,	0.5,	0.5),
		vec3( 0.5, -0.5,	0.5),
		vec3(-0.5, -0.5, -0.5),
		vec3(-0.5,	0.5, -0.5),
		vec3( 0.5,	0.5, -0.5),
		vec3( 0.5, -0.5, -0.5)
	];

	const vertexColors = [
		[ 0.0, 0.0, 0.0, 1.0 ],	 // black
		[ 1.0, 0.0, 0.0, 1.0 ],	 // red
		[ 1.0, 1.0, 0.0, 1.0 ],	 // yellow
		[ 0.0, 1.0, 0.0, 1.0 ],	 // green
		[ 0.0, 0.0, 1.0, 1.0 ],	 // blue
		[ 1.0, 0.0, 1.0, 1.0 ],	 // magenta
		[ 0.0, 1.0, 1.0, 1.0 ],	 // cyan
		[ 1.0, 1.0, 1.0, 1.0 ]	 // white
	];

	//vertex color assigned by the index of the vertex
	const indices = [ a, b, c, a, c, d ];

	for (let i = 0; i < indices.length; ++i ) {
		points.push( vertices[indices[i]] );
		colors.push(vertexColors[a]);
	}
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	let mv = mat4();
	mv = mult(mv, rotateX(spinX));
	mv = mult(mv, rotateY(spinY));

	const thickness = 0.02;
	const depth = 0.28;
	const width = 0.80;
	const height = 1.06;
	const internal_depth = 0.26;
	const internal_width = 0.76;
	const internal_height = 0.96;
	const foot_height = 0.09;

	const side = scalem(thickness, height, depth);
	const shelf = scalem(internal_width, thickness, depth);
	const backside = scalem(width, height, 0.005);

	// Right side
	gl.uniformMatrix4fv(
		matrixLoc,
		false,
		flatten(
			mult(mult(mv, translate(-((width - thickness / 2) / 2), 0.0, 0.0)), side)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	// Left side
	gl.uniformMatrix4fv(
		matrixLoc,
		false,
		flatten(
			mult(mult(mv, translate(((width - thickness / 2) / 2), 0.0, 0.0)), side)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	// Lower shelf
	gl.uniformMatrix4fv(
		matrixLoc,
		false,
		flatten(
			mult(
				mult(mv, translate(0, -0.15, 0)),
				shelf
			)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	// Upper shelf
	gl.uniformMatrix4fv(
		matrixLoc,
		false,
		flatten(
			mult(
				mult(mv, translate(0, 0.15, 0)),
				shelf
			)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	// Bottom shelf
	gl.uniformMatrix4fv(
		matrixLoc,
		false,
		flatten(
			mult(
				mult(mv, translate(0, -((height / 2) - foot_height), 0)),
				shelf
			)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	// Top
	gl.uniformMatrix4fv(
		matrixLoc,
		false,
		flatten(
			mult(
				mult(mv, translate(0, ((height / 2) - thickness / 2), 0)),
				shelf
			)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	// Backside
	gl.uniformMatrix4fv(
		matrixLoc,
		false,
		flatten(
			mult(
				mult(mv, translate(0, 0, (depth / 2))),
				backside
			)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	gl.uniformMatrix4fv(
		matrixLoc,
		false,
		flatten(
			mult(
				mult(mv, translate(0, -((height / 2) - (foot_height / 2)), -((depth / 2) - 0.02))),
				scalem(internal_width, foot_height, thickness)
			)
		)
	);
	gl.drawArrays(gl.TRIANGLES, 0, numVertices);

	requestAnimFrame(render);
}
