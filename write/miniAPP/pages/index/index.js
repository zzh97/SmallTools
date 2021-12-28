// index.js
// 获取应用实例
const app = getApp()

Page({
  data: {
    mouseX: 0,
    mouseY: 0,
    isMouseDown: 0,
    width: 700,
    height: 700,
    isNewCanvas: true
  },
  onLoad() {
    if (this.data.isNewCanvas) {
      this.newCanvas()
    }
    else {
      this.oldCanvas()
    } 
  },
  newCanvas () {
    const query = wx.createSelectorQuery().in(this)
    query.select('#myCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        // 不要这块，鼠标位置与画线位置会不一致
        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)
        this.data.miniCanvas = canvas
        this.data.miniCTX = ctx
      })
  },
  oldCanvas () {
    // 使用 wx.createContext 获取绘图上下文 context
    this.data.miniCTX = wx.createCanvasContext('myCanvas')
  },
  start(e) {
    this.setData({
      mouseX: e.touches[0].x,
      mouseY: e.touches[0].y,
      isMouseDown: 1,
    })
  },
  move(e) {
    this.setData({
      mouseX: e.touches[0].x,
      mouseY: e.touches[0].y
    })
    this.moveAction(this.data.miniCTX)
  },
  end(e) {
    this.setData({
      isMouseDown: 0,
      oldX: 0,
      oldY: 0,
    })
  },
  moveAction (miniCTX, color='#f55', size=4) {
    let x = this.data.mouseX
    let y = this.data.mouseY
    let oldX = this.data.oldX
    let oldY = this.data.oldY
    let status = this.data.isMouseDown
    let ctx = miniCTX
    ctx.fillStyle = color
    ctx.fillRect(x, y, size, size)
    if (!this.data.isNewCanvas) {
      ctx.draw()
    }
    // 中点插值法（可以用二点距离公式+三角函数来推导，不过我偷了个懒）
    const middle = ({a=0, b=0, c=0, d=0, min=10, callback=()=>{}} = {}) => {
      let conditionA = Math.abs(b - a) > min
      let conditionB = Math.abs(d - c) > min
      if (conditionA && conditionB) {
          let n = parseInt(Math.max(Math.abs(b - a) / min, Math.abs(d - c) / min))
          let bias = (b - a) / (n)
          let m = a + bias
  
          let bias2 = (d - c) / (n)
          let m2 = c + bias2
  
          // console.log (n, m, n, m2)
          callback({a:m, b, c:m2, d})
          middle({a:m, b, c:m2, d, min, callback})
      }
      else if (conditionA) {
          let n = parseInt(Math.abs(b - a) / min)
          let bias = (b - a) / (n)
          let m = a + bias
          // console.log (n, m)
          callback({a:m, b})
          middle({a:m, b, min, callback})
      }
      else if (conditionB) {
          let n = parseInt(Math.abs(d - c) / min)
          let bias = (d - c) / (n)
          let m = c + bias
          // console.log (n, m)
          callback({c:m, d})
          middle({c:m, d, min, callback})
      }
    }
    // console.log (oldX, oldY, x, y)
    if (status === 1) {
      // 插入中点
      if (oldX && oldY) {
        // console.log ('插入中点')
        middle({a:oldX, b:x, c:oldY, d:y, min:size/4, callback:({a, b, c, d})=>{
            // console.log (a, b, c, d)
            ctx.fillRect(a||x, c||y, size, size)
        }})
      }
      // 更新坐标
      this.data.oldX = x
      this.data.oldY = y
    }
  },
  // 清屏
  clearCanvas () {
    this.data.miniCTX.clearRect(0, 0, this.data.width, this.data.height);
  },
  // 导出
  exportCanvas () {
    wx.canvasToTempFilePath({
      // canvasId: 'myCanvas',
      canvas: this.data.miniCanvas,
      success(res) {
        wx.previewImage({
          current: res.tempFilePath, // 当前显示图片的http链接
          urls: [res.tempFilePath] // 需要预览的图片http链接列表
        })
      },
      complete(res) {
        console.log(res)
      }
    })
  }
})