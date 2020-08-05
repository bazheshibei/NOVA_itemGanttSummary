
<!-- 自定义统计 -->

<template>
  <div class="pageBox" ref="page">

    <!-- 表格 -->
    <com-table :style="tableStyle"></com-table>

    <!-- 下一步 -->
    <div class="bottomBox" ref="bottomBox">
      <el-button type="primary" size="mini" plain @click="goBack">返回上一页</el-button>
      <el-button type="primary" size="mini" plain @click="submit('1')">暂存</el-button>
      <el-button type="primary" size="mini" @click="submit('2')">提交审核</el-button>
    </div>

  </div>
</template>

<script>
import ComTable from './components/table.vue' //   表格
export default {
  components: { ComTable },
  data() {
    return {
      tableStyle: {},
      scrollTop: 0
    }
  },
  created() {
    /** 计算：表格高度 **/
    this._countHeight()

    /* 表格类型 */
    const local = JSON.parse(localStorage.getItem('NOVA_itemGanttType')) || {}
    const typeObj = { '1': '大货甘特表汇总', '1.1': '排产前节点', '1.2': '投产节点', '2': '大货面料甘特表汇总', '3': '大货工厂甘特表' }
    const { pageType = '1' } = local
    const pageTypeText = typeObj[pageType] || ''
    this.$store.commit('saveData', { name: 'pageType', obj: pageType })
    this.$store.commit('saveData', { name: 'pageTypeText', obj: pageTypeText })

    // /* 开发：直接调用下一步的回调数据 */
    // const { itemMapList, nodeMapList } = JSON.parse(localStorage.getItem('投产排产节点提报：下一步'))
    // this.$store.commit('saveData', { name: 'next_nodeMapList', obj: nodeMapList })
    // const arr = []
    // itemMapList.forEach(function (item) {
    //   const obj = {}
    //   for (const x in item) {
    //     obj[x] = item[x]
    //     if (x === 'nodeTemplateMapList') {
    //       /* 节点异常处理记录 */
    //       //                         提报时的时间           调整/异常原因              是否调整        调整后的时间
    //       const item_node_change = { frist_plan_time: '', abnormal_reason: '', is_change: 0, change_plan_time: '' }
    //       /* 复制一份 nodeTemplateMapList：①用于对比是否改变过值 ②独立数据，不会随组件改变 */
    //       obj.nodeList_0 = []
    //       item[x].map(function (node) {
    //         node.item_node_change = Object.assign({}, item_node_change)
    //         obj.nodeList_0.push(Object.assign({}, node))
    //       })
    //     }
    //   }
    //   arr.push(obj)
    // })
    // this.$store.commit('saveData', { name: 'next_itemMapList', obj: arr })
  },

  methods: {
    /**
     * [返回上一页]
     */
    goBack() {
      this.$router.go(-1)
    },
    /**
     * [提交]
     * @param {[String]} audit_status '1'暂存，'2'提交
     */
    submit(audit_status) {
      /** 请求：暂存、提交 **/
      this.$store.dispatch('A_itemCustomNode', { audit_status, that: this })
    },
    /**
     * [计算：表格高度]
     */
    _countHeight() {
      const that = this
      let i = 0
      const timer = setInterval(function () {
        if (Object.keys(that.$refs).length) {
          const { page, bottomBox } = that.$refs
          if (page.clientHeight && bottomBox.clientHeight) {
            const num = page.clientHeight - bottomBox.clientHeight
            that.tableStyle = { height: num + 'px' }
            clearInterval(timer)
          }
        }
        if (i > 100) {
          clearInterval(timer)
        }
        i++
      }, 100)
    }
  }
}
</script>

<style scoped>
.pageBox {
  width: 100%;
  height: 100%;
  font-size: 12px;
  background: #ffffff;
  overflow-y: auto;
}

.topBox {
  width: 100%;
}
.bottomBox {
  padding: 2px 15px;
  display: flex;
  justify-content: flex-end;
  /* border-top: 1px solid #EBEEF5; */
}
</style>

<style>
/*** 模块刷新 ***/
.f5 {
  color: #909399;
  cursor: pointer;
  padding: 0 6px;
}

/*** 表格字体 ***/
.el-table {
  font-size: 12px !important;
}
/*** 重置表头单元格 ***/
.el-table > div th, .el-table > div th > .cell {
  padding: 0 !important;
}
.el-table > div th > .cell .thText {
  padding: 5px 10px;
}
th > .cell, th > .cell .thText {
  text-align: center;
}
/*** 表头输入内容 ***/
.thActive {
  color: #000000 !important;
  /* color: #ffffff;
  background: #409EFF; */
}
/*** 单元格 ***/
td {
  padding: 0 !important;
}
.cell p {
  line-height: 16px !important;
  margin: 4px 0 !important;
}
td > .cell {
  text-align: center;
}

/*** 搜索 ***/
.el-popover {
  padding: 6px;
}
.el-popover > div > input {
  height: 26px;
  font-size: 12px !important;
  display: flex;
  align-items: center;
}
.el-popover > div > .el-input__suffix { /* input 中删除按钮 */
  margin-top: -6px;
}

/*** 分页 ***/
.comPagination {
  padding: 0;
}
.comPagination > .el-pagination__sizes { /* 总条数 */
  margin: 0 0 0 30px;
}
.comPagination > .el-pagination__sizes > .el-select > .el-input--suffix { /* 总条数 */
  margin-right: 0;
}

/*** 悬浮框 ***/
.comPopover {
  color: #409EFF;
  background: #ecf5ff;
  border-color: #b3d8ff;
}

/*** 单选 ***/
.el-radio > .el-radio__label {
  font-size: 12px;
}
</style>
