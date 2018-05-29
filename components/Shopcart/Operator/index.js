import shopCart from '../store';

const {
  mobx,
  Observe
} = getApp().globalData;

Component(
  Observe({
    /**
     * 组件的属性列表
     */
    properties: {
      rId: {
        type: String
      },
      food: {
        type: Object,
        observer: function (newVal, oldVal) {
          this._onPropertyChange(null, newVal)
        },
      },
      text: {
        type: String,
        value: 'qwe'
      }
    },

    /**
     * 组件的初始数据
     */
    data: {
      count: 0,
    },

    /**
     * 组件的方法列表
     */
    methods: {
      minus() {
        this.$shopStore.minus(...this.getArgs());
      },
      plus() {
        this.$shopStore.add(...this.getArgs());
      },
      getArgs(newFood) {
        const {
          data,
          rId
        } = this;
        console.log(data.food)
        return [newFood || data.food];
      },
      _onPropertyChange(newFood) {
        const self = this;
        const {
          data
        } = self;
        shopCart.getFoodCount(...this.getArgs(newFood), count => {
          self.setData({
            count,
          });
        });
      },
      
    },
    computed: {
      rId() {
        return this.$shopStore.currentRId;
      },
      someRId() {
        console.log(this)
        return "asd" + this.data.text
      }
    },
    ready() {},
  }, "shopStore"));