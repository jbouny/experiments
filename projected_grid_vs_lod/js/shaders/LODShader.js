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
      // Extract the camera position
    ' mat3 cameraRotation = getRotation();',
    ' vec3 cameraPosition = getCameraPos( cameraRotation );',
    
      // Discretise the space and made the grid following the camera
    ' float cameraHeightLog = log2( abs( cameraPosition.y ) );',
    ' float scale = u_scale * pow( 2.0, floor( cameraHeightLog ) ) * 0.005;',
    ' float resolution = float( u_resolution );',
    ' float gridToWorld = scale / resolution;',
    ' vec2 worldPosition = ( position.xz + floor( cameraPosition.xz / gridToWorld + 0.5 ) / resolution ) * scale;',
    
      // Check if it is need to apply the morphing (on 1 square on 2)
    ' vec2 offset = worldPosition / gridToWorld * 0.5;',
    ' offset = vec2( offset.x - floor( offset.x ), offset.y - floor( offset.y ) );',
    ' vec2 offset2 = worldPosition / gridToWorld * 0.25;',
    ' offset2 = vec2( offset2.x - floor( offset2.x ), offset2.y - floor( offset2.y ) );',
    
      // Compute morphing factors (based on the height, the parent LOD and the grand parent LOD)
    ' vec2 comparePos = min( vec2( 1.0 ), max( vec2( 0.0 ), abs( ( cameraPosition.xz - worldPosition ) / ( scale * 0.5 ) ) * 2.0 - 1.0 ) ) ;',
    ' vec2 comparePos2 = min( vec2( 1.0 ), max( vec2( 0.0 ), abs( ( cameraPosition.xz - worldPosition ) / scale ) * 2.0 - 1.0 ) ) ;',
    ' float heightMorphFactor = cameraHeightLog - floor( cameraHeightLog );',
    ' float parentLODMorphFactor = max( comparePos.x, comparePos.y );',
    ' float grandParentLODMorphFactor = max( comparePos2.x, comparePos2.y ) * 2.0;',
    
      // Compute the composition of morphing factors
    ' float morphFactorX = 0.0;',
    ' float morphFactorY = 0.0;',
    ' if( length( offset ) > 0.1 ) {',
      ' float morphing = max( parentLODMorphFactor, heightMorphFactor * parentLODMorphFactor );',
      // If first LOD, apply the height morphing factor everywhere
      ' if( u_level == 0 ) {',
      '   morphing = max( parentLODMorphFactor, heightMorphFactor );',
      ' }',
      ' if( offset.x > 0.1 ) {',
      '   morphFactorX += morphing;',
      ' }',
      ' if( offset.y > 0.1 ) {',
      '   morphFactorY += morphing;',
      ' }',
    ' }',
    ' if( length( offset2 ) > 0.1 ) {',
      ' if( offset2.x > 0.1 ) {',
      '   morphFactorX += grandParentLODMorphFactor;',
      ' }',
      ' if( offset2.y > 0.1 ) {',
      '   morphFactorY += grandParentLODMorphFactor;',
      ' }',
    ' }',
    
      // Apply the morphing
    '   worldPosition.x += morphFactorX * gridToWorld;',
    '   worldPosition.y += morphFactorY * gridToWorld ;',
    ' ',
    ' ',
    
      // Return the final position
    ' return vec4( worldPosition.x, 0.0, worldPosition.y, 1.0 );',
    '}'
  
].join('\n');

THREE.ShaderChunk["lod_vertex"] = [
  'worldPosition = computePosition( worldPosition );',
].join('\n');