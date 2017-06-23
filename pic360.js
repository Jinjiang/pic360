
function Pic360 (src, el, needCtrl = false) {
  if (!src || !el || !el.nodeType === 1) {
    return null
  }
  this.src = src
  this.el = el
  this.initCanvas()
  if (needCtrl) {
    this.initControl()
  }
}

Pic360.prototype.initCanvas = function () {
  const { el, src } = this
  const { offsetWidth, offsetHeight } = el

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, offsetWidth / offsetHeight, 0.1, 1000)

  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(offsetWidth, offsetHeight)

  el.appendChild(renderer.domElement)

  const texture = new THREE.TextureLoader().load(src)
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(this.SIZE, 80, 50),
    new THREE.MeshBasicMaterial({ map: texture })
  )
  mesh.scale.x = -1

  scene.add(mesh)

  this.renderer = renderer
  this.scene = scene
  this.camera = camera

  this.lat = 0
  this.lon = 0

  this.draw()
}

Pic360.prototype.draw = function () {
  const { renderer, scene, camera } = this

  const phi = (90 - this.lat) * Math.PI / 180
  const theta = (180 + this.lon) * Math.PI / 180
  const x = this.SIZE * Math.sin(phi) * Math.cos(theta)
  const y = this.SIZE * Math.cos(phi)
  const z = this.SIZE * Math.sin(phi) * Math.sin(theta)

  camera.lookAt(new THREE.Vector3(x, y, z))
  renderer.render(scene, camera)

  requestAnimationFrame(this.draw.bind(this))
}

Pic360.prototype.initControl = function () {
  const { el } = this

  // up/down/left/right
  const keydown = this.keyDownListener.bind(this)
  addEventListener('keydown', keydown)

  // mouse move
  const mousedown = this.mouseMoveListener.bind(this)
  el.addEventListener('mousedown', mousedown)

  // touch move
  const touchstart = this.touchMoveListener.bind(this)
  el.addEventListener('touchstart', touchstart)

  // mouse wheel
  const mousewheel = this.mouseWheelListener.bind(this)
  el.addEventListener('mousewheel', mousewheel)

  // touch move, zoom ...
  this.listeners = { keydown, mousedown, mousewheel, touchstart }
}

Pic360.prototype.endControl = function () {
  const { el, listeners } = this
  const {
    keydown,
    mousedown,
    mousemove,
    mouseup,
    touchstart,
    touchmove,
    touchend,
    mousewheel
  } = listeners
  removeEventListener('keydown', keydown)
  el.removeEventListener('mousedown', mousedown)
  removeEventListener('mousemove', mousemove)
  removeEventListener('mouseup', mouseup)
  el.removeEventListener('touchstart', touchstart)
  removeEventListener('touchmove', touchmove)
  removeEventListener('touchend', touchend)
  removeEventListener('touchcancel', touchend)
  el.removeEventListener('mousewheel', mousewheel)
}

Pic360.prototype.keyDownListener = function (e) {
  switch (e.keyCode) {
     case 37: // left
     this.lon -= 3
     break
     case 39: // right
     this.lon += 3
     break
     case 38: // up
     this.lat += 3
     break
     case 40: // down
     this.lat -= 3
     break
  }
}

Pic360.prototype.mouseMoveListener = function (e) {
  const { listeners } = this

  function move (e) {
    this.lon -= e.movementX
    this.lat += e.movementY
    if (this.lat < -60) this.lat = -60
    if (this.lat > 60) this.lat = 60
  }

  function end (e) {
    removeEventListener('mousemove', listeners.mousemove)
    removeEventListener('mouseup', listeners.mouseup)
  }

  removeEventListener('mousemove', listeners.mousemove)
  removeEventListener('mouseup', listeners.mouseup)

  listeners.mousemove = move.bind(this)
  listeners.mouseup = end.bind(this)
  addEventListener('mousemove', listeners.mousemove)
  addEventListener('mouseup', listeners.mouseup)
}

Pic360.prototype.touchMoveListener = function (e) {
  const { lon, lat, listeners } = this
  const startX = e.touches[0].clientX
  const startY = e.touches[0].clientY

  function move (e) {
    e.preventDefault()
    const movementX = e.touches[0].clientX - startX
    const movementY = e.touches[0].clientY - startY
    this.lon = lon - movementX
    this.lat = lat + movementY
    if (this.lat < -60) this.lat = -60
    if (this.lat > 60) this.lat = 60
  }

  function end (e) {
    removeEventListener('touchmove', listeners.touchmove)
    removeEventListener('touchend', listeners.touchend)
    removeEventListener('touchcancel', listeners.touchend)
  }

  removeEventListener('touchmove', listeners.touchmove)
  removeEventListener('touchend', listeners.touchend)
  removeEventListener('touchcancel', listeners.touchend)

  listeners.touchmove = move.bind(this)
  listeners.touchend = end.bind(this)
  addEventListener('touchmove', listeners.touchmove)
  addEventListener('touchend', listeners.touchend)
  addEventListener('touchcancel', listeners.touchend)
}

Pic360.prototype.mouseWheelListener = function (e) {}

Pic360.prototype.SIZE = 1000
