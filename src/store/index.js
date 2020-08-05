// 组装模块并导出 store

import Vue from 'vue'
import Vuex from 'vuex'
import Api from '@/config/api'
import Tool from './tool.js'
Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {},

  state: {
    /* 缓存数据 */
    pageType: '', //         页面（甘特表）类型
    /* 第一页 */
    itemids: '', //          所有项目id
    projectList: [], //      项目列表
    nodeMapList: [], //      节点列表
    tableArr: ['asd'], //    表格列表
    addProjectList: [], //   选择项目
    /* 第二页 */
    isComputed_2: true, //   是否触发：计算第二页数据
    isSubmit: false, //      弹出层：是否能保存
    next_itemMapList: [], // 项目节点信息
    next_nodeMapList: [] //  表头节点信息
  },

  getters: {
    /**
     * [第二页数据]
     * @page 第二页
     */
    next_list(state) {
      const { next_itemMapList, isComputed_2 } = state
      const arr = Tool.next_list(next_itemMapList, isComputed_2, state)
      return arr
    },
    /**
     * [所有项目名称]
     */
    itenames(state) {
      const { projectList } = state
      const strArr = []
      projectList.forEach(function (item) {
        strArr.push(item.item_name)
      })
      return strArr.join(',')
    }
  },

  mutations: {
    /**
     * [保存数据]
     * @param {[String]} name 属性名
     * @param {[Object]} obj  属性值
     */
    saveData(state, params) {
      const { name, obj } = params
      state[name] = obj
    },
    /**
     * [创建新表格]
     */
    createdNewTable(state) {
      state.tableArr.push(new Date().getTime())
    }
  },

  actions: {
    /**
     * [请求：页面初始化数据]
     * @page 第一页
     */
    A_getItemNodeTemple({ state, commit, getters }, { status = '初始化' }) {
      const { pageType, itemids } = state
      let itemIds = itemids
      if (status === '创建') {
        const { itemids = '' } = JSON.parse(localStorage.getItem('choiceGanttSummaryItemData')) || {}
        itemIds = itemids
      }
      /* ----- 发起请求 ----- */
      const name = '初始化数据'
      const obj = { itemIds, type: pageType }
      const loading = '数据初始化中...'
      const suc = function (res) {
        const { itemMapList, nodeMapList, itemids } = res
        /* 提取节点数据 */
        itemMapList.map(function (item, index) {
          item.nodeTemplateMapList.forEach(function (val) {
            item[val.node_id] = Object.assign({}, val, { first_plant_enddate: '' })
          })
          item.index = index
        })
        /* 初始化时，记录表格节点列 */
        if (status === '初始化') {
          state.nodeMapList = nodeMapList
          state.itemids = itemids
        }
        if (status === '创建') {
          /* 创建时，保留原始项目数据 */
          const { projectList } = state
          const tableObj = {}
          const tableArr = []
          projectList.forEach(function (item) {
            tableObj[item.item_id] = item
            tableArr.push(item)
          })
          itemMapList.forEach(function (item) {
            if (!tableObj[item.item_id]) {
              tableArr.push(item)
            }
          })
          state.projectList = tableArr
        } else {
          /* 初始化时，直接赋值 */
          state.projectList = itemMapList
        }
        /* 创建时，刷新表格 */
        if (status === '创建') {
          commit('createdNewTable') // 创建新表格
        }
      }
      Api({ name, obj, loading, suc })
    },
    /**
     * [请求：下一步]
     * @page 第一页
     */
    A_generateItemGanttSummary({ state }, { that }) {
      const { projectList, nodeMapList } = state
      const { pageType } = state
      const { datalist, errorObj } = Tool.returnDatalist(projectList, nodeMapList)
      if (Object.keys(errorObj).length) {
        /* ----- 报错 ----- */
        const textArr = []
        for (const x in errorObj) {
          const item = errorObj[x]
          textArr.push(`${x}:${item.join('、')}`)
        }
        const message = textArr.join('，')
        that.$alert(`请完善 ${message} 后再进行下一步操作`, '', { confirmButtonText: '确定' })
      } else {
        /* ----- 发起请求 ----- */
        const name = '下一步'
        const obj = { type: pageType, datalist }
        const suc = function (res) {
          localStorage.setItem('asd', JSON.stringify(res))
          /* 处理数据 */
          const { itemMapList, nodeMapList } = res
          state.next_nodeMapList = nodeMapList // 表头节点信息
          const arr = []
          itemMapList.forEach(function (item) {
            const obj = {}
            for (const x in item) {
              obj[x] = item[x]
              if (x === 'nodeTemplateMapList') {
                /* 节点异常处理记录 */
                //                         提报时的时间           调整/异常原因              是否调整        调整后的时间
                const item_node_change = { frist_plan_time: '', abnormal_reason: '', is_change: 0, change_plan_time: '' }
                /* 复制一份 nodeTemplateMapList：①用于对比是否改变过值 ②独立数据，不会随组件改变 */
                obj.nodeList_0 = []
                item[x].map(function (node) {
                  node.item_node_change = Object.assign({}, item_node_change)
                  obj.nodeList_0.push(Object.assign({}, node))
                })
              }
            }
            arr.push(obj)
          })
          state.next_itemMapList = arr // 项目节点信息
          /* 路由跳转 */
          that.$router.push({ name: '生成' })
        }
        const loading = '生成中...'
        Api({ name, obj, suc, loading })
      }
    },
    /**
     * [请求：暂存、提交]
     * @page 第二页
     */
    A_itemCustomNode({ state }, { audit_status, that }) {
      const { pageType, next_itemMapList, next_nodeMapList } = state
      const { itemids, datalist, nameObj = {} } = Tool.submitProving(next_itemMapList, next_nodeMapList)
      if (Object.keys(nameObj).length) {
        /* ----- 报错 ----- */
        const textArr = []
        for (const x in nameObj) {
          const item = nameObj[x]
          textArr.push(`${item.name}:${item.arr.join('、')}`)
        }
        const message = textArr.join('，')
        that.$alert(`请完善 ${message} 后再提交`, '', { confirmButtonText: '确定' })
      } else {
        /* ----- 发起请求 ----- */
        const name = '保存'
        const obj = { type: 1, itemids, audit_type: pageType, datalist: JSON.stringify(datalist), audit_status }
        const suc = function (res) {
          // eslint-disable-next-line
          dg.close()
        }
        const loading = audit_status === '1' ? '暂存中...' : '提交中...'
        Api({ name, obj, suc, loading })
      }
    }
  }
})

export default store