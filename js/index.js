import './lazyload.min.js'

const lazyMedia = new LazyLoad({
  elements_selector: '[data-src],[data-srcset]',
  class_loaded: '_lazy-loaded',
  use_native: true,
  callback_loaded: el => {
    const imgContainer = el.closest('.main__img-container')
    if (imgContainer) {
      imgContainer.style.aspectRatio = 'auto';
      const skeleton = imgContainer.querySelector('.skeleton')
      if (skeleton) {
        imgContainer.removeChild(skeleton)
      }
    }
  }
})
