
<!-- 模块：表格 -->

<template>
  <div class="comTableBox" ref="comTableBox">

    <el-table class="comTable" :data="projectList" size="mini" border :height="tableHeight"
      v-for="(table, tableIndex) in tableArr" :key="'table_' + table" v-show="tableIndex === tableArr.length - 1"
    >
      <!-- 操作 -->
      <el-table-column label="操作" width="80">
        <template slot-scope="scope">
          <el-popconfirm :title="'确定要删除 ' + scope.row.item_name + ' 吗？'"
            icon="el-icon-info" iconColor="red" confirmButtonType="text" @onConfirm="deleteData(scope.$index)"
          >
            <el-tag class="deleteBtn" slot="reference" size="mini" plain>删除</el-tag>
          </el-popconfirm>
        </template>
      </el-table-column>
      <!-- 项目名称 -->
      <el-table-column label="项目名称" width="110">
        <template slot-scope="scope">
          <el-popover popper-class="comPopover" :visible-arrow="false" placement="right" trigger="hover" :content="scope.row.itemInformation">
            <span slot="reference">{{scope.row.item_name}}</span>
          </el-popover>
        </template>
      </el-table-column>
      <!-- 下单日期 -->
      <el-table-column prop="order_time" label="下单日期" width="110"></el-table-column>
      <!-- 客人交期 -->
      <el-table-column prop="deliver_date" label="客人交期" width="110"></el-table-column>

      <el-table-column v-for="item in nodeMapList" :key="'node_' + item.node_id" :label="item.node_name" width="170">
        <template slot-scope="scope">
          <el-input v-if="scope.row[item.node_id] && (typeof scope.row[item.node_id].first_plant_enddate === 'string' || typeof scope.row[item.node_id].first_plant_enddate === 'object')"
            class="comInput" :class="scope.row[item.node_id].is_quote === 1 && !scope.row[item.node_id].first_plant_enddate ? 'errorPicker' : ''" slot="reference" size="mini"
            :placeholder="scope.row[item.node_id].is_quote === 1 ? '请输入日期' : '请输入日期或 /'"
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
    ...mapState(['projectList', 'nodeMapList', 'tableArr'])
  },
  methods: {
    blur(index, name) {
      const { projectList } = this
      const time = this._toggleTime(projectList[index][name].first_plant_enddate)
      const { order_time, deliver_date } = projectList[index]
      const time_1 = new Date(order_time).getTime()
      const time_2 = new Date(deliver_date).getTime()
      const num = new Date(time).getTime()
      if ((time_1 <= num && num <= time_2) || (projectList[index][name].is_quote === 0 && time === '/') || time === '') {
        // (在区间内) || (节点没被引用 && 不填) || (没输入时间)
        this.projectList[index][name].first_plant_enddate = time
      } else {
        this.$message.error('请输入 下单日期 和 客人交期 之间的时间')
        this.projectList[index][name].first_plant_enddate = ''
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
      /** 创建新表格 **/
      this.$store.commit('createdNewTable')
    },
    _toggleTime(time) {
      if (time === '/') {
        return time
      } if (time) {
        const [three, two, one] = time.split(/[-//.]/g).reverse()
        /* 处理：年 */
        let year = parseInt(new Date().getFullYear()) // 年 {[Int]}
        if (!isNaN(parseInt(one))) {
          const str = String(one).trim()
          year = parseInt(String(year).slice(0, -1 * str.length) + str)
        }
        /* 处理：月 */
        let addYear = 0 // 增加的年份 {[Int]}
        let month = isNaN(parseInt(two)) ? 1 : parseInt(two) // 月 {[Int]}
        for (let i = 0; ; i++) {
          if (month > 12) {
            addYear++
            month -= 12
          } else {
            break
          }
        }
        year = year + addYear
        /* 处理：日 */
        let year_2 = month < 12 ? year : year + 1
        let month_2 = month < 12 ? month + 1 : month + 1 - 12
        let day = isNaN(parseInt(three)) ? 1 : parseInt(three) // 日 {[Int]}
        for (let i = 0; ; i++) {
          const maxDay = new Date(new Date(`${year_2}-${month_2}`).getTime() - 1000 * 60 * 60 * 24).getDate()
          if (day > maxDay) {
            day -= maxDay
            month++
            month_2++
            if (month > 12) {
              month -= 12
              year += 1
              year_2 += 1
            }
            if (month_2 > 12) {
              month_2 -= 12
            }
          } else {
            break
          }
        }
        /* 整合 */
        return `${year}-${'00'.slice(0, -1 * String(month).length) + month}-${'00'.slice(0, -1 * String(day).length) + day}`
      } else {
        return ''
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
  cursor: pointer;
}

.comInput {
  width: 125px;
  margin: 2px 0;
}
</style>

<style>
.comTable {
  border-top: 0 !important;
}

/*** 弹出气泡 ***/
.el-popover {
  max-width: 400px !important;
}

/*** 时间选择器：报错 ***/
.errorPicker > input {
  color: #F56C6C !important;
  border-color: #F56C6C !important;
}
</style>
