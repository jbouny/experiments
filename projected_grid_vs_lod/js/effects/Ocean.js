THREE.Ocean = function (renderer, camera, scene, options) {
	
	// Assign optional parameters as variables and object properties
	function optionalParameter(value, defaultValue) {
		return value !== undefined ? value : defaultValue;
	};
	options = options || {};
	this.geometryResolution = optionalParameter(options.GEOMETRY_RESOLUTION, 32);
  
	var oceanShader = THREE.ShaderLib["ocean_main"];
	this.materialOcean = new THREE.ShaderMaterial({
		attributes: THREE.UniformsUtils.clone(oceanShader.attributes),
		uniforms: THREE.UniformsUtils.clone(oceanShader.uniforms),
		vertexShader: oceanShader.buildVertexShader( 'screenplane' ),
		fragmentShader: oceanShader.fragmentShader,
		side: THREE.DoubleSide,
		wireframe: false
	});

	// Generate the ocean mesh
	this.generateMesh();
  
};

THREE.Ocean.prototype.generateMesh = function () {

	var geometry = new THREE.PlaneBufferGeometry( 1, 1, this.geometryResolution, this.geometryResolution );
	this.oceanMesh = new THREE.Mesh( geometry, this.materialOcean );
  
};
