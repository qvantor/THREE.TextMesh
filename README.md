# THREE.text2d for [Three.js](http://threejs.org/)
----------

**Usage**
To create new text mesh use constructor `THREE.text2d(text, font, fontSize);`

    var text = new THREE.text2d('2d text in 3d space', 'Arial', 32);
        scene.add(text.mesh);
To change text use:

    text.setText('New text');
To change position:

     text.mesh.position.set(-.5, .5, .5);