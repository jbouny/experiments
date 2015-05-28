THREE.ShaderLib['ocean_main'] = {
	uniforms: {

    'u_animate':  { type: 'i', value: true },
    'u_time':     { type: 'f', value: 0.0 },

  },
  
	buildVertexShader: function( shaderChunk ) { return [
		'precision highp float;',
		
		'varying vec3 vWorldPosition;',
    
		'uniform bool u_animate;',
		'uniform float u_time;',
    
		'const float scale = 5.0;',
		
		THREE.ShaderChunk[ shaderChunk + "_pars_vertex" ],
			
    'float getHeight( vec2 inDir, vec3 position ) {',
    ' float height = sin( position.x * inDir.x + u_time ) * 0.8 + cos( position.z * inDir.y + u_time  ) * 0.2 ;',
    ' return height * height * height ;',
    '}',

		'void main (void) {',
			
			'vec4 worldPosition = vec4( position, 1.0 );',
      
			THREE.ShaderChunk[ shaderChunk + "_vertex" ],
			
			'if( u_animate ) {;',
        'vec3 heightPosition = worldPosition.xyz * 10.0 / scale;',
        
        'float height = getHeight( vec2( 0.3565, 0.265 ), heightPosition ) * 0.3 +',
        '               getHeight( vec2( 0.07565, 0.0865 ), heightPosition ) * 0.6 +',
        '               getHeight( vec2( 0.8, 0.99 ), heightPosition ) * 0.1;',
        'float x = mod( heightPosition.x * 0.1 + u_time * 5.0, 10.0);',
        'height = 5.0 - sqrt( x * ( 2.0 * 5.0 - x) );',
        //'height += ( x - 5.0 ) * ( x - 5.0 ) / 5.0;',
        'worldPosition.y = height * scale;',
      '}',
      
			'vWorldPosition = worldPosition.xyz;',
			'gl_Position = projectionMatrix * viewMatrix * worldPosition;',
		'}'
	].join('\n'); },
  
	fragmentShader: [
		'uniform bool u_animate;',
		'uniform float u_time;',
    
		'const float scale = 5.0;',
		
		'varying vec3 vWorldPosition;',
    
		'void main (void) {',
      'if( u_animate ) {',
      ' float value = ( vWorldPosition.y / scale / 5.0 ) - 0.5;',
      ' gl_FragColor = vec4( vec3( 0.5, 0.5, 0.5 ) + value * 0.1, 1.0 );',
      
      ' float textureSize = 10.0;',
      ' if( mod( vWorldPosition.x, textureSize ) > textureSize * 0.5 ) gl_FragColor += vec4( 0.2, 0, 0, 0 );',
      ' if( mod( vWorldPosition.z, textureSize ) > textureSize * 0.5 ) gl_FragColor -= vec4( 0.2, 0, 0, 0 );',
      
      ' textureSize *= 20.0;',
      ' if( mod( vWorldPosition.x, textureSize ) > textureSize * 0.5 ) gl_FragColor += vec4( 0, 0.2, 0, 0 );',
      ' if( mod( vWorldPosition.z, textureSize ) > textureSize * 0.5 ) gl_FragColor -= vec4( 0, 0.2, 0, 0 );',
      
      ' textureSize *= 20.0;',
      ' if( mod( vWorldPosition.x, textureSize ) > textureSize * 0.5 ) gl_FragColor += vec4( 0, 0, 0.2, 0 );',
      ' if( mod( vWorldPosition.z, textureSize ) > textureSize * 0.5 ) gl_FragColor -= vec4( 0, 0, 0.2, 0 );',
      '}',
      'else {',
      ' gl_FragColor = vec4( 0.2, 0.2, 0.2, 0.8 );',
      '}',
		'}'
	].join('\n')
};