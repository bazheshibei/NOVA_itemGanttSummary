
<!-- 模块：表格 -->

<template>
  <div class="comTableBox" ref="comTableBox">

    <el-table class="comTable" :data="projectList" size="mini" border :height="tableHeight">
      <!-- 操作 -->
      <el-table-column label="操作" width="80">
        <template slot-scope="scope">
          <el-popconfirm :title="'确定要删除 ' + scope.row.item_name + ' 吗？'"
            icon="el-icon-info" iconColor="red" confirmButtonType="text" @confirm="deleteData(scope.$index)"
          >
            <el-tag class="comDeleteBtn" slot="reference" size="mini" plain>删除</el-tag>
          </el-popconfirm>
        </template>
      </el-table-column>
      <!-- 项目名称 -->
      <el-table-column label="项目名称" width="100">
        <template slot-scope="scope">
          <el-popover v-if="scope.row.itemInformation" popper-class="comPopover" :visible-arrow="false" placement="right" trigger="hover" :content="scope.row.itemInformation">
            <span slot="reference">{{scope.row.item_name}}</span>
          </el-popover>
          <span v-else>{{scope.row.item_name}}</span>
        </template>
      </el-table-column>
      <!-- 下单日期 || 面料名称 || 面料下单日期 -->
      <el-table-column width="100">
        <template slot="header" slot-scope="scope">
          <p v-if="pageTitle === '面料'">面料名称</p>
          <p v-else-if="pageTitle === '开发'">面料下单日期</p>
          <p v-else>下单日期</p>
        </template>
        <template slot-scope="scope">
          <p v-if="pageTitle === '面料'">{{scope.row.material_describe}}</p>
          <p v-else-if="pageTitle === '开发'">{{scope.row.kf_receive_material_time}}</p>
          <p v-else>{{scope.row.order_time}}</p>
        </template>
      </el-table-column>
      <!-- 客人交期 || 面料下达日期 || 款式图下达日期 -->
      <el-table-column width="100">
        <template slot="header" slot-scope="scope">
          <p v-if="pageTitle === '面料'">面料下达日期</p>
          <p v-else-if="pageTitle === '开发'">款式图下达日期</p>
          <p v-else>客人交期</p>
        </template>
        <template slot-scope="scope">
          <p v-if="pageTitle === '面料'">{{scope.row.matter_release_time}}</p>
          <p v-else-if="pageTitle === '开发'">{{scope.row.kf_order_time}}</p>
          <p v-else>{{scope.row.deliver_date}}</p>
        </template>
      </el-table-column>
      <!-- 一次样意见 -->
      <el-table-column v-if="pageTitle === '开发' && String(pageType) === '4'" label="一次样意见" width="100">
        <template slot-scope="scope">
          <p>{{scope.row.ycyyjdate}}</p>
        </template>
      </el-table-column>
      <!-- 二次样意见 -->
      <el-table-column v-if="pageTitle === '开发' && String(pageType) === '5'" label="二次样意见" width="100">
        <template slot-scope="scope">
          <p>{{scope.row.ecyyjdate}}</p>
        </template>
      </el-table-column>
      <!-- 面料确认时间 -->
      <el-table-column v-if="pageTitle === '开发' && (String(pageType) === '4' || String(pageType) === '5')" label="面料确认时间" width="100">
        <template slot-scope="scope">
          <p>{{scope.row.mlqrdate}}</p>
        </template>
      </el-table-column>

      <el-table-column v-for="item in nodeMapList" :key="'node_' + item.node_id" :label="item.node_name" width="150">
        <template slot-scope="scope">
          <div v-if="_isShowInput(scope.row, item)">
            <!-- 计划完成：文本节点 -->
            <el-input v-if="_isContentNode(scope.row, item)" class="comTimeInput" size="mini" placeholder="请输入文字内容" maxlength="200"
              v-model="scope.row[item.node_id].first_plant_enddate" @blur="blur(scope.$index, item.node_id)"
            ></el-input>
            <!-- 计划完成：时间节点 -->
            <el-input v-else class="comTimeInput" size="mini" placeholder="请输入日期或 /" maxlength="10"
              v-model="scope.row[item.node_id].first_plant_enddate" @blur="blur(scope.$index, item.node_id)"
            ></el-input>
          </div>
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
    ...mapState(['projectList', 'nodeMapList', 'pageType', 'pageTitle'])
  },
  methods: {
    /**
     * [输入框失焦]
     * @param {[Int]}    index   项目索引
     * @param {[String]} node_id 节点ID
     */
    blur(index, node_id) {
      const { projectList, pageTitle } = this
      const { first_plant_enddate, node_content_type } = projectList[index][node_id]
      if (node_content_type === 'time' || node_content_type !== 'content') {
        /* ----- 时间节点 ----- */
        const time = Tool._toggleTime(first_plant_enddate)
        const { order_time, deliver_date, matter_release_time, kf_order_time } = projectList[index]
        const time_1 = new Date(order_time).getTime() //          下单日期
        const time_2 = new Date(deliver_date).getTime() //        客人交期
        const time_3 = new Date(matter_release_time).getTime() // 面料下达日期
        const time_4 = new Date(kf_order_time) //                 款式图下达日期
        const num = new Date(time).getTime() //                   当前时间
        if (pageTitle === '面料') { /* ----- 面料 ----- */
          if (time_3 <= num || time === '/' || time === '') { // 保存日期：(大于面料下达日期) || 不填 || 没输入时间
            this.projectList[index][node_id].first_plant_enddate = time
          } else { // 重置日期
            this.$message.error('请输入大于 面料下达日期 的时间')
            this.projectList[index][node_id].first_plant_enddate = ''
          }
        } else if (pageTitle === '开发') { /* ----- 开发 ----- */
          if (time_4 <= num || time === '/' || time === '') { // 保存日期：(大于款式图下达日期) || 不填 || 没输入时间
            this.projectList[index][node_id].first_plant_enddate = time
          } else { // 重置日期
            this.$message.error('请输入大于 款式图下达日期 的时间')
            this.projectList[index][node_id].first_plant_enddate = ''
          }
        } else {
          if ((time_1 <= num && num <= time_2) || time === '/' || time === '') { // 保存日期：(在区间内) || 不填 || 没输入时间
            this.projectList[index][node_id].first_plant_enddate = time
          } else { // 重置日期
            this.$message.error('请输入 下单日期 和 客人交期 之间的时间')
            this.projectList[index][node_id].first_plant_enddate = ''
          }
        }
      } else if (node_content_type === 'content') {
        /* ----- 文本节点 ----- */
        this.projectList[index][node_id].first_plant_enddate = first_plant_enddate
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
     * [是否：文本节点]
     * @param  {[Object]}  row  表格单行数据
     * @param  {[Object]}  item 节点信息
     * @return {[Boolean]}      是否显示
     */
    _isContentNode(row, item) {
      const node = row[item.node_id]
      let status = false
      if (node) { // 有此节点
        if (node.node_content_type === 'content') { // 文本节点
          status = true
        }
      }
      return status
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
