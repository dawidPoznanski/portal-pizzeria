import { settings, select, classNames, templates } from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;

    thisCart.products = [];
    console.log(thisCart.products);

    thisCart.getElements(element);
    thisCart.initActions();
  }

  getElements(element) {
    const thisCart = this;

    thisCart.dom = {
      toggleTrigger: document.querySelector(select.cart.toggleTrigger),
      deliveryFee: document.querySelector(select.cart.deliveryFee),
      subtotalPrice: document.querySelector(select.cart.subtotalPrice),
      totalPrice: document.querySelectorAll(select.cart.totalPrice),
      totalNumber: document.querySelector(select.cart.totalNumber),
      form: document.querySelector(select.cart.form),
      addres: document.querySelector(select.cart.address),
      phone: document.querySelector(select.cart.phone),
    };

    thisCart.dom.productList = document.querySelector(select.cart.productList);

    thisCart.dom.wrapper = element;
  }

  initActions() {
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function () {
      thisCart.update();
    });
    thisCart.dom.productList.addEventListener('remove', function (e) {
      thisCart.remove(e.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function (e) {
      e.preventDefault();
      thisCart.sendOrder();
    });
  }

  sendOrder() {
    const thisCart = this;
    const URL = settings.db.url + '/' + settings.db.orders;

    const payload = {};

    payload.addres = thisCart.dom.addres;
    payload.phone = thisCart.dom.phone;
    payload.totalPrice = thisCart.dom.totalPrice;
    payload.subtotalPrice = thisCart.dom.subtotalPrice;
    payload.totalNumber = thisCart.dom.totalNumber;
    payload.deliveryFee = thisCart.dom.deliveryFee;
    payload.products = [];

    for (let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(URL, options);
  }

  add(menuProduct) {
    const thisCart = this;

    // generate HTML
    const generateHTML = templates.cartProduct(menuProduct);
    // create element using utils
    const generatedDOM = utils.createDOMFromHTML(generateHTML);
    // fint menu container
    thisCart.dom.productList.appendChild(generatedDOM);

    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    thisCart.update();
  }

  update() {
    const thisCart = this;

    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for (let product of thisCart.products) {
      if (product) {
        thisCart.totalNumber = thisCart.totalNumber + product.amount;
        thisCart.subtotalPrice = thisCart.subtotalPrice + product.price;
        console.log(product, 'Product in cart');
      }
    }

    thisCart.totalPrice = thisCart.subtotalPrice;
    if (thisCart.totalNumber != 0) {
      thisCart.totalNumber += thisCart.deliveryFee;
    } else {
      thisCart.deliveryFee = 0;
    }

    thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;

    for (let price of thisCart.dom.totalPrice) {
      price.innerHTML = thisCart.totalPrice;
    }
  }

  remove(cartProduct) {
    const thisCart = this;

    cartProduct.dom.wrapper.remove();
    thisCart.products.splice(thisCart.products.indexOf(cartProduct), 1);
    thisCart.update();
  }
}
export default Cart;
