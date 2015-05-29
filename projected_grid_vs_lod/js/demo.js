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
		this.ms_Controls.userPan = false;
		this.ms_Controls.target.set( 0, 0, 0 );
		this.ms_Controls.noKeys = true;
		this.ms_Controls.userPanSpeed = 0;
		this.ms_Controls.minDistance = 0;
		this.ms_Controls.maxDistance = 200000.0;
		this.ms_Controls.minPolarAngle = 0;
		this.ms_Controls.maxPolarAngle = Math.PI * 0.75;
    
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
  
  GenerateLODGeometry : function GenerateLODGeometry( dimension, hasHole ) {
  
    function optionalParameter(value, defaultValue) {
      return value !== undefined ? value : defaultValue;
    };
    
    dimension = optionalParameter( dimension, 64 );
    hasHole = optionalParameter( hasHole, false );
  
    // Guarantee dimension expectations
    dimension = Math.floor( dimension );
    if( dimension % 2 == 1 || dimension < 1 ) {
      //console.warn( "DEMO.GenerateLODGeometry dimension should be positive or pair" );
      dimension++;
    }
    var pow = 0;
    while( ( dimension *= 0.5 ) >= 1.0 ) {
      pow++;
    }
    dimension = Math.pow( 2, pow );
    this.ms_LODDimension = dimension;
    
    var geometry = new THREE.BufferGeometry();
    var halfSize = Math.round( dimension * 0.5 );
		
		var nbPoints = ( dimension + 3 ) * ( dimension + 3 );
		var nbTriangles = ( dimension + 2 ) * ( dimension + 2 ) * 2 ;
		geometry.addAttribute( 'index', new THREE.BufferAttribute(new Uint32Array( nbTriangles * 3 ), 1) );
		geometry.addAttribute( 'position', new THREE.BufferAttribute(new Float32Array( nbPoints * 3 ), 3) );
		geometry.addAttribute( 'normals', new THREE.BufferAttribute(new Float32Array( nbPoints * 3 ), 3) );
    
    // Generate 3d vertices and normals
    {
      var positions = geometry.getAttribute( 'position' ).array;
      var normals = geometry.getAttribute( 'normals' ).array;
      var index = 0;
      
      for( var x = -halfSize - 1; x <= halfSize + 1; ++x )
      {
        for( var z = -halfSize - 1; z <= halfSize + 1; ++z )
        {
          normals[index] = 0;
          normals[index + 1] = 1;
          normals[index + 2] = 0;
        
          positions[index++] = x / dimension;
          positions[index++] = 0;
          positions[index++] = z / dimension;
        }
      }
    }
		
    // Generate triangles with vertices indices
    {
      var indices = geometry.getAttribute( 'index' ).array,
          index = 0,
          width = dimension + 3,
          insideLow = dimension / 4,
          insideHigh = insideLow * 3;
      for( var x = 0; x <= dimension + 1; ++x )
      {
        var left = x,
            right = x + 1,
            insideXHole = x > insideLow && x <= insideHigh;
        for( var z = 0; z <= dimension + 1; ++z )
        {
          var front = z,
              back = z + 1,
              insideZHole = z > insideLow && z <= insideHigh;
              
          if( hasHole && insideXHole && insideZHole )
            continue;
          
          // First triangle
          indices[index++] = width * left + back;
          indices[index++] = width * right + back;
          indices[index++] = width * left + front;
          
          // Second triangle
          indices[index++] = width * left + front;
          indices[index++] = width * right + back
          indices[index++] = width * right + front;
        }
      }
    }
    
    return geometry;
  
  },
  
  GenerateLODMesh : function GenerateLODMesh( geometry, material, scale, level ) {
    
    var lodMaterial = material.clone();
    lodMaterial.uniforms.u_scale.value = scale;
    lodMaterial.uniforms.u_level.value = level;
    var mesh = new THREE.Mesh( geometry, lodMaterial );
    
    return mesh;
    
  },
  
  InitLOD : function InitLOD( dimension, levels, initialScale ) {
  
    function optionalParameter(value, defaultValue) {
      return value !== undefined ? value : defaultValue;
    };
    
    this.ms_LODDimension = optionalParameter( dimension, 64 );
    this.ms_LODLevels = optionalParameter( levels, 10 );
    this.ms_LODInitialScale = optionalParameter( initialScale, 5 );
    
    this.ms_GridGeometry = this.GenerateLODGeometry( this.ms_LODDimension );
    this.ms_GridHoleGeometry = this.GenerateLODGeometry( this.ms_LODDimension, true );
  
  },

	InitGui : function InitGui() {

		// Initialize UI
		var gui = new dat.GUI();
    
		gui.add( DEMO, 'ms_Wireframe' ).name( 'Wireframe' ).onChange( function() { DEMO.ChangeWireframe(); } );
		gui.add( DEMO, 'ms_Animate' ).name( 'Animate' ).onChange( function() { DEMO.ChangeAnimateMaterial(); } );
		gui.add( DEMO, 'ms_Update' ).name( 'Update animation' );
    gui.add( DEMO, 'ms_MeshType', [ 'Projected grid', 'LOD', 'Plane' ] ).name( 'Mesh' ).onChange( function() { DEMO.ChangeMesh(); } );
    
    var folderLOD = gui.addFolder('LOD');
    folderLOD.add( DEMO, 'ms_LODDimension', 8, 512 ).name( 'Resolution' ).listen().onChange( function() { DEMO.ChangeMesh( true ); } );
    folderLOD.add( DEMO, 'ms_LODLevels', 1, 15 ).name( 'LOD levels' ).listen().onChange( function() { DEMO.ChangeMesh(); } );
    folderLOD.add( DEMO, 'ms_LODInitialScale', 1, 2000 ).name( 'Scale' ).onChange( function() { DEMO.ChangeMesh(); } );
    
    var folderProjected = gui.addFolder('Projected grid');
    folderProjected.add( DEMO, 'ms_GeometryResolution', 8, 1024 ).name( 'Resolution' ).onChange( function() { DEMO.ChangeMesh(); } );
    
    var folderBasic = gui.addFolder('Basic grid');
    folderBasic.add( DEMO, 'ms_BasicGridResolution', 8, 1024 ).name( 'Resolution' ).onChange( function() { DEMO.ChangeMesh(); } );
    folderBasic.add( DEMO, 'ms_BasicGridSize', 1000, 100000 ).name( 'Size' ).onChange( function() { DEMO.ChangeMesh(); } );

	},
  
  ChangeWireframe : function ChangeWireframe() {
  
    if ( this.ms_PlaneGroup !== null ) {
      for ( var i in this.ms_PlaneGroup.children ) {
      
        this.ms_PlaneGroup.children[i].material.wireframe = this.ms_Wireframe;
        
      }
    }
  
  },
  
  ChangeAnimateMaterial : function ChangeAnimateMaterial() {
  
    if ( this.ms_PlaneGroup !== null ) {
      for ( var i in this.ms_PlaneGroup.children ) {
      
        this.ms_PlaneGroup.children[i].material.uniforms.u_animate.value = this.ms_Animate;
        
      }
    }
  
  },
  
  ChangeMesh : function ChangeMesh( updateAll ) {
  
    if ( this.ms_PlaneGroup !== null ) {
    
      this.ms_PlaneGroup.parent.remove( this.ms_PlaneGroup );
      this.ms_PlaneGroup = null;
      
    }
    
    function optionalParameter(value, defaultValue) {
      return value !== undefined ? value : defaultValue;
    };
    
    updateAll = optionalParameter( updateAll, false );
  
    switch( this.ms_MeshType ) {
      case 'LOD':
        if ( updateAll ) {
          this.InitLOD( this.ms_LODDimension, this.ms_LODLevels, this.ms_LODInitialScale );
        }
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
    
    this.ms_PlaneGroup = new THREE.Object3D();
    
    var oceanShader = THREE.ShaderLib["ocean_main"];
    var uniforms = THREE.UniformsUtils.clone(oceanShader.uniforms);
    uniforms['u_scale'] = { type: 'f', value: 1.0 };
    uniforms['u_resolution'] = { type: 'i', value: this.ms_LODDimension };
    uniforms['u_level'] = { type: 'i', value: 1 };
    
    var lodMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: oceanShader.buildVertexShader( 'lod' ),
      fragmentShader: oceanShader.fragmentShader,
      side: THREE.DoubleSide,
      wireframe: this.ms_Wireframe
    });
    
    var scale = this.ms_LODInitialScale;
    for ( var i = 0; i < this.ms_LODLevels; ++i ) {
      
      var geometry = ( i == 0 ? this.ms_GridGeometry : this.ms_GridHoleGeometry );
      this.ms_PlaneGroup.add( this.GenerateLODMesh( geometry, lodMaterial, scale, i ) );
      scale *= 2;
      
    }
    this.ms_LODLevels = Math.floor( this.ms_LODLevels );
    
    this.ms_Scene.add( this.ms_PlaneGroup );
    
    this.ChangeAnimateMaterial();
    
  },
  
  LoadBasicGrid : function LoadBasicGrid() {
  
    var geometry = this.GenerateLODGeometry( this.ms_BasicGridResolution );
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
      if ( this.ms_PlaneGroup !== null ) {
        for ( var i in this.ms_PlaneGroup.children ) {
        
          this.ms_PlaneGroup.children[i].material.uniforms.u_time.value += delta;
          
        }
      }
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
