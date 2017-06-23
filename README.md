# pic360

Show panorama pictures in 360 degrees.

## Demo

https://jinjiang.github.io/pic360

## API

```javascript
// Constructor.
// Init a picture.
const pic = new Pic360(pictureSrc:string, targetElement:Element, needCtrl:bool)

// If you set needCtrl value false, you can also manually init control events
// which include keyboard, mouse and touch etc.
pic.initControl()

// End all control events.
pic.endControl()
```

## Code Sample

```html
<div id="target" style="
  width: 960px;
  height: 480px;
"></div>

<script>
  const pic = new Pic360(
    './sample.jpg',
    document.querySelector('#target'),
    true)
</script>
```
