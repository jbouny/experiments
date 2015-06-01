/**
 * @author jbouny
 */

var DEMO =
{
	ms_Renderer : null,
	ms_Camera : null,
	ms_Scene : null,
	ms_Controls : null,
	ms_Ocean : null,
  ms_PlaneGroup : null,
  ms_ProjectedGrid : null,

	Initialize : function () {

		this.ms_Renderer = new THREE.WebGLRenderer();
		this.ms_Renderer.context.getExtension( 'OES_texture_float' );
		this.ms_Renderer.context.getExtension( 'OES_texture_float_linear' );
		this.ms_Renderer.setClearColor( 0xbbbbbb );
    
    this.ms_Clock = new THREE.Clock();

		document.body.appendChild( this.ms_Renderer.domElement );

		this.ms_Scene = new THREE.Scene();

		this.ms_Camera = new THREE.PerspectiveCamera( 55.0, WINDOW.ms_Width / WINDOW.ms_Height, 0.5, 1000000 );
		this.ms_Camera.position.set( 500, 1100, 2200 );
		this.ms_Camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
		this.ms_Scene.add( this.ms_Camera );

		// Initialize Orbit control
		this.ms_Controls = new THREE.OrbitControls( this.ms_Camera, this.ms_Renderer.domElement );
		this.ms_Controls.target.set( 0, 0, 0 );
		this.ms_Controls.maxDistance = 200000.0;
    
    this.ms_Animate = true;
    this.ms_Update = true;
    this.ms_Wireframe = false;
    this.ms_MeshType = "LOD";
    this.ms_BasicGridResolution = 256;
    this.ms_BasicGridSize = 10000;

		this.InitializeScene();

		this.InitGui();
    
	},

	InitializeScene : function InitializeScene() {

		// Add light
		this.ms_MainDirectionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
		this.ms_MainDirectionalLight.position.set( -0.2, 0.5, 1 );
		this.ms_Scene.add( this.ms_MainDirectionalLight );
    
    // Add axis helper
    var axis = new THREE.AxisHelper(1000);
    this.ms_Scene.add( axis );
    
    // Add some color boxes
    for ( var i = -2; i <= 2; ++ i ) {
      for ( var j = -2; j <= 2; ++ j ) {
        for ( var k = 0-2; k <= 2; ++ k ) {
          var geometry = new THREE.BoxGeometry( 100, 100, 100 );
          var material = new THREE.MeshLambertMaterial( { fog: true, side: THREE.DoubleSide, color: new THREE.Color( 0.5 + i * 0.2, 0.5 + j * 0.2, 0.5 + k * 0.2 ) } );
          var mesh = new THREE.Mesh( geometry, material );
          mesh.position.set( i * 300, j * 300, k * 300 );
          this.ms_Scene.add( mesh );
        }
      }
    }

		// Initialize Ocean
		this.ms_GeometryResolution = 128;
		this.ms_Ocean = new THREE.Ocean( this.ms_Renderer, this.ms_Camera, this.ms_Scene,
		{
			GEOMETRY_RESOLUTION: this.ms_GeometryResolution
		} );
    
    // Add custom geometry
    this.InitLOD( 128, 8, 500 );
    this.ChangeMesh();
    
    this.ChangeWireframe();
    this.ChangeAnimateMaterial();
	},
  
  InitLOD : function InitLOD( resolution, levels, scale ) {
  
    this.ms_LOD = new THREE.LODPlane( {
      resolution: resolution,
      levels: levels,
      scale: scale
    } );
  
  },

	InitGui : function InitGui() {

		// Initialize UI
		var gui = new dat.GUI();
    
		gui.add( DEMO, 'ms_Wireframe' ).name( 'Wireframe' ).onChange( function() { DEMO.ChangeWireframe(); } );
		gui.add( DEMO, 'ms_Animate' ).name( 'Animate' ).onChange( function() { DEMO.ChangeAnimateMaterial(); } );
		gui.add( DEMO, 'ms_Update' ).name( 'Update animation' );
    gui.add( DEMO, 'ms_MeshType', [ 'Projected grid', 'LOD', 'Plane' ] ).name( 'Mesh' ).onChange( function() { DEMO.ChangeMesh(); } );
    
    var folderLOD = gui.addFolder('LOD');
    folderLOD.add( this.ms_LOD, 'lodResolution', 8, 512 ).name( 'Resolution' ).listen().onChange( function() { DEMO.ChangeMesh(); } );
    folderLOD.add( this.ms_LOD, 'lodLevels', 1, 15 ).name( 'LOD levels' ).listen().onChange( function() { DEMO.ChangeMesh(); } );
    folderLOD.add( this.ms_LOD, 'lodScale', 1, 2000 ).name( 'Scale' ).onChange( function() { DEMO.ms_LOD.setLODScale( DEMO.ms_LOD.lodScale ); } );
    
    var folderProjected = gui.addFolder('Projected grid');
    folderProjected.add( DEMO, 'ms_GeometryResolution', 8, 1024 ).name( 'Resolution' ).onChange( function() { DEMO.ChangeMesh(); } );
    
    var folderBasic = gui.addFolder('Basic grid');
    folderBasic.add( DEMO, 'ms_BasicGridResolution', 8, 1024 ).name( 'Resolution' ).onChange( function() { DEMO.ChangeMesh(); } );
    folderBasic.add( DEMO, 'ms_BasicGridSize', 1000, 100000 ).name( 'Size' ).onChange( function() { DEMO.ChangeMesh(); } );

	},
  
  ApplyOnGroupElements : function ApplyOnGroupElements( expression ) {
  
    if ( this.ms_PlaneGroup !== null ) {
      for ( var i in this.ms_PlaneGroup.children ) {
      
        expression( this.ms_PlaneGroup.children[i] );
        
      }
    }
  
  },
  
  ChangeWireframe : function ChangeWireframe() {
  
    var wireframe = this.ms_Wireframe;
    this.ApplyOnGroupElements( function( element ) {
      element.material.wireframe = wireframe;
    } );
  
  },
  
  ChangeAnimateMaterial : function ChangeAnimateMaterial() {
  
    var animate = this.ms_Animate;
    this.ApplyOnGroupElements( function( element ) {
      element.material.uniforms.u_animate.value = animate;
    } );
  
  },
  
  ChangeMesh : function ChangeMesh() {
  
    if ( this.ms_PlaneGroup !== null ) {
    
      this.ms_PlaneGroup.parent.remove( this.ms_PlaneGroup );
      this.ms_PlaneGroup = null;
      
    }
    
    function optionalParameter(value, defaultValue) {
      return value !== undefined ? value : defaultValue;
    };
  
    switch( this.ms_MeshType ) {
      case 'LOD':
        this.LoadLOD();
        break;
        
      case 'Plane':
        this.LoadBasicGrid();
        break;
        
      default:
        this.LoadProjectedMesh();
        break;
    }
  
  },
  
  LoadProjectedMesh : function LoadProjectedMesh() {
  
    var resolution = Math.round( this.ms_GeometryResolution );
    if ( resolution >= 1 && resolution !== this.ms_LastGeometryResolution ) {
    
      this.ms_LastGeometryResolution = resolution;
      var geometry = new THREE.PlaneBufferGeometry( 1, 1, resolution, resolution );
      this.ms_Camera.remove( this.ms_Ocean.oceanMesh );
      this.ms_Ocean.oceanMesh.geometry = geometry;
      
    }
    
    this.ms_PlaneGroup = new THREE.Object3D();
    this.ms_PlaneGroup.add( this.ms_Ocean.oceanMesh );
    this.ms_Camera.add( this.ms_PlaneGroup );
    
    this.ChangeWireframe();
    this.ChangeAnimateMaterial();
    
  },
  
  LoadLOD : function LoadLOD() {
    
    var oceanShader = THREE.ShaderLib["ocean_main"];
    var uniforms = THREE.UniformsUtils.clone( oceanShader.uniforms );
    uniforms['u_scale'] = { type: 'f', value: 1.0 };
    uniforms['u_resolution'] = { type: 'i', value: this.ms_LOD.lodResolution };
    uniforms['u_level'] = { type: 'i', value: 1 };
    
    var lodMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: oceanShader.buildVertexShader( 'lod' ),
      fragmentShader: oceanShader.fragmentShader,
      side: THREE.DoubleSide,
      wireframe: this.ms_Wireframe
    });
    
    this.ms_LOD.generate( {
        material: lodMaterial
    } );
    
    this.ms_PlaneGroup = this.ms_LOD;
    
    this.ms_Scene.add( this.ms_LOD );
    
    this.ChangeAnimateMaterial();
    
  },
  
  LoadBasicGrid : function LoadBasicGrid() {
  
    var geometry = this.ms_LOD.generateLODGeometry( this.ms_BasicGridResolution );
    var oceanShader = THREE.ShaderLib["ocean_main"];
    
    var material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(oceanShader.uniforms),
      vertexShader: oceanShader.buildVertexShader( 'default' ),
      fragmentShader: oceanShader.fragmentShader,
      side: THREE.DoubleSide,
      wireframe: this.ms_Wireframe
    });
    
    var mesh = new THREE.Mesh( geometry, material );
    mesh.scale.set( this.ms_BasicGridSize, this.ms_BasicGridSize, this.ms_BasicGridSize );
    
    this.ms_PlaneGroup = new THREE.Object3D();
    this.ms_PlaneGroup.add( mesh );
    this.ms_Scene.add( this.ms_PlaneGroup );
    
    this.ChangeAnimateMaterial();
  
  },

	Display : function () {

		this.ms_Renderer.render( this.ms_Scene, this.ms_Camera );

	},

	Update : function () {
    
    var delta = this.ms_Clock.getDelta();

    if ( this.ms_Update ) {
      this.ApplyOnGroupElements( function( element ) {
      
        element.material.uniforms.u_time.value += delta;
        
      } );
    }
    
		this.ms_Controls.update();
		this.Display();

	},

	Resize : function ( inWidth, inHeight ) {

		this.ms_Camera.aspect = inWidth / inHeight;
		this.ms_Camera.updateProjectionMatrix();
		this.ms_Renderer.setSize( inWidth, inHeight );
		this.Display();

	}
};
