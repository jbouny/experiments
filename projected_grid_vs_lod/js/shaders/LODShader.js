/**
 * @author jbouny / https://github.com/fft-ocean
 */
 
THREE.ShaderChunk["lod_pars_vertex"] = [
    
		'uniform float u_scale;',
		'uniform int u_resolution;',
		'uniform int u_level;',
		'uniform vec3 u_planeNormal;',
		'uniform float u_planeDistance;',
		'uniform bool u_usePlaneParameters;',
    
    // http://www.neilmendoza.com/glsl-rotation-about-an-arbitrary-axis/
    'mat3 axisAngleToMatrix(vec3 axis, float angle)',
    '{',
    ' float len = length (axis);',
    ' axis = (len == 0.0) ? vec3 (0.0, 0.0, 0.0) : axis / len;',
    ' float s = sin(angle);',
    ' float c = cos(angle);',
    ' float oc = 1.0 - c;',
    ' ',
    ' return mat3( oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,',
    '              oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,',
    '              oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c );',
    '}',
    
    'vec2 computeAncestorMorphing(int level, vec2 gridPosition, float heightMorphFactor, vec3 cameraScaledPosition, float resolution, vec2 previousMorphing )',
    '{',
      // Check if it is needed to apply the morphing (on 1 square on 2)
    ' vec2 mantissa = gridPosition * resolution * 0.5;',
    ' if( level > 1 ) {',
    '   mantissa = ( mantissa + 0.5 ) / pow( 2.0, float( level - 1 ) );',
    ' }',
    ' mantissa -= floor( mantissa );',
    
      // Compute morphing factors (based on the height and the parent LOD
    ' vec2 squareOffset = abs( cameraScaledPosition.xz - ( gridPosition + previousMorphing ) ) / float( level );',
    ' vec2 comparePos = max( vec2( 0.0 ), squareOffset * 4.0 - 1.0 );',
    ' float parentMorphFactor = min( 1.0, max( comparePos.x, comparePos.y ) );',
    
      // Compute the composition of morphing factors
    ' vec2 morphFactor = vec2( 0.0 );',
    ' if( mantissa.x + mantissa.y > 0.49 ) {',
    '   float morphing = parentMorphFactor;',
        // If first LOD, apply the height morphing factor everywhere
    '   if( u_level + level == 1 ) {',
    '     morphing = max( heightMorphFactor, morphing );',
    '   }',
    '   morphFactor += morphing * floor( mantissa * 2.0 );',
    ' }',
    ' return float( level ) * morphFactor / resolution;',
      
    '}',
    
    'vec4 computePosition( vec4 position )',
    '{',
      // Extract the 3x3 rotation matrix and the translation vector from the 4x4 view matrix, then compute the camera position
      // Xc = R * Xw + t
      // c = - R.t() * t <=> c = - t.t() * R
    ' vec3 cameraPosition = - viewMatrix[3].xyz * mat3( viewMatrix );',
    
    ' float resolution = float( u_resolution );',
    ' vec3 planeNormal = normalize( u_planeNormal );',
    
    // Compute the plane rotation (if needed)
    ' mat3 planeRotation;',
    ' if( u_usePlaneParameters ) {',
    '   vec3 rotationAxis = cross( vec3( 0, 1.0, 0 ), planeNormal );',
    '   float rotationAngle = acos( dot( vec3( 0, 1.0, 0 ), planeNormal ) );',
    '   planeRotation = axisAngleToMatrix( rotationAxis, rotationAngle );',
    ' }',
    
      // Project the camera position on the grid using plane parameters
    ' vec3 projectedCamera = vec3( cameraPosition.x, 0.0, cameraPosition.z );',
    ' if( u_usePlaneParameters ) {',
    '   projectedCamera = cameraPosition - dot( cameraPosition - ( planeNormal * u_planeDistance ), planeNormal ) * planeNormal;',
    ' }',
    
      // Discretise the space and made the grid following the camera
    ' float cameraHeightLog = log2( length( cameraPosition - projectedCamera ) );',
    ' float scale = u_scale * pow( 2.0, floor( cameraHeightLog ) ) * 0.005;',
    ' vec3 cameraScaledPosition = projectedCamera / scale;',
    ' if( u_usePlaneParameters ) {',
    '   cameraScaledPosition = planeRotation * cameraScaledPosition;',
    ' }',
    ' vec2 gridPosition = position.xz + floor( cameraScaledPosition.xz * resolution + 0.5 ) / resolution;',
    
      // Compute the height morphing factor
    ' float heightMorphFactor = cameraHeightLog - floor( cameraHeightLog );',
    
      // Compute morphing factors from LOD ancestors
    ' vec2 morphing = vec2( 0 );',
    ' for( int i = 1; i <= 2; ++i ) {',
    '   morphing += computeAncestorMorphing( i, gridPosition, heightMorphFactor, cameraScaledPosition, resolution, morphing );',
    ' }',
    
      // Apply final morphing
    ' gridPosition = gridPosition + morphing;',
    
      // Compute world coordinates (if needed)
    ' vec3 worldPosition = vec3( gridPosition.x * scale, 0, gridPosition.y * scale );',
    ' if( u_usePlaneParameters ) {',
    '   worldPosition.y += u_planeDistance;',
    '   worldPosition *= planeRotation;',
    ' }',
    
      // Return the final position
    ' return vec4( worldPosition, 1.0 );',
    '}'
  
].join('\n');

THREE.ShaderChunk["lod_vertex"] = [
  'worldPosition = computePosition( worldPosition );',
].join('\n');