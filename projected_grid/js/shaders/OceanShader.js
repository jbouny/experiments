THREE.ShaderLib['ocean_main'] = {
	uniforms: {

    'u_animate':  { type: 'i', value: true },
    'u_time':     { type: 'f', value: 0.0 },

  },
  
	vertexShader: [
		'precision highp float;',
		
		'varying vec3 vWorldPosition;',
		'uniform bool u_animate;',
		'uniform float u_time;',
    
		'const float scale = 50.0;',
		
		THREE.ShaderChunk[ "screenplane_pars_vertex" ],
			
    'float getHeight( vec2 inDir, vec3 position ) {',
    ' float height = sin( position.x * inDir.x + u_time ) * 0.8 + cos( position.z * inDir.y + u_time  ) * 0.2 ;',
    ' return height * height * height ;',
    '}',

		'void main (void) {',
			THREE.ShaderChunk[ "screenplane_vertex" ],
			
			'vec4 worldPosition = screenPlaneWorldPosition;',
			
			'if( u_animate ) {;',
        'vec3 heightPosition = worldPosition.xyz * 10.0 / scale;',
        
        'float height = getHeight( vec2( 0.3565, 0.265 ), heightPosition ) * 0.3 +',
        '              getHeight( vec2( 0.07565, 0.0865 ), heightPosition ) * 0.6 +',
        '              getHeight( vec2( 0.8, 0.99 ), heightPosition ) * 0.1;',
        'worldPosition.y = height * scale;',
      '}',
      
			'vWorldPosition = worldPosition.xyz;',
			'gl_Position = projectionMatrix * viewMatrix * worldPosition;',
		'}'
	].join('\n'),
  
	fragmentShader: [
		'uniform bool u_animate;',
		'uniform float u_time;',
    
		'const float scale = 50.0;',
		
		'varying vec3 vWorldPosition;',
    
		'void main (void) {',
      'if( u_animate ) {',
      ' float value = vWorldPosition.y / scale;',
      ' gl_FragColor = vec4( vec3( 0.5, 0.5, 0.5 ) + value * 0.2, 1.0 );',
      
      ' float textureSize = scale;',
      ' if( mod( vWorldPosition.x, textureSize ) > textureSize * 0.5 ) gl_FragColor += vec4( 0.1, 0, 0, 0 );',
      ' if( mod( vWorldPosition.z, textureSize ) > textureSize * 0.5 ) gl_FragColor -= vec4( 0.1, 0, 0, 0 );',
      
      ' textureSize *= 20.0;',
      ' if( mod( vWorldPosition.x, textureSize ) > textureSize * 0.5 ) gl_FragColor += vec4( 0, 0.1, 0, 0 );',
      ' if( mod( vWorldPosition.z, textureSize ) > textureSize * 0.5 ) gl_FragColor -= vec4( 0, 0.1, 0, 0 );',
      
      ' textureSize *= 20.0;',
      ' if( mod( vWorldPosition.x, textureSize ) > textureSize * 0.5 ) gl_FragColor += vec4( 0, 0, 0.1, 0 );',
      ' if( mod( vWorldPosition.z, textureSize ) > textureSize * 0.5 ) gl_FragColor -= vec4( 0, 0, 0.1, 0 );',
      '}',
      'else {',
      ' gl_FragColor = vec4( 0.2, 0.2, 0.2, 0.8 );',
      '}',
		'}'
	].join('\n')
};