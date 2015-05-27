/**
 * @author jbouny / https://github.com/fft-ocean
 */
 
THREE.ShaderChunk["default_pars_vertex"] = [
		
		'vec4 computePosition( vec4 position )',
		'{',
		' return modelMatrix * position;',
		'}'
	
].join('\n');

THREE.ShaderChunk["default_vertex"] = [
	'worldPosition = computePosition( worldPosition );',
].join('\n');