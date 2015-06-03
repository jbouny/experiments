THREE.ProjectedGridExample = function ( renderer, camera, scene, options ) {
	
	// Assign optional parameters as variables and object properties
	function optionalParameter( value, defaultValue ) {
		return value !== undefined ? value : defaultValue;
	};
	options = options || {};
	this.geometryResolution = optionalParameter( options.GEOMETRY_RESOLUTION, 32 );
  
	var shader = THREE.ShaderLib['example_main'];
  
	this.materialOcean = new THREE.ShaderMaterial( {
		attributes: THREE.UniformsUtils.clone( shader.attributes ),
		uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
		vertexShader: shader.buildVertexShader( 'screenplane' ),
		fragmentShader: shader.fragmentShader,
		side: THREE.DoubleSide,
		wireframe: false
	} );

	// Generate the ocean mesh
	this.generateMesh();
  
};

THREE.ProjectedGridExample.prototype.generateMesh = function () {

	var geometry = new THREE.PlaneBufferGeometry( 1, 1, this.geometryResolution, this.geometryResolution );
	this.oceanMesh = new THREE.Mesh( geometry, this.materialOcean );
  
};
