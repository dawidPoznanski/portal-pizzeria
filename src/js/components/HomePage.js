import { select, templates } from '../settings.js';
import app from '../app.js';

class HomePage {
  constructor(el) {
    const thisHomePage = this;

    thisHomePage.render(el);
    thisHomePage.initAction();
    thisHomePage.initFlickity();
  }

  render(el) {
    const thisHomePage = this;

    const generatedHTML = templates.homePage();

    thisHomePage.dom = {};
    thisHomePage.dom.wrapper = el;
    thisHomePage.dom.wrapper.innerHTML = generatedHTML;

    thisHomePage.dom.boxLinksWrapper = el.querySelector(
      select.homePage.boxLinksWrapper
    ).children;
  }

  initFlickity() {
    const elem = document.querySelector('.main-carousel');
    const flkty = new Flickity(elem, {
      // options
      cellAlign: 'left',
      contain: true,
      autoPlay: true,
    });
  }

  initAction() {
    const thisHomePage = this;

    for (let boxLink of thisHomePage.dom.boxLinksWrapper) {
      boxLink.addEventListener('click', function (e) {
        e.preventDefault();

        const boxLinkId = boxLink.getAttribute('data-link');

        app.activatePage(boxLinkId);
        window.location.hash = '#/' + boxLinkId;
      });
    }
  }
}

export default HomePage;
