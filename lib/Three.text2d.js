// @license http://opensource.org/licenses/MIT
// copyright Paul Irish 2015

THREE.text2d = function (text, fontName, size) {

    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');
    var w = canvas.width,
        h = canvas.height;

    var string = ' abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890,.-;:_!"·$%&/()=?¿<>'
    var texture = null;

    var fontName = fontName || 'Arial';
    var size = size || 64;

    function measureGlyphs() {

        var w = 0;
        ctx.font = size + 'px ' + fontName;
        var y = size;
        for (var j in string) {
            var res = ctx.measureText(string[j]);
            if (res.width > w) w = res.width;
        }

        var h = Math.ceil(1.5 * size);

        canvas.width = w;
        canvas.height = string.length * h;

        ctx.font = size + 'px ' + fontName;
        ctx.fillStyle = '#ffffff'

        var s = '';
        var y = size;
        for (var j in string) {
            ctx.fillText(string[j], 0, y);
            y += h
        }

        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var d = imageData.data;

        var ptr = 0;
        var left = {};
        var right = {};
        var min = 1000, max = 0;
        for (var y = 0; y < canvas.height; y++) {
            for (var x = 0; x < canvas.width; x++) {
                var a = d[ptr];
                if (a > 0) {
                    if (x < min) min = x;
                    if (x > max) max = x;
                }
                ptr += 4;
            }
            if (y > 0 && ( y % h === 0 )) {
                var p = Math.floor(y / h) - 1;
                left[p] = min - 2;
                right[p] = max + 2;
                min = 1000, max = 0;
            }
        }

        var dimensions = []
        for (var j in string) {
            var minP = left[j];
            var maxP = right[j];
            dimensions[j] = maxP - minP;
        }

        dimensions[0] = .25 * size;

        var fCanvas = document.createElement('canvas');
        var side = Math.ceil(Math.sqrt(string.length));
        fCanvas.width = 1024
        fCanvas.height = 2048
        var cw = fCanvas.width / side;
        var ch = fCanvas.height / side;
        var fCtx = fCanvas.getContext('2d');

        //document.body.appendChild( fCanvas );
        fCanvas.style.position = 'absolute'
        fCanvas.style.border = '1px solid red'

        var x = 0;
        var y = 0;
        fCtx.strokeStyle = '#000000'
        fCtx.font = size + 'px ' + fontName;
        fCtx.fillStyle = '#ffffff'
        fCtx.lineWidth = 2;
        for (var j in string) {
            fCtx.fillText(string[j], x * cw, ( y + .75 ) * ch);
            fCtx.strokeText(string[j], x * cw, ( y + .75 ) * ch);
            /*fCtx.beginPath();
             fCtx.rect( x * cw, y * ch, cw, ch );
             fCtx.stroke()*/
            x++;
            if (x >= side) {
                y++;
                x = 0;
            }
        }

        texture = new THREE.Texture(fCanvas);
        texture.needsUpdate = true;

        window.leftPosition = left;
        window.string = string;
        window.texture = texture;
        window.dimensions = dimensions;
        window.size = ch;

    }

    var testStr = 'lorem ipsum dolor sit amet';

    ctx.font = size + 'px ' + fontName;
    var res = ctx.measureText(testStr);
    var defaultWidth = res.width;

    var div = document.createElement('div');
    div.textContent = testStr;
    div.style.fontFamily = fontName;
    document.body.appendChild(div);
    document.body.removeChild(div);

    measureGlyphs();


    //@todo better make it with promise, if its need to

    //function waitForFont() {
    //
    //    ctx.font = size + 'px ' + fontName;
    //    var res = ctx.measureText(testStr);
    //    if (res.width != defaultWidth) {
    //        measureGlyphs();
    //        createMesh();
    //    } else {
    //        setTimeout(waitForFont, 50);
    //    }
    //
    //}
    //
    //waitForFont();

    this.setText = function (string) {
        var chars = convertString(string);
        material.uniforms.string.value = chars;
        material.uniforms.widths.value = getWidths(chars);
        material.uniforms.lefts.value = getLefts(chars);
    };


    function convertString(str) {
        var res = [];
        str += '';
        for (var j in str) {
            res.push(window.string.indexOf(str[j]));
        }
        for (var j = res.length; j < maxLength; j++) {
            res.push(' ');
        }
        return res;
    }


    function getWidths(chars) {
        var res = []
        chars.forEach(function (c) {
            res.push(dimensions[c])
        });
        return res;
    }

    function getLefts(chars) {
        var res = []
        chars.forEach(function (c) {
            res.push(leftPosition[c])
        });
        return res;
    }


    var geometry = new THREE.BufferGeometry();
    var maxLength = 32;
    var positions = [];
    var ids = [];
    var indices = [];
    var h = 1;
    for (var x = 0; x <= maxLength; x++) {

        [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0].forEach(function (v) {
            positions.push(v)
        });
        [x, x, x, x].forEach(function (v) {
            ids.push(v)
        });

    }

    for (var x = 0; x < maxLength; x++) {

        [0, 1, 2, 1, 2, 3].forEach(function (v) {
            indices.push(4 * x + v)
        });

    }
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.addAttribute('id', new THREE.BufferAttribute(new Float32Array(ids), 1));

    var material = new THREE.RawShaderMaterial({
        uniforms: {
            string: {type: 'iv1', value: []},
            widths: {type: 'fv1', value: []},
            lefts: {type: 'fv1', value: []},
            map: {type: 't', value: texture},
            dimensions: {
                type: 'v3',
                value: new THREE.Vector3(texture.image.width, texture.image.height, window.size)
            }
        },
        vertexShader: document.getElementById('2dtext-vertex-shader').textContent,
        fragmentShader: document.getElementById('2dtext-fragment-shader').textContent,
        side: THREE.DoubleSide,
        wireframe: false,
        transparent: true
    });

    this.mesh = new THREE.Mesh(geometry, material);

    this.setText(text || 'Use .setText to set text :)');

    return this;

};