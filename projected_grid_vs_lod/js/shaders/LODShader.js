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
    
    'vec4 computePosition( vec4 position )',
    '{',
      // Extract the 3x3 rotation matrix and the translation vector from the 4x4 view matrix, then compute the camera position
      // Xc = R * Xw + t
      // c = - R.t() * t <=> c = - t.t() * R
    ' vec3 cameraPosition = - viewMatrix[3].xyz * mat3( viewMatrix );',
    
    ' float resolution = float( u_resolution );',
    ' vec3 planeNormal = normalize( u_planeNormal );',
    
    ' mat3 planeRotation;',
    ' if( u_usePlaneParameters ) {',
    '   vec3 rotationAxis = cross( vec3( 0, 1.0, 0 ), planeNormal );',
    '   float rotationAngle = acos( dot( vec3( 0, 1.0, 0 ), planeNormal ) );',
    '   planeRotation = axisAngleToMatrix( rotationAxis, rotationAngle );',
    ' }',
    
      // Project the camera position on the grid
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
    
      // Check if it is needed to apply the morphing (on 1 square on 2)
    ' vec2 nextLevelMantissa = gridPosition * resolution * 0.5;',
    ' nextLevelMantissa -= floor( nextLevelMantissa );',
    
      // Compute morphing factors (based on the height and the parent LOD
    ' float heightMorphFactor = cameraHeightLog - floor( cameraHeightLog );',
    ' vec2 comparePos = max( vec2( 0.0 ), abs( ( cameraScaledPosition.xz - gridPosition ) * 4.0 ) - 1.0 ) ;',
    ' float parentLODMorphFactor = max( comparePos.x, comparePos.y );',
    
      // Compute the composition of morphing factors
    ' vec2 morphFactor = vec2( 0.0 );',
    ' if( nextLevelMantissa.x > 0.1 || nextLevelMantissa.y > 0.1 ) {',
    '   float morphing = max( parentLODMorphFactor, heightMorphFactor * parentLODMorphFactor );',
        // If first LOD, apply the height morphing factor everywhere
    '   if( u_level == 0 ) {',
    '     morphing = max( heightMorphFactor, parentLODMorphFactor );',
    '   }',
    '   morphFactor += morphing * min( vec2( 1.0 ), floor( nextLevelMantissa * 10.0 ) );',
    ' }',
    
      // Apply the morphing
    ' gridPosition += morphFactor / resolution;',
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