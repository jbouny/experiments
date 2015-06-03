THREE.LODGridExample = function ( resolution, levels, scale ) {

  this.lod = new THREE.LODPlane( {
    resolution: resolution,
    levels: levels,
    scale: scale
  } );
    
  var shader = THREE.ShaderLib['example_main'];
  var uniforms = THREE.UniformsUtils.clone( shader.uniforms );
  uniforms['u_scale'] = { type: 'f', value: 1.0 };
  uniforms['u_resolution'] = { type: 'i', value: resolution };
  uniforms['u_level'] = { type: 'i', value: 1 };
  uniforms['u_planeUp'] = { type: 'v3', value: new THREE.Vector3( 0, 1, 0 ) };
  uniforms['u_planeAt'] = { type: 'v3', value: new THREE.Vector3( 0, 0, 1 ) };
  uniforms['u_planePoint'] = { type: 'v3', value: new THREE.Vector3( 0, 0, 0 ) };
  uniforms['u_planeDistance'] = { type: 'f', value: 0 };
  uniforms['u_usePlaneParameters'] = { type: 'i', value: 0 };
  
  this.material = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    vertexShader: shader.buildVertexShader( 'lod' ),
    fragmentShader: shader.fragmentShader,
    side: THREE.DoubleSide,
    wireframe: false
  } );
  
};

THREE.LODGridExample.prototype.generate = function () {

  this.material.uniforms.u_resolution.value = this.lod.lodResolution;
    
  this.lod.generate( {
      material: this.material
  } );
  
};
