/**
 * @author jbouny / https://github.com/fft-ocean
 */
 
THREE.ShaderChunk["lod_pars_vertex"] = [
    
		'uniform float u_scale;',
		'uniform int u_resolution;',
		'uniform int u_level;',
    
    'mat3 getRotation()',
    '{',
      // Extract the 3x3 rotation matrix from the 4x4 view matrix
    '  return mat3( ',
    '    viewMatrix[0].xyz,',
    '    viewMatrix[1].xyz,',
    '    viewMatrix[2].xyz',
    '  );',
    '}',
    
    'vec3 getCameraPos( in mat3 rotation )',
    '{',
      // Xc = R * Xw + t
      // c = - R.t() * t <=> c = - t.t() * R
    ' return - viewMatrix[3].xyz * rotation;',
    '}',
    
    'vec4 computePosition( vec4 position )',
    '{',
    ' float resolution = float( u_resolution );',
    
      // Extract the camera position
    ' mat3 cameraRotation = getRotation();',
    ' vec3 cameraPosition = getCameraPos( cameraRotation );',
    
      // Discretise the space and made the grid following the camera
    ' float cameraHeightLog = log2( abs( cameraPosition.y ) );',
    ' float scale = u_scale * pow( 2.0, floor( cameraHeightLog ) ) * 0.005;',
    ' vec3 cameraScaledPosition = cameraPosition / scale;',
    ' vec2 gridPosition = position.xz + floor( cameraScaledPosition.xz * resolution + 0.5 ) / resolution;',
    
      // Check if it is need to apply the morphing (on 1 square on 2)
    ' vec2 nextLevelMantissa = gridPosition * resolution * 0.5;',
    ' nextLevelMantissa -= floor( nextLevelMantissa );',
    
      // Compute morphing factors (based on the height and the parent LOD
    ' float heightMorphFactor = cameraHeightLog - floor( cameraHeightLog );',
    ' vec2 comparePos = max( vec2( 0.0 ), abs( ( cameraScaledPosition.xz - gridPosition ) * 4.0 ) - 1.0 ) ;',
    ' float parentLODMorphFactor = max( comparePos.x, comparePos.y );',
    
      // Compute the composition of morphing factors
    ' vec2 morphFactor = vec2( 0.0 );',
    ' if( nextLevelMantissa.x > 0.1 || nextLevelMantissa.y > 0.1 ) {',
      ' float morphing = heightMorphFactor * parentLODMorphFactor;',
      // If first LOD, apply the height morphing factor everywhere
      ' if( u_level == 0 ) {',
      '   morphing = max( heightMorphFactor, parentLODMorphFactor );',
      ' }',
      ' morphFactor += morphing * min( vec2( 1.0 ), floor( nextLevelMantissa * 10.0 ) );',
    ' }',
    
      // Apply the morphing
    ' gridPosition += morphFactor / resolution;',
    
      // Return the final position
    ' return vec4( gridPosition.x * scale, 0.0, gridPosition.y * scale, 1.0 );',
    '}'
  
].join('\n');

THREE.ShaderChunk["lod_vertex"] = [
  'worldPosition = computePosition( worldPosition );',
].join('\n');