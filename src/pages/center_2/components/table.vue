
<!-- 模块：表格 -->

<template>
  <div class="comTableBox" ref="comTableBox">

    <el-table :data="next_list" size="mini" border :height="tableHeight" :span-method="objectSpanMethod">
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
            <!-- 计划完成 -->
            <div v-if="!(scope.row.index % 2)">
              <!-- 计划完成：用户提报 -->
              <div v-if="_isInputEdit(scope.row, item)">
                <el-popover popper-class="comPopover" :visible-arrow="false" placement="left" trigger="focus" :content="scope.row[item.node_id].maxMinText">
                  <el-input class="comTimeInput" :class="scope.row[item.node_id].error ? 'errorInput' : ''" slot="reference" size="mini"
                    placeholder="请输入日期或 /" maxlength="10"
                    v-model="scope.row[item.node_id].first_plant_enddate" @blur="blur_table('first_plant_enddate', $event, scope.row, item.node_id, item.node_name)"
                  ></el-input>
                </el-popover>
              </div>
              <!-- 计划完成：系统计算 -->
              <div class="hover" v-if="_isAlertEdit(scope.row, item)">
                <el-popover popper-class="comPopover" :visible-arrow="false" placement="left" trigger="hover" :content="scope.row[item.node_id].maxMinText">
                  <p slot="reference" @click="edit(scope.row, item.node_id, item.node_name)">
                    <span :class="scope.row[item.node_id].error ? 'red' : ''">{{scope.row[item.node_id].first_plant_enddate}}</span>
                    <i class="el-icon-warning warningIcon" v-if="scope.row[item.node_id].error"></i>
                  </p>
                </el-popover>
              </div>
            </div>
            <!-- 本次调整 -->
            <span v-else>
              <div v-if="_isShowInput(scope.row, item)">
                <el-input class="comTimeInput" :class="_isShowInput(scope.row, item) ? 'errorInput' : ''" size="mini" placeholder="请输入异常原因" type="textarea"
                  v-model="text[`${scope.$index}_${item.node_id}`]" @blur="blur_table('change_remaark', $event, scope.row, item.node_id, item.node_name)"
                ></el-input>
              </div>
              <div v-else style="text-align: left;">
                <p v-if="_isShowText(scope.row, item)">
                  调整后：{{scope.row[item.node_id].item_node_change.change_plan_time || '未调整'}}
                </p>
                <p v-if="_isShowText(scope.row, item)">
                  原因：{{scope.row[item.node_id].item_node_change.change_remaark}}
                </p>
              </div>
            </span>
          </div>
          <span v-else>--</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 弹出层 -->
    <el-dialog class="comDialog" :title="d_data.title" :visible.sync="dialogVisible" width="80%" :close-on-click-modal="false" :close-on-press-escape="false">
      <!-- 弹出层：表单 -->
      <div class="lineBox">
        <div class="lineLabel">当前异常节点：</div>
        <div class="lineText">{{d_data.node_name}}</div>
      </div>
      <div class="lineBox">
        <div class="lineLabel">系统计算时间：</div>
        <div class="lineText">{{d_data.oldTime}}</div>
        <div class="lineLabel">节点完成说明：</div>
        <div class="lineText">{{d_data.verification_remark}}</div>
      </div>
      <div class="lineBox">
        <div class="lineLabel">是否调整日期：</div>
        <div class="lineText">
          <el-radio v-model="d_data.is_change" :label="1" @change="isChangeTime">是</el-radio>
          <el-radio v-model="d_data.is_change" :label="0" @change="isChangeTime">否</el-radio>
        </div>
        <div class="lineLabel">调整后日期：</div>
        <div class="lineText">
          <el-input class="comTimeInput" :class="d_data.error && d_data.is_change === 1 ? 'errorInput' : ''" slot="reference" size="mini" placeholder="请输入日期"
            :disabled="d_data.is_change === 0 ? true : false" maxlength="10"
            v-model="d_data.change_plan_time" @blur="blur_dialog('change_plan_time')"
          ></el-input>
        </div>
      </div>
      <div class="lineBox">
        <div class="lineLabel">日期最小值：</div>
        <div class="lineText">
          {{d_data.min_plant_enddate}}
        </div>
        <div class="lineLabel">日期最大值：</div>
        <div class="lineText">
          {{d_data.max_plant_enddate}}
        </div>
      </div>
      <div class="lineBox">
        <div class="lineLabel">
          <span class="red" v-if="d_data.error">*</span>
          调整/异常原因：
        </div>
        <div class="lineText">
          <el-input class="comInput2" v-model="d_data.change_remaark" size="mini" placeholder="请填写调整/异常原因"></el-input>
        </div>
      </div>
      <div class="lineBox" v-if="d_data.is_change === 1">
        <div class="lineLabel" style="width: auto;">&nbsp;&nbsp;&nbsp;是否根据当前节点的时间去计算其他节点：</div>
        <div class="lineText">
          <el-radio v-model="d_data.isComputedOther" :label="true">是</el-radio>
          <el-radio v-model="d_data.isComputedOther" :label="false">否</el-radio>
        </div>
      </div>
      <!-- 弹出层：按钮 -->
      <span slot="footer" class="dialog-footer">
        <el-button size="mini" @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" size="mini" @click="submit">保 存</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import Tool from '../../../store/tool.js'
import { mapState, mapGetters } from 'vuex'
export default {
  created() {
    /** 计算：表格高度 **/
    this._countHeight()
  },
  data() {
    return {
      text: {},
      /* 弹出层 */
      dialogVisible: false, // 弹出层：是否显示
      d_data: {}, //           弹出层：数据
      /* 页面 */
      tableHeight: 0 //        表格高度
    }
  },
  computed: {
    ...mapState(['next_itemMapList', 'next_nodeMapList', 'tableArr', 'tableActive', 'pageTypeText', 'isSubmit', 'isComputed_2']),
    ...mapGetters(['next_list'])
  },
  methods: {
    /**
     * [失焦：表格input]
     * @param {[String]} name     属性名
     * @param {[Object]} event    时间对象
     * @param {[Object]} row      行对象
     * @param {[String]} nodeId   节点ID
     * @param {[String]} nodeName 节点名称
     */
    blur_table(name, event, row, nodeId, nodeName) {
      const { next_itemMapList } = this
      const { index } = row
      let { value } = event.target
      if (name === 'first_plant_enddate') {
        /* ----- 计划完成 ----- */
        const node = next_itemMapList[index / 2][nodeId]
        const { oldTime } = node
        value = Tool._toggleTime(value)
        const is_change = oldTime !== value ? 1 : 0
        node.item_node_change.is_change = is_change
        node.first_plant_enddate = value
        node.item_node_change.change_plan_time = is_change === 1 ? value : ''
        node.isComputedOther = true
        this.$store.commit('saveData', { name: 'changeIndexId', obj: `${index / 2}_${nodeId}_${nodeName}` })
        this.$store.commit('saveData', { name: 'isComputed_2', obj: true })
      } else if (name === 'change_remaark') {
        /* ----- 本次调整 ----- */
        const node = next_itemMapList[(index - 1) / 2][nodeId]
        node.item_node_change.change_remaark = value
        this.$store.commit('saveData', { name: 'changeIndexId', obj: `${index / 2}_${nodeId}_${nodeName}` })
        this.$store.commit('saveData', { name: 'isComputed_2', obj: true })
      }
    },
    /**
     * [弹出层：显示]
     * @param {[Object]} row      当前行的数据
     * @param {[String]} nodeId   节点ID
     * @param {[String]} nodeName 节点名称
     */
    edit(row, nodeId, nodeName) {
      // console.log(row[nodeId])
      const { index, item_name, order_time, deliver_date } = row
      const { error, oldTime, first_plant_enddate, verification_remark, isComputedOther = false, item_node_change: { is_change = 0, change_plan_time, change_remaark, frist_plan_time }, min_plant_enddate, max_plant_enddate } = row[nodeId]
      const title = error ? '节点异常处理' : '节点编辑'
      const { pageTypeText } = this
      const node_name = [item_name, pageTypeText, nodeName].join(' > ')
      /* 赋值 */
      const d_data = {
        index, //               项目索引
        order_time, //          下单日期
        deliver_date, //        客人交期
        title, //               弹出层标题
        nodeId, //              节点ID
        error, //               是否报错
        node_name, //           当前异常节点
        nodeName, //            节点名称
        oldTime, //             系统计算日期
        first_plant_enddate, // 当前时间
        verification_remark, // 异常原因
        min_plant_enddate, //   日期最小值
        max_plant_enddate, //   日期最大值
        is_change, //           是否调整日期
        isComputedOther, //     是否根据当前节点的时间去计算其他节点
        change_plan_time, //    调整后日期
        change_remaark, //      调整/异常原因
        frist_plan_time //      下一步返回的时间
      }
      this.d_data = d_data
      this.dialogVisible = true
    },
    /**
     * [弹出层：是否调整日期]
     */
    isChangeTime(event) {
      if (event === 0) {
        this.d_data.isComputedOther = false
        this.blur_dialog('oldTime')
      }
    },
    /**
     * [弹出层：日期失焦]
     * @param {[String]} name 属性名 { change_plan_time: '调整，日期失焦', oldTime: '不调整，日期还原' }
     */
    blur_dialog(name) {
      const { d_data } = this
      const { max_plant_enddate, min_plant_enddate, order_time, deliver_date } = d_data
      const time = Tool._toggleTime(d_data[name])
      const { status } = Tool._isError(max_plant_enddate, min_plant_enddate, time, order_time, deliver_date)
      this.d_data.first_plant_enddate = time
      this.d_data.error = status
      this.d_data.change_plan_time = name === 'change_plan_time' ? time : ''
    },
    /**
     * [弹出层：保存]
     */
    submit() {
      const { d_data, next_itemMapList } = this
      const { index, error, nodeId, oldTime, first_plant_enddate, change_plan_time, change_remaark, is_change, frist_plan_time, isComputedOther, nodeName } = d_data
      /* ----- 验证 ----- */
      /* 报错：报错 && 没写'调整/异常原因' */
      if (error && !change_remaark) {
        this.$message({ showClose: true, message: '请填写 调整/异常原因 后再保存', type: 'warning' })
        return false
      }
      /* 报错：变更 && （没写时间 || 系统计算时间 === 当前时间） */
      if (is_change === 1 && (!change_plan_time || oldTime === change_plan_time)) {
        this.$message({ showClose: true, message: '请修改 调整日期 后再保存', type: 'warning' })
        return false
      }
      /* ----- 保存 ----- */
      const node = next_itemMapList[index / 2][nodeId]
      node.first_plant_enddate = change_plan_time
      node.error = error
      node.isComputedOther = isComputedOther
      node.item_node_change = Object.assign({}, { frist_plan_time, change_remaark, is_change, change_plan_time })
      // 微信截图         报错的时间，没存文字
      if (is_change === 0) {
        node.first_plant_enddate = first_plant_enddate
        node.item_node_change = Object.assign({}, { frist_plan_time, change_remaark: '', is_change, change_plan_time: '' })
      }
      this.$store.commit('saveData', { name: 'changeIndexId', obj: `${index / 2}_${nodeId}_${nodeName}` })
      this.$store.commit('saveData', { name: 'isComputed_2', obj: true })
      this.dialogVisible = false
    },
    /**
     * [表格：合并行]
     */
    objectSpanMethod({ row, column, rowIndex, columnIndex }) {
      if (columnIndex < 3) {
        if (!(rowIndex % 2)) {
          return { rowspan: 2, colspan: 1 }
        } else {
          return { rowspan: 0, colspan: 0 }
        }
      }
    },
    /**
     * [是否：input修改]
     * @param  {[Object]}  row  表格单行数据
     * @param  {[Object]}  item 节点信息
     * @return {[Boolean]}      是否显示
     */
    _isInputEdit(row, item) {
      const node = row[item.node_id]
      let status = false
      if (node) { // 有此节点
        if (String(node.submit_type) === '2' || node.otherType === 1) { // 用户提报 || 系统计算为空值
          status = true
        }
      }
      return status
    },
    /**
     * [是否：弹出层修改]
     * @param  {[Object]}  row  表格单行数据
     * @param  {[Object]}  item 节点信息
     * @return {[Boolean]}      是否显示
     */
    _isAlertEdit(row, item) {
      const node = row[item.node_id]
      let status = false
      if (node) {
        if (String(node.submit_type) === '1' && node.otherType !== 1) { // 系统计算 && 系统计算有值
          status = true
        }
      }
      return status
    },
    /**
     * [是否：本次调整 显示 input]
     * @param  {[Object]}  row  表格单行数据
     * @param  {[Object]}  item 节点信息
     * @return {[Boolean]}      是否显示
     */
    _isShowInput(row, item) {
      const node = row[item.node_id]
      let status = false
      if (node) {
        const { submit_type, error, otherType } = node
        if ((String(submit_type) === '2' && error) || otherType === 1) { // (用户提报 && 日期报错) || 系统计算为空值)
          status = true
        }
      }
      return status
    },
    /**
     * [是否：本次调整 显示 文字]
     * @param  {[Object]}  row  表格单行数据
     * @param  {[Object]}  item 节点信息
     * @return {[Boolean]}      是否显示
     */
    _isShowText(row, item) {
      const node = row[item.node_id]
      let status = false
      if (node.item_node_change && node.item_node_change.change_remaark) { // 调整说明
        status = true
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
</style>
