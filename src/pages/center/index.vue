
<!-- 提报 -->

<template>
  <div class="pageBox" v-on:scroll="pageScroll" ref="page">

    <!-- 下拉框 -->
    <div class="topBox" ref="topBox">
      <com-top></com-top>
    </div>

    <!-- 表格 -->
    <com-table :style="tableStyle"></com-table>

    <!-- 下一步 -->
    <div class="bottomBox" ref="bottomBox">
      <el-button type="primary" size="mini" plain @click="goTo">下一步 -> 生成详细节点计划</el-button>
    </div>

  </div>
</template>

<script>
import ComTop from './components/top.vue' //     下拉框
import ComTable from './components/table.vue' // 表格
export default {
  components: { ComTop, ComTable },
  data() {
    return {
      tableStyle: {},
      scrollTop: 0
    }
  },
  created() {
    const { type = 1 } = JSON.parse(localStorage.getItem('sumittcpcGanttSummaryType') || '{}')
    this.$store.commit('saveData', { name: 'pageType', obj: type })
    /** 计算：表格高度 **/
    this._countHeight()
    /** 请求：页面初始化数据 **/
    this.$store.dispatch('A_getItemNodeTemple', {})

    try {
      /* 平台方法 */
      // eslint-disable-next-line
      dg.removeBtn('cancel')
      // eslint-disable-next-line
      dg.removeBtn('saveAndAdd')
      // eslint-disable-next-line
      dg.removeBtn('saveAndClose')
      // eslint-disable-next-line
      dg.removeBtn('saveNoClose')
    } catch (err) {
      //
    }
  },
  methods: {
    /**
     * [页面跳转]
     */
    goTo() {
      /** 请求：下一步 **/
      this.$store.dispatch('A_generateItemGanttSummary', { that: this })
    },
    /**
     * [计算：表格高度]
     */
    _countHeight() {
      const that = this
      let i = 0
      const timer = setInterval(function () {
        if (Object.keys(that.$refs).length) {
          const { page, topBox, bottomBox } = that.$refs
          if (page.clientHeight && topBox.clientHeight && bottomBox.clientHeight) {
            const num = page.clientHeight - topBox.clientHeight - bottomBox.clientHeight
            that.tableStyle = { height: num + 'px' }
            clearInterval(timer)
          }
        }
        if (i > 100) {
          clearInterval(timer)
        }
        i++
      }, 100)
    },
    /**
     * [页面滚动事件]
     */
    pageScroll(event) {
      const newNum = event.target.scrollTop
      const oldNum = this.scrollTop
      if (Math.abs(newNum - oldNum) < 300) {
        this.scrollTop = event.target.scrollTop
        this.$refs.page.scrollTop = newNum
      } else {
        this.$refs.page.scrollTop = oldNum
      }
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
}
</style>
