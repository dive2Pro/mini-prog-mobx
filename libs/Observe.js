import * as mobx from './mobx';
import shopStore from '../components/Shopcart/store'

let globalStores;
const listeners = {}

/**
 * 
 * @param {PageOrComponent} pageOrComponent 
 * @param {stores} stores 
 * @return Object
 */
export function Observe(pageOrComponent, ...stores) {
  listeners[pageOrComponent] = []
  function makeAutorun(fn){
    const unAutorun = mobx.autorun(fn)
    const ls = listeners[pageOrComponent]
    if(ls) {
      ls.push(unAutorun)
    }
  }
  function clearListeners() {
    if(ls) {
      while(ls.length) {
        (ls.pop())()
      }
    }
  }
  /**
   * 要使 Ui 更新, 必须通过 this.setData 来更新数据
   * 所以 mobx 中的 Observable 对象的改变, 需要调用该方法
   *
   * --------------------- 这一部分是将 Page 或者 Component 升级为一个 store ---------------------------
   * 劫持data属性,
   * 如果是 Component , 还要劫持 properties
   *
   *
   * -----------------------------------------------------------------------------------------------
   * 
   * 
   * ===============================  响应 Store 的改变 ==============================================
   * 
   * 小程序对 page 或者 component 只会对 data 中存在对 值进行读取.
   * 
   * 使用方式: 
   *         ```html
   *                <text> {{shopStore.counts}} </text>
   *         ```  
   * 
   * 当 store 中有值改变时, 需要告知 page 或者 component 对和它对应的 wxml 进行渲染, 这一步是通过 setData 来做的.
   * 
   * Requirement:
   *    1. 使用时, store 是在 data 中的, 这才可以在 wxml 中进行取值操作 
   *    2. 在 wxml 中使用了哪些 store 的值
   *       - wxml 中 不能精确知道的是哪一项发生了改变, 所以需要对整个 store 进行观察 
   *       - 传递给 wxml 的已经不是 reaction 的对象了, 不能监听来探知是哪个属性被使用
   *        
   * ================================================================================================
   *
   * onLoad 和 onUnload 作为监听解除
   *
   * onShow 用来对齐状态
   * onHide 关闭更新状态
   *
   *
   */

  const originOnLoad = pageOrComponent.onLoad;
  const originComputed = pageOrComponent.computed || {};
  const originOnUnload = pageOrComponent.OnUnload;
  const originOnAttached = pageOrComponent.attached
  const originOnDetached = pageOrComponent.detached

  function onDetached () {
    clearListeners.call(this)
    originOnDetached && originOnDetached.call(this)
  }
  
  function onUnload() {
    clearListeners.call(this)
    originOnUnload && originOnUnload.call(this)
  }

  function makePropertyObservableReference(field , propName) {
    let valueHolder = this[field][propName];
    const atom = mobx.createAtom('reactive ' + propName);
    Object.defineProperty(this[field], propName, {
      configurable: true,
      enumerable: true,
      get() {
        atom.reportObserved();
        return valueHolder;
      },
      set(v) {
        if (!shallowEqual(valueHolder, v)) {
          valueHolder = v;
          atom.reportChanged();
        } else {
          valueHolder = v;
        }
      },
    });
  }
  /**
   * 检查是否有 compute 属性, 如果是 function , 将其的 函数名作为 key 值 放入 data 中, 并将其用 autorun 扩展 + setData
   * 
   * 检查,检查是否有 store名字的属性, 如果有, 则检查该属性的值的类型
   *  1. 对象, { name: "sm" }
   *  2. function
   */
  function extendComputed() {
    const self = this;
    const storeFields = ""
    Object.entries(originComputed).filter(([name]) => {
      return stores.indexOf(name) < 0
    }).forEach(([name, fn]) => {
      if(typeof fn !== 'function') {
        return;
      }
      makeAutorun(() => {
        const newValue = fn.apply(self);
        if (newValue) {
          self.innerSetData({
            [name]: newValue
          });
        }
      });
    });
    stores.forEach(name => {
      const storeField = originComputed[name]
      if (!storeField) {
        return
      }
      const aliasStore = globalStores[name]
      if (!aliasStore) {
        throw new Error(`没有注册${name} store, 请检查 setStores 方法, 确认参数正确`)
      }
      Object.keys(storeField).forEach(field => {
        const body = storeField[field]
        const typeOf = typeof body
        switch (typeOf) {
          case 'string':
            makeAutorun(() => {
              const returned = aliasStore[body]
              self.setData({
                [field]: returned
              })
            })
            break
          case 'function':
            makeAutorun(() => {
              const returned = body.call(self, aliasStore)
              self.setData({
                [field]: returned
              })
            })
            break
        }
      })
    })
  }

  function extendWatch() {
    const self = this;
    const watch = self.watch || {};
    Object.values(watch).forEach(fn => {
      makeAutorun(() => {
        fn.call(self);
      });
    });
  }

  function extendStore() {
    const self = this
    // console.log(globalStores)
    if (globalStores && stores && stores.length) {
      stores.forEach(name => {
        if (globalStores[name]) {
          self[`$${name}`] = globalStores[name]
        }
      })
    }
  }
  function extendProperties() {
    if(this.properties) {
    const keys = Object.keys(this.properties)
      keys.forEach( key => {
        makePropertyObservableReference.call(this, 'properties', key)
      })
    }
  }
  function extendToObserve() {
    const self = this
    extendStore.call(self)
    extendComputed.call(self);
    extendWatch.call(self);
  }
  function onLoad(...args) {
    /**
     * 在这里观测 store , 检查 data 或者 props 中是否有值在 store 中可以取得
     *
     * 如果有值被观测, 则使用 autorun 触发 setData
     *
     * extendObservable(this, {data: this.data})
     * ~~~检查是否~~~可以在 视图中 拿到值
     * 1. 如果可以拿到, 设置 compute 属性
     *    @CAUTION: 小程序的 setData, `data` 的 set 那个并没有触发 ( TODO: 它的原理 ), 所以不能直接监听 `data` 属性
     *
     */
    const self = this
    Object.keys(this.data).forEach(key => {
      makePropertyObservableReference.call(this, 'data' ,key);
    });
    extendToObserve.call(self)
    originOnLoad.apply(self, args);
    mobx.spy((event) => {
      if (event.type === "update" && event.name === shopStore.$mobx.name) {
        // self.setData({ [event.key]: event.newValue})
      }
    })
    setTimeout(() => {
      shopStore.currentRId = "1"
    }, 2000)
  }
  function attached(...args) {
    const self = this
    extendProperties.call(self)
    extendToObserve.call(self)
    originOnAttached.apply(self, args)
  }
  const originSetData = pageOrComponent.setData;
  pageOrComponent.onLoad = onLoad;
  pageOrComponent.attached = attached
  function innerSetData(obj) {
    const self = this;
    const {
      data
    } = self;
    Object.keys(obj).forEach(key => {
      if (!data.hasOwnProperty(key)) {
        makePropertyObservableReference.call(self, 'data', key);
      }
    });
    self.setData(obj)
  }
  pageOrComponent.innerSetData = innerSetData;
  pageOrComponent.onUnload = onUnload;
  return pageOrComponent;
}

function is(x, y) {
  // From: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}

function shallowEqual(objA, objB) {
  //From: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
  if (is(objA, objB)) return true;
  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwnProperty.call(objB, keysA[i]) ||
      !is(objA[keysA[i]], objB[keysA[i]])
    ) {
      return false;
    }
  }
  return true;
}
/**
 *
 * @param {{}} stores
 */
export default function setStores(stores) {
  if (globalStores) {
    // throw new Error("不允许动态修改 stores")
  } else {
    globalStores = stores
  }
}

// module.exports = Observe