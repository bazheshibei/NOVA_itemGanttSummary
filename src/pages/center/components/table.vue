
<!-- 模块：表格 -->

<template>
  <div class="comTableBox" ref="comTableBox">

    <el-table class="comTable" :data="projectList" size="mini" border :height="tableHeight">
      <!-- 操作 -->
      <el-table-column label="操作" width="80">
        <template slot-scope="scope">
          <el-popconfirm :title="'确定要删除 ' + scope.row.item_name + ' 吗？'"
            icon="el-icon-info" iconColor="red" confirmButtonType="text" @onConfirm="deleteData(scope.$index)"
          >
            <el-tag class="comDeleteBtn" slot="reference" size="mini" plain>删除</el-tag>
          </el-popconfirm>
        </template>
      </el-table-column>
      <!-- 项目名称 -->
      <el-table-column label="项目名称" width="100">
        <template slot-scope="scope">
          <el-popover popper-class="comPopover" :visible-arrow="false" placement="right" trigger="hover" :content="scope.row.itemInformation">
            <span slot="reference">{{scope.row.item_name}}</span>
          </el-popover>
        </template>
      </el-table-column>
      <!-- 下单日期 -->
      <el-table-column prop="order_time" label="下单日期" width="100"></el-table-column>
      <!-- 客人交期 -->
      <el-table-column prop="deliver_date" label="客人交期" width="100"></el-table-column>

      <el-table-column v-for="item in nodeMapList" :key="'node_' + item.node_id" :label="item.node_name" width="140">
        <template slot-scope="scope">
          <el-input v-if="_isShowInput(scope.row, item)"
            class="comTimeInput" slot="reference" size="mini" placeholder="请输入日期或 /" maxlength="10"
            v-model="scope.row[item.node_id].first_plant_enddate" @blur="blur(scope.$index, item.node_id)"
          ></el-input>
          <span v-else>--</span>
        </template>
      </el-table-column>
    </el-table>

  </div>
</template>

<script>
import { mapState } from 'vuex'
import Tool from '@/store/tool.js'
export default {
  created() {
    /** 计算：表格高度 **/
    this._countHeight()
  },
  data() {
    return {
      value1: '',
      tableHeight: 0 // 表格高度
    }
  },
  computed: {
    ...mapState(['projectList', 'nodeMapList'])
  },
  methods: {
    /**
     * [输入框失焦]
     * @param {[Int]}    index   项目索引
     * @param {[String]} node_id 节点ID
     */
    blur(index, node_id) {
      const { projectList } = this
      const time = Tool._toggleTime(projectList[index][node_id].first_plant_enddate)
      const { order_time, deliver_date } = projectList[index]
      const time_1 = new Date(order_time).getTime()
      const time_2 = new Date(deliver_date).getTime()
      const num = new Date(time).getTime()
      if ((time_1 <= num && num <= time_2) || time === '/' || time === '') {
        /* 保存日期：(在区间内) || 不填 || 没输入时间 */
        this.projectList[index][node_id].first_plant_enddate = time
      } else {
        /* 重置日期 */
        this.$message.error('请输入 下单日期 和 客人交期 之间的时间')
        this.projectList[index][node_id].first_plant_enddate = ''
      }
    },
    /**
     * [删除数据]
     * @param {[Int]} index 索引
     */
    deleteData(index) {
      const { projectList } = this
      projectList.splice(index, 1)
      /** 保存数据 **/
      this.$store.commit('saveData', { name: 'projectList', obj: projectList })
    },
    /**
     * [是否：显示input]
     * @param  {[Object]}  row  表格单行数据
     * @param  {[Object]}  item 节点信息
     * @return {[Boolean]}      是否显示
     */
    _isShowInput(row, item) {
      const node = row[item.node_id]
      let status = false
      if (node) { // 有此节点
        const { first_plant_enddate } = node
        if (typeof first_plant_enddate === 'string' || typeof first_plant_enddate === 'object') { // 时间 === 字符串 || null
          status = true
        }
      }
      return status
    },
    /**
     * [计算：表格高度]
     */
    _countHeight() {
      const that = this
      let i = 0
      const timer = setInterval(function () {
        if (Object.keys(that.$refs).length) {
          const { comTableBox } = that.$refs
          if (comTableBox.clientHeight) {
            that.tableHeight = comTableBox.clientHeight
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
.comTableBox {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.comTable {
  border-top: 0 !important;
}
</style>
