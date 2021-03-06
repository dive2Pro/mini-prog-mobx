const shoppingURL = 'shopping/restaurants?latitude=31.22967&longitude=121.4762';
const { globalData } = getApp();
const Observe = globalData.Observe
Page(
  Observe({
    data: {
      shops: [],
    },
    //事件处理函数
    bindViewTap: function() {
      wx.navigateTo({
        url: '../logs/logs',
      });
    },
    onLoad: function() {
      console.log(this)
      this.requestMore();
    },
    requestMore() {
      wx.showLoading();
      const { shops } = this.data;
      const offset = shops.length;
      const self = this;
      wx.request({
        url: globalData.baseURL + shoppingURL + `&${offset}`,
        success: function(res) {
          wx.hideLoading();
          const changed = self.appendBaseUrl(res.data);
          self.innerSetData({ shops: changed });
        },
      });
    },
    appendBaseUrl(data) {
      return data.map(({ image_path, ...rest }) => ({
        ...rest,
        image_path: globalData.IMAGE_PREFIX + image_path,
      }));
    },
    getUserInfo: function(e) {
      globalData.userInfo = e.detail.userInfo;
      this.innerSetData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true,
      });
    },
    shopDirect({
      currentTarget: {
        dataset: { shop },
      },
    }) {
      const url = `../restaurant/index?id=${shop.id}`;
      wx.navigateTo({
        url,
      });
    },
    computed: {
      temp: function() {
        console.log(this.data.shops)
        return this.data.shops.length + ' 个'
      },
      currentRId() {
        return this.$shopStore.currentRId
      },
      shopStore: {
        "rId": "currentRId",
        rId2(state) {
          return state.currentRId
        }
      },
    },
    watch: {
      tempChange() {
        this.innerSetData({
          tempChange: this.data.temp + " ---> "
        })
      }
    }
  },
  "shopStore"
),
);
