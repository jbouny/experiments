/**
 * @author jbouny / https://github.com/fft-ocean
 */
 
THREE.ShaderChunk["lod_pars_vertex"] = [
    
		'uniform float u_scale;',
		'uniform int u_resolution;',
    
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
      // Extract the camera position
    ' mat3 cameraRotation = getRotation();',
    ' vec3 cameraPosition = getCameraPos( cameraRotation );',
    
      // Discretise the space and made the grid following the camera
    ' float scale = u_scale * pow( 2.0, floor( log2( abs( cameraPosition.y ) ) ) ) * 0.005;',
    ' float resolution = float( u_resolution );',
    ' float gridToWorld = scale / resolution;',
    ' vec2 worldPosition = ( position.xz + floor( cameraPosition.xz / gridToWorld + 0.5 ) / resolution ) * scale;',
    
      // Compute the mophing factor
    ' vec2 comparePos = min( vec2( 1.0 ), max( vec2( 0.0 ), abs( ( cameraPosition.xz - worldPosition ) / ( scale * 0.5 ) ) * 2.0 - 1.0 ) ) ;',
    ' float morphFactor = max( comparePos.x, comparePos.y );',
    
      // Check if it is need to apply the morphing (on 1 square on 2)
    ' vec2 offset = worldPosition / gridToWorld * 0.5;',
    ' offset = vec2( offset.x - floor( offset.x ), offset.y - floor( offset.y ) );',
    ' if( length( offset ) > 0.1 ) {',
        // Apply morphing on X axis
    '   if( offset.x > 0.1 ) {',
    '     worldPosition.x += morphFactor * gridToWorld * ( position.x > 0.0 ? 1.0 : -1.0 );',
    '   }',
        // Apply morphing on Y axis
    '   if( offset.y > 0.1 ) {',
    '     worldPosition.y += morphFactor * gridToWorld * ( position.z > 0.0 ? 1.0 : -1.0 );',
    '   }',
    '   ',
    ' }',
    ' ',
    
      // Return the final position
    ' return vec4( worldPosition.x, 0.0, worldPosition.y, 1.0 );',
    '}'
  
].join('\n');

THREE.ShaderChunk["lod_vertex"] = [
  'worldPosition = computePosition( worldPosition );',
].join('\n');