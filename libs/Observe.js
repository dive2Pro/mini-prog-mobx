import * as mobx from './mobx'

export function Observe(pageOrComponent) {

    
    /**
     * 要使 Ui 更新, 必须通过 this.setData 来更新数据
     * 所以 mobx 中的 Observable 对象的改变, 需要调用该方法
     * 
     * --------------------- 这一部分是将 Page 或者 Component 升级为一个 store ---------------------------
     * 劫持data属性,
     * 如果是 Component , 还要劫持 properties
     * 
     * 劫持 data 属性: 
     *     
     * 
     * 
     * 
     * 
     * 
     * 
     * 
     * 
     * -----------------------------------------------------------------------------------------------
     * 
     * 
     * onLoad 和 onUnload 作为监听解除
     * 
     * onShow 用来对齐状态
     * onHide 关闭更新状态
     * 
     * 
     */

     const originOnLoad = pageOrComponent.onLoad
     const originComputed = pageOrComponent.computed || {};
     function makePropertyObservableReference(propName) {
        let valueHolder = this.data[propName]
        const atom = mobx.createAtom("reactive " + propName)
        Object.defineProperty(this.data, propName, {
            configurable: true,
            enumerable: true,
            get() {
                atom.reportObserved()
                return valueHolder
            },
            set(v) {
                if (!shallowEqual(valueHolder, v)) {
                    valueHolder = v
                    atom.reportChanged()
                } else {
                    valueHolder = v
                }
            }
        })
    }
    /**
     * 检查是否有 compute 属性, 如果是 function , 将其的 函数名作为 key 值 放入 data 中, 并将其用 autorun 扩展 + setData
     * 
     * 
     * 
     * 
     */
    function extendComputed() {
        const self = this
        Object.entries(originComputed).forEach(([name, fn]) =>{
            mobx.autorun(() => {
                const newValue = fn.apply(self)
                if(newValue){
                    self.setData({[name]: newValue})
                }
            })
        })
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
        Object.keys(this.data).forEach(key => {
            makePropertyObservableReference.call(this, key)
        })
        extendComputed.call(this)
        originOnLoad.apply(this, args)
     }

     pageOrComponent.onLoad = onLoad
     return pageOrComponent
}

function is(x, y) {
    // From: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
    if (x === y) {
        return x !== 0 || 1 / x === 1 / y
    } else {
        return x !== x && y !== y
    }
}


function shallowEqual(objA, objB) {
    //From: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
    if (is(objA, objB)) return true
    if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
        return false
    }
    const keysA = Object.keys(objA)
    const keysB = Object.keys(objB)
    if (keysA.length !== keysB.length) return false
    for (let i = 0; i < keysA.length; i++) {
        if (!hasOwnProperty.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
            return false
        }
    }
    return true
}
/**
 * 
 * @param {Store | Store[]} stores 
 */
function setProviders(stores) {

}

// module.exports = Observe