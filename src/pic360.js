
function Pic360 (src, el, { needCtrl, isVideo, needOrientation, lon, lat }) {
  if (!src || !el || !el.nodeType === 1) {
    return null
  }
  this.src = src
  this.el = el
  this.isVideo = isVideo
  this.needCtrl = needCtrl
  this.needOrientation = needOrientation
  this.lon = lon || 0
  this.lat = lat || 0
  this.distance = this.SIZE
  this.changes = {
    lon: 0, lat: 0
  }
  this.initCanvas()
  if (needCtrl) {
    this.initControl()
  }
  if (needOrientation) {
    this.initOrientation()
  }
}

Pic360.prototype.initCanvas = function () {
  const { el } = this
  const { offsetWidth, offsetHeight } = el

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, offsetWidth / offsetHeight, 0.1, 5000)

  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(offsetWidth, offsetHeight)

  el.appendChild(renderer.domElement)

  const texture = this.isVideo ? this.initVideoTexture() : this.initImageTexture()
  this.texture = texture
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(this.SIZE, 80, 50),
    new THREE.MeshBasicMaterial({ map: texture })
  )
  mesh.scale.x = -1

  scene.add(mesh)

  this.renderer = renderer
  this.scene = scene
  this.camera = camera

  this.draw()
}

Pic360.prototype.initImageTexture = function () {
  const { src } = this
  return new THREE.TextureLoader().load(src)
}

Pic360.prototype.initVideoTexture = function () {
  const { src } = this
  const video = document.createElement('video')
  video.autoplay = true
  video.loop = true
  video.src = src
  this.video = video
  return new THREE.VideoTexture(video)
}

Pic360.prototype.draw = function () {
  const { renderer, scene, camera, changes } = this

  if (this.lat < -60) this.lat = -60
  if (this.lat > 60) this.lat = 60

  const phi = (90 - this.lat) * Math.PI / 180
  const theta = (180 + this.lon + changes.lon * 4) * Math.PI / 180
  camera.position.x = Math.round(this.distance * Math.sin(phi) * Math.cos(theta))
  camera.position.y = Math.round(this.distance * Math.cos(phi))
  camera.position.z = Math.round(this.distance * Math.sin(phi) * Math.sin(theta))

  camera.lookAt(scene.position)
  renderer.render(scene, camera)

  requestAnimationFrame(this.draw.bind(this))
}

Pic360.prototype.initControl = function () {
  const { el, isVideo } = this

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
  const wheel = this.wheelListener.bind(this)
  addEventListener('wheel', wheel)

  // touch move, zoom ...
  this.listeners = { keydown, mousedown, wheel, touchstart }

  if (isVideo) {
    const click = this.playListener.bind(this)
    el.addEventListener('click', click)
    this.listeners.click = click
  }
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
    wheel,
    click,
    deviceorientation
  } = listeners
  removeEventListener('keydown', keydown)
  el.removeEventListener('mousedown', mousedown)
  removeEventListener('mousemove', mousemove)
  removeEventListener('mouseup', mouseup)
  el.removeEventListener('touchstart', touchstart)
  removeEventListener('touchmove', touchmove)
  removeEventListener('touchend', touchend)
  removeEventListener('touchcancel', touchend)
  removeEventListener('wheel', wheel)
  el.removeEventListener('click', click)
  removeEventListener('deviceorientation', deviceorientation)
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
    this.mouseMoving = true
    this.lon -= e.movementX
    this.lat += e.movementY
  }

  function end (e) {
    removeEventListener('mousemove', listeners.mousemove)
    removeEventListener('mouseup', listeners.mouseup)
  }

  removeEventListener('mousemove', listeners.mousemove)
  removeEventListener('mouseup', listeners.mouseup)
  this.mouseMoving = false

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

Pic360.prototype.wheelListener = function (e) {
  e.preventDefault()
  this.distance += e.deltaY * 0.05
}

Pic360.prototype.playListener = function () {
  const { video, isVideo, mouseMoving } = this
  if (isVideo && !mouseMoving) {
    if (video.paused) {
      video.play()
      this.texture.needsUpdate = true
    } else {
      video.pause()
      this.texture.needsUpdate = false
    }
  }
}

Pic360.prototype.initOrientation = function () {
  const deviceorientation = function (e) {
    const { beta, gamma } = e
    if (!this.orientation) {
      this.orientation = { beta, gamma }
    } else {
      this.changes = {
        lat: beta - this.orientation.beta,
        lon: gamma - this.orientation.gamma
      }
    }
  }.bind(this)
  addEventListener('deviceorientation', deviceorientation)
  this.listeners.deviceorientation = deviceorientation
}

Pic360.prototype.SIZE = 1000
