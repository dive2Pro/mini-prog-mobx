import * as mobx from '../../libs/mobx';

const defaultOptions = {
  initial: () => ({}),
  afterUpdate: () => {},
};


class ShopCart {
  constructor(options = defaultOptions) {
    this.options = options;
    mobx.extendObservable(this, {
        db: options.initial(),
        currentRId: null,
        get restaurant(){
            if(this.currentRId) {
                return this.db[this.currentRId]
            }
            return {}
        }
    })
  }

  setCurrentRId = (rId) => {
      this.currentRId = rId;
      this.prePareRestaurant(rId);
  }

  init = data => {
  };

  add = (food) => {
    this.mathOperatorFood(food, true);
  };

  minus=(food) => {
    this.mathOperatorFood(food, false);
  };

  mathOperatorFood = (food, isPlus) => {
    const restaurant = this.restaurant;
    const exitsFood = restaurant[food.item_id];
    const newCount = isPlus ? exitsFood.count + 1 : exitsFood.count - 1;
    mobx.set(restaurant[food.item_id], 'count', newCount > -1 ? newCount : 0);
  };

  clear = (rId = this.currentRId) => {
    const db = this.db;
    mobx.remove(db, rId);
  };

  prePareRestaurant = rId => {
    const db = this.db;
    if (!mobx.has(db, rId)) {
      mobx.set(db, rId, {});
    }
  };

  prePareFood = (food) => {
    const restaurant = this.restaurant;
    const exitsFood = restaurant[food.item_id];
    if (!exitsFood) {
      mobx.set(restaurant, food.item_id, { food, count: 0 });
    }
  };

  getFoodCount = (food, cb) => {
    this.prePareFood(food);
    const exitsFood = this.restaurant[food.item_id];
    return mobx.autorun(() => {
      const result = exitsFood.count;
      cb(result);
    });
  };
}

function getSingle(clazz) {
  let instance;
  return function inner(...args) {
    if (instance) {
      return instance;
    }
    instance = new clazz(...args);
    return instance;
  };
}

const shopCart = new ShopCart();

shopCart.init({});
export default shopCart;
