
<!-- 生成 -->

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
import { mapState } from 'vuex'
import Dev from '@/store/dev.js' //              本地开发代码
import ComTable from './components/table.vue' // 表格
export default {
  components: { ComTable },
  data() {
    return {
      tableStyle: {},
      scrollTop: 0
    }
  },
  computed: {
    ...mapState(['nowCodeType', 'codeObj'])
  },
  created() {
    /** 计算：表格高度 **/
    this._countHeight()
    /** 本地开发代码 **/
    if (this.nowCodeType === 'Dev') {
      Dev.page2Created({ that: this })
    }
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
}
</style>
