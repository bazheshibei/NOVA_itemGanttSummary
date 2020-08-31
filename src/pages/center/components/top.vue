
<!-- 模块：下拉框 -->
<template>
  <div class="comBox">

    <div class="formLine">
      <!-- 业务类型 -->
      <div class="formTextBox" style="flex: 0;">
        <div class="formText">
          <span>业务类型：</span>大货项目 -- {{{ '1': '投产前节点', '2': '排产节点' }[pageType]}}提报&nbsp;&nbsp;
        </div>
      </div>
      <!-- 本次提报项目 -->
      <div class="formTextBox">
        <div class="formText">
          <span>本次提报项目：</span>
          <el-input class="comInput" size="mini" :value="itenames" disabled slot="reference">
            <el-button slot="append" @click="chooseProject">选择项目</el-button>
          </el-input>
          <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <el-button type="primary" size="mini" @click="createdTable">创建</el-button>
          <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <div class="">
            <p>系统提示：大货甘特表提报分为以下两步：</p>
            <p>1.先指定主线上需手动提报节点计划。2.系统根据模板规则自动生成全部节点计划。</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
export default {
  data() {
    return {}
  },
  created() {},
  computed: {
    ...mapState(['projectList', 'itemids', 'pageType']),
    ...mapGetters(['itenames'])
  },
  methods: {
    /**
     * [选择项目]
     */
    chooseProject() {
      const that = this
      /* 添加数据 */
      const { itemids } = that
      const host = window.location.origin + '/nova/'
      // eslint-disable-next-line
      win({
        url: host + `pages/itemganttsummary/choiceItemInfolistGoods.jsp?itemids=${itemids}`,
        param: {},
        width: 1100,
        height: 550,
        title: '选择项目',
        onClose: function () {}
      })
    },
    /**
     * [创建表格]
     */
    createdTable() {
      /** 请求：页面初始化数据 **/
      this.$store.dispatch('A_getItemNodeTemple', { status: '创建' })
    }
  }
}
</script>

<style scoped>
.comBox {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
}

/*** 表单 ***/
.formLine { /* 单行 */
  width: 100%;
  font-size: 12px;
  display: flex;
}
.formLabel { /* 标题 */
  width: 90px;
  min-width: 90px;
  min-height: 34px;
  white-space: nowrap;
  padding: 0 4px;
  border-right: 1px solid #DCDFE6;
  border-bottom: 1px solid #DCDFE6;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.formTextBox {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
}
.formText { /* 值 */
  white-space: nowrap;
  padding: 6px 10px;
  border-right: 1px solid #DCDFE6;
  border-bottom: 1px solid #DCDFE6;
  display: flex;
  align-items: center;
  flex: 1;
}
.otherText {
  min-width: 200px;
  white-space: pre-wrap;
}
.comSelectOptions { /* 下拉框：选项 */
  margin-top: -3px;
}
.red {
  color: #F56C6C;
}
.otherModelBox { /* 其他模板 */
  display: flex;
  align-items: center;
}
</style>

<style>
.comInput {
  max-width: 200px !important;
}
</style>
