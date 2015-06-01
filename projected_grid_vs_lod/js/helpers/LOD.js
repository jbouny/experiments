/**
 * @author jbouny
 */

THREE.LODPlane = function ( parameters ) {
  
  THREE.Object3D.apply( this );
  this.controlLODParameters( parameters, false );
  
  this.gridGeometry = this.generateLODGeometry( this.lodResolution );
  this.gridOutsideGeometry = this.generateLODGeometry( this.lodResolution, true );
  
};

THREE.LODPlane.prototype = Object.create( THREE.Object3D.prototype );
THREE.LODPlane.prototype.constructor = Object.create( THREE.LODPlane );

THREE.LODPlane.prototype.controlLODParameters = function controlLODParameters( parameters, useCurrentValues ) {

  function optionalParameter(value, defaultValue) {
    return value !== undefined ? value : defaultValue;
  };
  
  
  // Optionnal parameters
  if ( parameters === undefined ) {
    parameters = {};
  }
  
  useCurrentValues = optionalParameter( useCurrentValues, false )
  if ( useCurrentValues ) {
  
    this.lodResolution = optionalParameter( parameters.resolution, this.lodResolution );
    this.lodLevels = optionalParameter( parameters.levels, this.lodLevels );
    this.lodScale = optionalParameter( parameters.scale, this.lodScale );
    this.lodMaterial = optionalParameter( parameters.material, this.lodMaterial );
    
  }
  else {
  
    this.lodResolution = optionalParameter( parameters.resolution, 64 );
    this.lodLevels = optionalParameter( parameters.levels, 8 );
    this.lodScale = optionalParameter( parameters.scale, 1 );
    this.lodMaterial = optionalParameter( parameters.material, undefined );
    
  }
  
  // Control parameters
  {
    // Level should be a positive integer
    this.lodLevels = Math.max( 1, Math.round( this.lodLevels ) );
    
    // Scale should be positive
    this.lodScale = Math.max( 1, this.lodScale );
    
    // Resolution should be a power of two
    this.lodResolution = Math.max( 1, this.lodResolution );
    this.lodResolution = Math.pow( 2, Math.round( Math.log2( this.lodResolution ) ) );
  }

  this.previousLodResolution = this.lodResolution;
  
},

THREE.LODPlane.prototype.generate = function generate( parameters ) {

  var previousLodResolution = this.previousLodResolution;
  
  this.controlLODParameters( parameters, true );

  //console.log( "LOD with params: " + this.lodResolution + " " + this.lodLevels + " " + this.lodScale );
  
  // Generate geometries
  if ( previousLodResolution !== this.lodResolution ) {
  
    this.gridGeometry = this.generateLODGeometry( this.lodResolution );
    this.gridOutsideGeometry = this.generateLODGeometry( this.lodResolution, true );
    
  }
  
  // Create meshes
  this.generateLevels();

};

THREE.LODPlane.prototype.generateLevels = function generateLevels() {

  // Ensure there is no other objects in the group
  while ( this.children.length > 0 ) {
  
    this.remove( this.children[0] );
  
  };
  
  // Generate levels
  var currentScale = this.lodScale;
  for ( var i = 0; i < this.lodLevels; ++i ) {
    
    var geometry = ( i == 0 ? this.gridGeometry : this.gridOutsideGeometry );
    this.add( this.generateLODMesh( geometry, this.lodMaterial, currentScale, i ) );
    currentScale *= 2;
    
  }

};

THREE.LODPlane.prototype.applyOnLevels = function applyOnLevels( expression ) {

  for ( var i in this.children ) {
  
    expression( this.children[i] );
    
  }

};

THREE.LODPlane.prototype.setLODScale = function setLODScale( lodScale ) {
  
  this.lodScale = lodScale;
  var currentScale = lodScale;
  this.applyOnLevels( function ( level ) {
    
    level.material.uniforms.u_scale.value = currentScale;
    currentScale *= 2;
    
  } );
  
}

THREE.LODPlane.prototype.getResolution = function getResolution() {
  
  return this.ms_LODDimension;
  
};
  
THREE.LODPlane.prototype.generateLODMesh = function generateLODMesh( geometry, material, scale, level ) {
    
  var lodMaterial = material.clone();
  lodMaterial.uniforms.u_scale.value = scale;
  lodMaterial.uniforms.u_level.value = level;
  var mesh = new THREE.Mesh( geometry, lodMaterial );
  
  return mesh;
  
},

THREE.LODPlane.prototype.generateLODGeometry = function generateLODGeometry( resolution, isOutside ) {

  function optionalParameter(value, defaultValue) {
    return value !== undefined ? value : defaultValue;
  };
  
  resolution = optionalParameter( resolution, 64 );
  isOutside = optionalParameter( isOutside, false );
  
  var geometry = new THREE.BufferGeometry();
  var halfSize = Math.round( resolution * 0.5 );
  
  var nbPoints = ( resolution + 3 ) * ( resolution + 3 );
  var nbTriangles = ( resolution + 2 ) * ( resolution + 2 ) * 2 ;
  
  var positions = new Float32Array( nbPoints * 3 );
	var indices = new ( ( positions.length / 3 ) > 65535 ? Uint32Array : Uint16Array )( nbTriangles * 3 );
  geometry.addAttribute( 'index', new THREE.BufferAttribute( indices, 1 ) );
  geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
  
  // Generate 3d vertices
  {
    var index = 0;
    
    for( var x = -halfSize - 1; x <= halfSize + 1; ++x )
    {
      for( var z = -halfSize - 1; z <= halfSize + 1; ++z )
      {      
        positions[index    ] = x / resolution;
        positions[index + 1] = 0;
        positions[index + 2] = z / resolution;
        
        index += 3;
      }
    }
  }
  
  // Generate triangles with vertices indices
  {
    var index = 0,
        width = resolution + 3,
        insideLow = resolution / 4,
        insideHigh = insideLow * 3;
    for( var x = 0; x <= resolution + 1; ++x )
    {
      var left = x,
          right = x + 1,
          insideXHole = x > insideLow && x <= insideHigh;
      for( var z = 0; z <= resolution + 1; ++z )
      {
        var front = z,
            back = z + 1,
            insideZHole = z > insideLow && z <= insideHigh;
            
        if( isOutside && insideXHole && insideZHole )
          continue;
          
        var a = width * left + back,
            b = width * right + back,
            c = width * right + front,
            d = width * left + front
        
        // First triangle
        indices[index    ] = a;
        indices[index + 1] = b;
        indices[index + 2] = d;
        
        // Second triangle
        indices[index + 3] = d;
        indices[index + 4] = b
        indices[index + 5] = c;
        
        index += 6;
      }
    }
  }
  
  return geometry;

};