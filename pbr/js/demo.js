if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

THREE.ShaderLib[ 'cubemap' ] = {

  uniforms: {
    cubemap: { type: "t", value: null }
  },

  vertexShader: [
    "varying vec3 vPosition;",
      
    "void main() {",
      "vPosition = position;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}",
  ].join( "\n" ),

  fragmentShader: [
    "uniform samplerCube cubemap;",
    "varying vec3 vPosition;",
    
    "void main() ",
    "{",
      "gl_FragColor = textureCube(cubemap, normalize(vPosition));",
    "}",
  ].join( "\n" )

};

THREE.ShaderLib[ 'pbr' ] = {

  uniforms: {
    blur:      { type: "f", value: 0.1 },
    sky:       { type: "t", value: null },
    grunge:    { type: "t", value: null },
    metallic:  { type: "f", value: 0.0 },
    baseColor: { type: "v3", value: new THREE.Vector3() },
    lightPos:  { type: "v3", value: new THREE.Vector3() },
  },

  vertexShader: [
    "varying vec3 vPosition;",
    "varying vec3 vNormal;",
    "varying vec3 vEye;",
    "varying vec2 vUv;",

    "vec3 getCameraPos()",
    "{",
      "return - viewMatrix[3].xyz * mat3(",
        "viewMatrix[0].xyz,",
        "viewMatrix[1].xyz,",
        "viewMatrix[2].xyz",
      ");",
    "}",
      
    "void main() {",
      "vPosition = position;",
      "vNormal = normal;",
      "vEye = getCameraPos();",
      "vUv = uv;",
      
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}",
  ].join( "\n" ),

  fragmentShader: [

    "varying vec3 vPosition;",
    "varying vec3 vNormal;",
    "varying vec3 vEye;",
    "varying vec2 vUv;",
    
    "uniform samplerCube sky;",
    "uniform sampler2D grunge;",
    "uniform vec3 lightPos;",
    "uniform float metallic;",
    "uniform vec3 baseColor;",
    
    // PBR implementation from Alexandre Pestana
    // www.alexandre-pestana.com
    "#define PI 3.14159265359",

    "vec3 Diffuse(vec3 pAlbedo)",
    "{",
    "    return pAlbedo/PI;",
    "}",
    
    //-------------------------- Normal distribution functions --------------------------------------------
    "float NormalDistribution_GGX(float a, float NdH)",
    "{",
    "  // Isotropic ggx.",
    "  float a2 = a*a;",
    "  float NdH2 = NdH * NdH;",
    "  float denominator = NdH2 * (a2 - 1.0) + 1.0;",
    "  denominator *= denominator;",
    "  denominator *= PI;",
    "  return a2 / denominator;",
    "}",

    //-------------------------- Geometric shadowing -------------------------------------------
    "float Geometric_Smith_Schlick_GGX(float a, float NdV, float NdL)",
    "{",
    "  // Smith schlick-GGX.",
    "  float k = a * 0.5;",
    "  float GV = NdV / (NdV * (1.0 - k) + k);",
    "  float GL = NdL / (NdL * (1.0 - k) + k);",
    "  return GV * GL;",
    "}",

    //-------------------------- Fresnel ------------------------------------
    "vec3 Fresnel_Schlick(vec3 specularColor, vec3 h, vec3 v)",
    "{",
    "  return (specularColor + (1.0 - specularColor) * pow((1.0 - clamp(dot(v, h), 0.0, 1.0)), 5.0));",
    "}",

    //-------------------------- BRDF terms ------------------------------------
    "float Specular_D(float a, float NdH)",
    "{",
    "  return NormalDistribution_GGX(a, NdH);",
    "}",

    "vec3 Specular_F(vec3 specularColor, vec3 h, vec3 v)",
    "{",
    "  return Fresnel_Schlick(specularColor, h, v);",
    "}",

    "vec3 Specular_F_Roughness(vec3 specularColor, float a, vec3 h, vec3 v)",
    "{",
    "  return (specularColor + (max(vec3(1.0 - a), specularColor) - specularColor) * pow((1.0 - clamp(dot(v, h), 0.0, 1.0)), 5.0));",
    "}",

    "float Specular_G(float a, float NdV, float NdL, float NdH, float VdH, float LdV)",
    "{",
    "  return Geometric_Smith_Schlick_GGX(a, NdV, NdL);",
    "}",

    "vec3 Specular(vec3 specularColor, vec3 h, vec3 v, vec3 l, float a, float NdL, float NdV, float NdH, float VdH, float LdV)",
    "{",
    "  return ((Specular_D(a, NdH) * Specular_G(a, NdV, NdL, NdH, VdH, LdV)) * Specular_F(specularColor, v, h) ) / (4.0 * NdL * NdV + 0.0001);",
    "}",

    "vec3 ComputeLight(vec3 albedoColor,vec3 specularColor, vec3 normal, vec3 lightPosition, vec3 lightColor, vec3 lightDir, vec3 viewDir, float roughness)",
    "{",
    "  // Compute some useful values.",
    "  float NdL = clamp(dot(normal, lightDir), 0.0, 1.0);",
    "  float NdV = clamp(dot(normal, viewDir), 0.0, 1.0);",
    "  vec3 h = normalize(lightDir + viewDir);",
    "  float NdH = clamp(dot(normal, h), 0.0, 1.0);",
    "  float VdH = clamp(dot(viewDir, h), 0.0, 1.0);",
    "  float LdV = clamp(dot(lightDir, viewDir), 0.0, 1.0);",
    "  float a = max(0.001, roughness * roughness);",
    "  vec3 cDiff = Diffuse(albedoColor);",
    "  vec3 cSpec = Specular(specularColor, h, viewDir, lightDir, a, NdL, NdV, NdH, VdH, LdV);",
    "  return lightColor * NdL * (cDiff * (1.0 - cSpec) + cSpec);",
    "}",

    "vec3 ComputeEnvColor(float roughness, vec3 reflectionVector)",
    "{",
      "vec3 reflect = normalize(reflect(vPosition - vEye, vNormal));",
      "vec3 left = cross(reflect, vec3(0.0, 1.0, 0.0));",
      "vec3 up = cross(reflect, left);",
      "vec3 reflection;",
      "if( roughness > 0.0 ) {",
        "for( int i = -1; i <= 1; ++i ) {",
          "for( int j = -1; j <= 1; ++j ) {",
            "vec3 ray = reflect + ((left * float(i)) + (up * float(j))) * roughness;",
            "reflection += textureCube(sky, ray).xyz * 0.11111;",
          "}",
        "}",
      "}",
      "else {",
        "reflection += textureCube(sky, reflect).xyz;",
      "}",
      "return reflection;",
    "}",
    
    "void main() ",
    "{",
      "float roughness = texture2D(grunge, vUv).x;",
      "vec3 reflectVec = normalize(reflect(vPosition - vEye, vNormal));",
      
      "vec3 viewDir = normalize(vEye - vPosition);",
      "vec3 albedoCorrected = pow(abs(baseColor.rgb), vec3(2.2));",

      "vec3 realAlbedo = baseColor - baseColor * metallic;",
      "vec3 realSpecularColor = mix(vec3(0.03), baseColor, metallic);",
      
      "vec3 envColor = ComputeEnvColor(roughness, reflectVec);",
      "vec3 light1 = ComputeLight( realAlbedo, realSpecularColor, vNormal, lightPos, envColor, lightPos, viewDir, roughness);",

      "vec3 envFresnel = Specular_F_Roughness(realSpecularColor, roughness * roughness, vNormal, viewDir);",

      "gl_FragColor = vec4(light1 + envFresnel * envColor + realAlbedo * 0.01, 1.0);",
    "}",

  ].join( "\n" )

};

var container;
var camera, controls, scene, renderer;
var sky, skyScene, skyCamera, pbr;

init();
render();

function initSky() {

  skyScene = new THREE.Scene();
  skyCamera = new THREE.CubeCamera( 1, 100000, 512 );
  scene.add( skyCamera );

  // Add Sky Mesh
  sky = new THREE.Sky();
  skyScene.add( sky.mesh );

  /// GUI

  var effectController  = {
    turbidity: 10,
    reileigh: 2,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    luminance: 1,
    inclination: 0.4, // elevation / inclination
    azimuth: 0.25, // Facing front,
    metallic: 0.3,
    baseColorR: 1.0,
    baseColorG: 0.8,
    baseColorB: 0.9
  };

  var distance = 100000;

  function guiChanged() {
    var uniforms = sky.uniforms;
    uniforms.turbidity.value = effectController.turbidity;
    uniforms.reileigh.value = effectController.reileigh;
    uniforms.luminance.value = effectController.luminance;
    uniforms.mieCoefficient.value = effectController.mieCoefficient;
    uniforms.mieDirectionalG.value = effectController.mieDirectionalG;

    var theta = Math.PI * ( effectController.inclination - 0.5 );
    var phi = 2 * Math.PI * ( effectController.azimuth - 0.5 );

    var sunPosition = sky.uniforms.sunPosition.value;
    sunPosition.x = distance * Math.cos( phi );
    sunPosition.y = distance * Math.sin( phi ) * Math.sin( theta );
    sunPosition.z = distance * Math.sin( phi ) * Math.cos( theta );
    
    var pbrUniforms = pbr.uniforms;
    pbrUniforms.blur.value = effectController.blur;
    pbrUniforms.lightPos.value.copy(sunPosition);
    pbrUniforms.metallic.value = effectController.metallic;
    pbrUniforms.baseColor.value.set(
      effectController.baseColorR,
      effectController.baseColorG,
      effectController.baseColorB
    );
  }

  var gui = new dat.GUI();

  gui.add( effectController, "turbidity", 1.0, 20.0, 0.1 ).onChange( guiChanged );
  gui.add( effectController, "reileigh", 0.0, 4, 0.001 ).onChange( guiChanged );
  gui.add( effectController, "mieCoefficient", 0.0, 0.1, 0.001 ).onChange( guiChanged );
  gui.add( effectController, "mieDirectionalG", 0.0, 1, 0.001 ).onChange( guiChanged );
  gui.add( effectController, "luminance", 0.0, 2 ).onChange( guiChanged );
  gui.add( effectController, "inclination", 0, 1, 0.0001 ).onChange( guiChanged );
  gui.add( effectController, "azimuth", 0, 1, 0.0001 ).onChange( guiChanged );
  gui.add( effectController, "metallic", 0, 1, 0.1 ).onChange( guiChanged );
  gui.add( effectController, "baseColorR", 0, 1, 0.1 ).onChange( guiChanged );
  gui.add( effectController, "baseColorG", 0, 1, 0.1 ).onChange( guiChanged );
  gui.add( effectController, "baseColorB", 0, 1, 0.1 ).onChange( guiChanged );

  return guiChanged;
}

function init() {

  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100000 );
  camera.position.set( -3.0, 2.0, -1.8 );

  //camera.setLens(20);

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.enableZoom = false;
  controls.enablePan = false;

  var updateData = initSky();
  
  // Add environment
  {
    var envShader = THREE.ShaderLib[ "cubemap" ];
    var envUniforms = THREE.UniformsUtils.clone( envShader.uniforms );
    envUniforms.cubemap.value = skyCamera.renderTarget;
    var envMaterial = new THREE.ShaderMaterial( {
      fragmentShader: envShader.fragmentShader,
      vertexShader: envShader.vertexShader,
      uniforms: envUniforms,
      side: THREE.BackSide
    } );
    scene.add( new THREE.Mesh( new THREE.BoxGeometry( 100000, 100000, 100000 ), envMaterial ) );
  }
  
  {
    var grunge = THREE.ImageUtils.loadTexture( "img/grunge.jpg" );
    grunge.wrapS = THREE.RepeatWrapping;
    grunge.wrapT = THREE.RepeatWrapping;
    
    var pbrShader = THREE.ShaderLib[ "pbr" ];
    var pbrUniforms = THREE.UniformsUtils.clone( pbrShader.uniforms );
    pbrUniforms.sky.value = skyCamera.renderTarget;
    pbrUniforms.grunge.value = grunge;
    

    pbr = new THREE.ShaderMaterial( {
      fragmentShader: pbrShader.fragmentShader,
      vertexShader: pbrShader.vertexShader,
      uniforms: pbrUniforms
    } );
    var box = new THREE.BoxGeometry( 2, 2, 2 );
    scene.add( new THREE.Mesh( box, pbr ) );
  }
  
  updateData();
  
  window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

function render() {
  requestAnimationFrame( render );

  skyCamera.updateCubeMap( renderer, skyScene );
  renderer.render( scene, camera );
}