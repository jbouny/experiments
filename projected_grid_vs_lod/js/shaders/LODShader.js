/**
 * @author jbouny / https://github.com/fft-ocean
 */
 
THREE.ShaderChunk["lod_pars_vertex"] = [
    
		'uniform float u_scale;',

    'const float u_squareSize = 500.0;',
    
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
    '  return - viewMatrix[3].xyz * rotation;',
    '}',
    
    'vec4 computePosition( vec4 position )',
    '{',
    ' ',
      // Extract the camera position
    '  mat3 cameraRotation = getRotation();',
    ' vec3 cameraPosition = getCameraPos( cameraRotation );',
    
      // Discretise the space and made the grid following the camera
    ' vec2 pos = ( position * u_scale ).xz + floor( cameraPosition.xz / u_scale + 0.5 ) * u_scale;',
    ' ',
    ' vec2 modPos = mod( pos, 2.0 );',
    ' ',
    ' if( length( modPos ) > 0.5 ) {',
    '   vec2 neighbor1Pos = pos + modPos;',
    '   vec2 neighbor2Pos = pos - modPos;',
    '   ',
    ' }',
    ' ',
    ' return vec4( pos.x, 0.0, pos.y, 1.0 );',
    '}'
  
].join('\n');

THREE.ShaderChunk["lod_vertex"] = [
  'worldPosition = computePosition( worldPosition );',
].join('\n');