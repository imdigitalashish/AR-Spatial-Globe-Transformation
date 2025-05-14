// Register a new A-Frame component for our globe
AFRAME.registerComponent('spinning-globe', {
    init: function() {
        // Hide the loading screen once everything is ready
        const arjsLoader = document.querySelector('.arjs-loader');
        if (arjsLoader) {
            arjsLoader.style.display = 'none';
        }

        // Create the globe when component is initialized
        this.createGlobe();
    },

    createGlobe: function() {
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        
        const textureLoader = new THREE.TextureLoader();
        textureLoader.crossOrigin = 'anonymous';
        
        // Use a simpler Earth texture
        const texture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg', 
            // Success callback
            () => {
                console.log('Texture loaded successfully');
            },
            // Progress callback
            undefined,
            // Error callback
            (err) => {
                console.error('Error loading texture:', err);
            }
        );

        const material = new THREE.MeshPhongMaterial({
            map: texture,
            shininess: 5
        });
        
        this.globe = new THREE.Mesh(geometry, material);
        
        // Position the globe above the marker
        this.globe.position.y = 0.5;
        
        // Add the globe to the entity
        this.el.object3D.add(this.globe);

        // Add lighting
        this.setupLights();
    },

    setupLights: function() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.el.object3D.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 3, 5);
        this.el.object3D.add(directionalLight);
    },

    tick: function() {
        // Rotate the globe on each frame
        if (this.globe) {
            this.globe.rotation.y += 0.005;
        }
    }
});

// Add the component to the globe container
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('#globe-container');
    if (container) {
        container.setAttribute('spinning-globe', '');
    }
});