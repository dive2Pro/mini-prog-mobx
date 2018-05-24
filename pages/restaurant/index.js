import shopCart from '../../components/Shopcart/store'
const { globalData } = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    clazzs: [],
    selectedIndex: -1,
    selected: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    const self = this
    self.options = options;
    const shop = JSON.parse(options.shop);
    self.setData({
      shop,
    });

    wx.request({
      url: globalData.baseURL + `shopping/v2/menu?restaurant_id=${shop.id}`,
      success(res) {
        const { data } = res
        shopCart.setCurrentRId(shop.id)
        self.setData({
          clazzs: data,
        })
        self.setSelected(0)
      },
      failure(rej) {

      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {},
  /**
   * 
   * @param {Number} index  
   */
  setSelected(index) {
    const self = this
    let clazz = self.data.clazzs[index];
    const foods = clazz.foods.map(food => ({
      ...food,
      parent: { ...clazz, foods: [] },
      image_path: self.getSrc(food),
      spec: food.specfoods[0],
    }));
    this.setData({
      selectedIndex: index,
      selected: {...clazz, foods}
    })
  },
  
  handleLeftTreeClick(evt){
    const {currentTarget: {dataset: {index} }} = evt;
    this.setSelected(index)
  },
  getSrc(food) {
    const self = this;
    const src = globalData.IMAGE_PREFIX + food.image_path;
    return src
  }
});
