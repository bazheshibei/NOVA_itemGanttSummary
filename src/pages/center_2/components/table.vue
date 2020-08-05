
<!-- 模块：表格 -->

<template>
  <div class="comTableBox" ref="comTableBox">

    <el-table :data="next_list" size="mini" border :height="tableHeight" :span-method="objectSpanMethod">
      <!-- 操作 -->
      <el-table-column label="操作" width="80">
        <template slot-scope="scope">
          <el-popconfirm :title="'确定要删除 ' + scope.row.item_name + ' 吗？'"
            icon="el-icon-info" iconColor="red" confirmButtonType="text" @onConfirm="deleteData(scope.row.index / 2)"
          >
            <el-tag class="deleteBtn hover" slot="reference" size="mini" plain>删除</el-tag>
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
      <!-- 计划完成 / 本次调整 -->
      <el-table-column width="80">
        <template slot-scope="scope">
          <span v-if="!(scope.row.index % 2)">计划完成</span>
          <span v-else>本次调整</span>
        </template>
      </el-table-column>

      <el-table-column v-for="item in next_nodeMapList" :key="'node_' + item.node_id" :label="item.node_name" :column-key="item.node_id" width="150">
        <template slot-scope="scope">
          <div v-if="scope.row[item.node_id]">
            <!-- 单行 -->
            <div v-if="!(scope.row.index % 2)">
              <!-- 单行：用户提报 -->
              <div v-if="scope.row[item.node_id].submit_type === 2">
                <el-popover popper-class="comPopover" :visible-arrow="false" placement="left" trigger="focus" :content="scope.row[item.node_id].maxMinText">
                  <el-input class="comInput" :class="scope.row[item.node_id].error ? 'errorPicker' : ''" slot="reference" size="mini" placeholder="请输入日期"
                    v-model="scope.row[item.node_id].first_plant_enddate" @focus="focus" @blur="blur"
                  ></el-input>
                </el-popover>
              </div>
              <!-- 单行：系统计算 && 异常 -->
              <div v-if="scope.row[item.node_id].submit_type === 1 && scope.row[item.node_id].error">
                <span class="red">{{scope.row[item.node_id].first_plant_enddate}}</span>
                <i class="el-icon-warning warningIcon hover" v-if="scope.row[item.node_id].error" @click="edit(scope.row, item.node_id)"></i>
              </div>
              <!-- 单行：系统计算 && 正常 -->
              <div v-if="scope.row[item.node_id].submit_type === 1 && !scope.row[item.node_id].error">
                <span class="hover" @dblclick="edit(scope.row, item.node_id)">{{scope.row[item.node_id].first_plant_enddate}}</span>
              </div>
            </div>
            <!-- 双行 -->
            <span v-else>
              <div v-if="scope.row[item.node_id].submit_type === 2 && scope.row[item.node_id].error">
                <el-input class="comInput" :class="scope.row[item.node_id].error ? 'errorPicker' : ''" v-model="scope.row[item.node_id].item_node_change.abnormal_reason" size="mini" placeholder="请输入异常原因"></el-input>
              </div>
              <div v-else style="text-align: left;">
                <p v-if="scope.row[item.node_id].item_node_change && scope.row[item.node_id].item_node_change.change_plan_time">
                  调整后：{{scope.row[item.node_id].item_node_change.change_plan_time}}
                </p>
                <p v-if="scope.row[item.node_id].item_node_change && scope.row[item.node_id].item_node_change.abnormal_reason">
                  原因：{{scope.row[item.node_id].item_node_change.abnormal_reason}}
                </p>
              </div>
            </span>
          </div>
          <span v-else>--</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 弹出层 -->
    <el-dialog class="comDialog" :title="d_data.title" :visible.sync="dialogVisible" width="80%">
      <!-- 弹出层：表单 -->
      <div class="lineBox">
        <div class="lineLabel">当前异常节点：</div>
        <div class="lineText">{{d_data.node_name}}</div>
      </div>
      <div class="lineBox">
        <div class="lineLabel">系统计算日期：</div>
        <div class="lineText">{{d_data.first_plant_enddate}}</div>
        <div class="lineLabel">异常原因：</div>
        <div class="lineText">{{d_data.verification_remark}}</div>
      </div>
      <div class="lineBox">
        <div class="lineLabel">是否调整日期：</div>
        <div class="lineText">
          <el-radio v-model="d_data.is_change" :label="1">是</el-radio>
          <el-radio v-model="d_data.is_change" :label="0">否</el-radio>
        </div>
        <div class="lineLabel">调整后日期：</div>
        <div class="lineText">
          <el-input class="comInput" :disabled="d_data.is_change === 0 ? true : false" slot="reference" size="mini" placeholder="请输入日期"
            v-model="d_data.change_plan_time" @focus="focus" @blur="blur('change_plan_time', $event)"
          ></el-input>
        </div>
      </div>
      <div class="lineBox">
        <div class="lineLabel"><span class="red">*</span>调整/异常原因：</div>
        <div class="lineText">
          <el-input class="comInput2" v-model="d_data.abnormal_reason" size="mini" placeholder="请填写调整/异常原因"></el-input>
        </div>
      </div>
      <!-- 弹出层：按钮 -->
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" size="mini" @click="submit">保 存</el-button>
        <el-button size="mini" @click="dialogVisible = false">取 消</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
export default {
  created() {
    /** 计算：表格高度 **/
    this._countHeight()
  },
  data() {
    return {
      /* 弹出层 */
      dialogVisible: false, // 弹出层：是否显示
      d_data: {}, //           弹出层：数据
      /* 页面 */
      tableHeight: 0 // 表格高度
    }
  },
  computed: {
    ...mapState(['next_itemMapList', 'next_nodeMapList', 'tableArr', 'tableActive', 'pageTypeText', 'isSubmit']),
    ...mapGetters(['next_list'])
  },
  methods: {
    focus() {
      this.$store.commit('saveData', { name: 'isComputed_2', obj: false })
    },
    blur(name, event) {
      if (name === 'change_plan_time') {
        this.d_data.change_plan_time = this._toggleTime(event.target.value)
      }
      this.$store.commit('saveData', { name: 'isComputed_2', obj: true })
    },
    /**
     * [弹出层：修改]
     * @param {[Object]} row    当前行的数据
     * @param {[String]} nodeId 当前列（节点）ID
     */
    edit(row, nodeId) {
      // console.log(row)
      const { index, item_name } = row
      const { error, verification_remark, item_node_change: { is_change, change_plan_time, abnormal_reason } } = row[nodeId]
      const title = error ? '节点异常处理' : '节点编辑'
      const { next_nodeMapList, pageTypeText } = this
      let nodeName = ''
      for (let i = 0; i < next_nodeMapList.length; i++) {
        const { node_id, node_name } = next_nodeMapList[i]
        if (node_id === nodeId) {
          nodeName = node_name
          break
        }
      }
      const node_name = [item_name, pageTypeText, nodeName].join(' > ')
      /* 提取静态数据：系统计算日期 */
      let first_plant_enddate = ''
      for (let i = 0; i < row.nodeList_0.length; i++) {
        const item = row.nodeList_0[i]
        if (item.node_id === nodeId) {
          first_plant_enddate = item.first_plant_enddate
        }
      }
      /* 赋值 */
      const d_data = {
        index, //               项目索引
        title, //               弹出层标题
        nodeId, //              节点ID
        node_name, //           当前异常节点
        first_plant_enddate, // 系统计算日期
        abnormal_reason, //     异常原因
        is_change, //           是否调整日期
        change_plan_time, //    调整后日期
        verification_remark //  调整/异常原因
      }
      this.d_data = d_data
      this.dialogVisible = true
    },
    /**
     * [保存]
     */
    submit() {
      const that = this
      const { d_data, next_itemMapList } = this
      const { index, nodeId, first_plant_enddate, abnormal_reason, is_change } = d_data
      if (abnormal_reason) {
        const change_plan_time = is_change === 0 ? '' : d_data.change_plan_time // 不调整：调整后日期为空
        next_itemMapList[index][nodeId].first_plant_enddate = is_change === 0 ? first_plant_enddate : change_plan_time
        next_itemMapList[index][nodeId].item_node_change = Object.assign({}, { abnormal_reason, change_plan_time, frist_plan_time: first_plant_enddate, is_change })
        /* 根据验证结果，处理事件 */
        setTimeout(function () {
          const { isSubmit } = that.$store.state
          if (isSubmit) {
            that.dialogVisible = false
            // that.$message({ message: '保存成功', type: 'success', duration: 1000 })
            next_itemMapList[index][nodeId].isProving = true
          }
        }, 0)
      } else {
        this.$message.error('请填写调整/异常原因')
      }
    },
    /**
     * [表格：合并行]
     */
    objectSpanMethod({ row, column, rowIndex, columnIndex }) {
      if (columnIndex < 4) {
        if (!(rowIndex % 2)) {
          return { rowspan: 2, colspan: 1 }
        } else {
          return { rowspan: 0, colspan: 0 }
        }
      }
    },
    /**
     * [删除数据]
     * @param {[Int]} index 索引
     */
    deleteData(index) {
      const { next_itemMapList } = this
      next_itemMapList.splice(index, 1)
      /** 保存数据 **/
      this.$store.commit('saveData', { name: 'next_itemMapList', obj: next_itemMapList })
    },
    _toggleTime(time) {
      if (time) {
        const arr = time.split(/[-//.]/g)
        let year = new Date().getFullYear()
        let month = ''
        let day = ''
        if (arr.length === 3) {
          const [one, two, three] = arr
          if (!isNaN(parseInt(one))) {
            year = '2000'.slice(0, -1 * String(one).length) + one
          }
          if (!isNaN(parseInt(two))) {
            month = parseInt(two) < 10 ? '0' + parseInt(two) : parseInt(two)
          }
          if (!isNaN(parseInt(three))) {
            day = parseInt(three) < 10 ? '0' + parseInt(three) : parseInt(three)
          }
          if (parseInt(month) && parseInt(month) <= 12 && parseInt(day) && parseInt(day) <= 31) {
            return `${year}-${month}-${day}`
          } else {
            return time
          }
        } else if (arr.length === 2) {
          const [two, three] = arr
          if (!isNaN(parseInt(two))) {
            month = parseInt(two) < 10 ? '0' + parseInt(two) : parseInt(two)
          }
          if (!isNaN(parseInt(three))) {
            day = parseInt(three)
          }
          if (parseInt(month) && parseInt(month) <= 12 && parseInt(day) && parseInt(day) < 10) {
            return `${year}-${month}-0${day}`
          } else if (parseInt(month) && parseInt(month) <= 12 && parseInt(day) && parseInt(day) <= 31) {
            return `${year}-${month}-${day}`
          } else {
            return time
          }
        } else {
          return time
        }
      } else {
        return time
      }
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

/*** 表格容器 ***/
.deleteBtn { /* 删除按钮 */
  margin: 5px 0;
}
.comInput {
  width: 125px;
  margin: 2px 0;
}
.warningIcon { /* 报错 */
  color: #F56C6C;
  font-size: 16px;
}
.red {
  color: #F56C6C;
}
.hover {
  cursor: pointer;
}

/*** 时间选择器 ***/
.comDatePicker {
  width: 125px;
  margin: 2px 0;
}

/*** 弹出层 ***/
.lineBox {
  font-size: 12px;
  border-bottom: 1px solid #E4E7ED;
  border-left: 1px solid #E4E7ED;
  display: flex;
  align-items: center;
  flex: 1;
}
.lineBox:first-child {
  border-top: 1px solid #E4E7ED;
}
.lineLabel {
  width: 110px;
  min-width: 110px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.lineText {
  min-height: 35px;
  padding: 0 6px;
  border-right: 1px solid #E4E7ED;
  display: flex;
  align-items: center;
  flex: 1;
}
.comInput2 {
  flex: 1;
}
</style>

<style>
/*** 弹出气泡 ***/
.el-popover {
  max-width: 400px !important;
}

/*** 时间选择器：报错 ***/
.errorPicker > input {
  color: #F56C6C !important;
  border-color: #F56C6C !important;
}

/*** 弹出层 ***/
.comDialog > .el-dialog > .el-dialog__body {
  padding: 10px 20px !important;
}
</style>
