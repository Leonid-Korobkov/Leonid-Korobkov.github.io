import './lazyload.min.js'
import { projectsData } from './projectsData.js'

function renderProjects() {
  const $projectList = document.querySelector('.main__list')

  let stringToInsert = ``
  projectsData.forEach(item => {
    const projectItem = `
        <a class="main__item-link" href="${item.link}">
          <li class="main__item">
            <span class="main__link">${item.title}</span>
            <div class="main__img-container">
              <div class="skeleton"></div>
              <img class="main__img" data-src="${item.imageSrc}"
                alt="${item.title}">
            </div>
          </li>
        </a>`

    stringToInsert += projectItem
  })

  $projectList.innerHTML = stringToInsert
}

renderProjects()

const lazyMedia = new LazyLoad({
  elements_selector: '[data-src],[data-srcset]',
  class_loaded: '_lazy-loaded',
  use_native: true,
  callback_loaded: el => {
    const imgContainer = el.closest('.main__img-container')
    if (imgContainer) {
      imgContainer.style.aspectRatio = 'auto'
      const skeleton = imgContainer.querySelector('.skeleton')
      if (skeleton) {
        imgContainer.removeChild(skeleton)
      }
    }
  }
})
