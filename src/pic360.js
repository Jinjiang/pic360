function Pic360 (src, el) {
  const width = el.offsetWidth
  const height = el.offsetHeight
  const size = 1000

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)

  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(width, height)

  el.appendChild(renderer.domElement)

  const texture = new THREE.TextureLoader().load(src)
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(size, 80, 50),
    new THREE.MeshBasicMaterial({ map: texture })
  )
  mesh.scale.x = -1

  scene.add(mesh)

  function animate () {
    requestAnimationFrame(animate.bind(this))
    const phi = (90 - this.lat) * Math.PI / 180
    const theta = this.lon * Math.PI / 180
    const x = size * Math.sin(phi) * Math.cos(theta)
    const y = size * Math.cos(phi)
    const z = size * Math.sin(phi) * Math.sin(theta)
    camera.lookAt(new THREE.Vector3(x, y, z))
    renderer.render(scene, camera)
  }

  this.lat = 0
  this.lon = 0

  animate.call(this)
}

Pic360.prototype.initControl = function () {
  addEventListener('keydown', this.keyDownListener.bind(this))
}

Pic360.prototype.keyDownListener = function (e) {
  switch (e.keyCode) {
     case 37: // left
     this.left(3)
     break
     case 39: // right
     this.right(3)
     break
     case 38: // up
     this.up(3)
     break
     case 40: // down
     this.down(3)
     break
  }
}

Pic360.prototype.up = function (offset) {
  this.lat += offset
}
Pic360.prototype.down = function (offset) {
  this.lat -= offset
}
Pic360.prototype.left = function (offset) {
  this.lon -= offset
}
Pic360.prototype.right = function (offset) {
  this.lon += offset
}
