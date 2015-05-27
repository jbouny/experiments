/**
 * @author jbouny / https://github.com/fft-ocean
 */
 
THREE.ShaderChunk["lod_pars_vertex"] = [
		
		'vec4 computePosition( vec4 position )',
		'{',
		' return modelMatrix * position;',
		'}'
	
].join('\n');

THREE.ShaderChunk["lod_vertex"] = [
	'worldPosition = computePosition( worldPosition );',
].join('\n');