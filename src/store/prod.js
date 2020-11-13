
import Api from '@/config/api'
import Tool from './tool.js'
import { Loading } from 'element-ui'

/**
 * 生产环境代码
 */
const Prod = {}

/**
 * [请求：页面初始化数据]
 * @page 第一页
 */
Prod.A_getItemNodeTemple = function (state, status = '初始化') {
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
    // localStorage.setItem('投产排产节点提报：页面初始化数据', JSON.stringify(res))
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
  }
  Api({ name, obj, loading, suc })
}

/**
 * [请求：下一步]
 * @page 第一页
 */
Prod.A_generateItemGanttSummary = function (state, that) {
  const { projectList, nodeMapList } = state
  const { pageType } = state
  const { datalist, errorObj } = Tool.returnDatalist(projectList, nodeMapList)
  /* 整理报错项目 */
  const textArr = []
  for (const x in errorObj) {
    const item = errorObj[x]
    if (item.length) {
      textArr.push(`${x}:${item.join('、')}`)
    }
  }
  if (textArr.length) {
    /* ----- 报错 ----- */
    // const message = textArr.join('，')
    // that.$alert(`请完善 ${message} 后再进行下一步操作`, '', { confirmButtonText: '确定' })
    that.$alert('请完成全部节点后再进行下一步操作', '', { confirmButtonText: '确定' })
  } else {
    /* ----- 发起请求 ----- */
    const name = '下一步'
    const obj = { type: pageType, datalist }
    const suc = function (res) {
      // console.log('投产排产节点提报：下一步 ----- ', res)
      // localStorage.setItem('投产排产节点提报：下一步', JSON.stringify(res))
      /* 处理数据 */
      const { itemMapList, nodeMapList } = res
      state.next_nodeMapList = nodeMapList // 表头节点信息
      itemMapList.map(function (item) {
        for (const x in item) {
          if (x === 'nodeTemplateMapList') {
            item[x].map(function (data) {
              const { first_plant_enddate } = data
              //                         提报时的时间                            调整/异常原因         是否调整       调整后的时间
              const item_node_change = { frist_plan_time: first_plant_enddate, change_remaark: '', is_change: 0, change_plan_time: '' }
              data.item_node_change = item_node_change
            })
          }
        }
      })
      state.next_itemMapList = itemMapList // 项目节点信息
      /* 路由跳转 */
      that.$router.push({ name: '生成' })
      state.isComputed_2 = true
    }
    const loading = '生成中...'
    Api({ name, obj, suc, loading })
  }
}

/**
 * [请求：暂存、提交]
 * @page 第二页
 */
Prod.A_itemCustomNode = function (state, audit_status, that) {
  const { pageType, next_itemMapList, next_nodeMapList } = state
  const { itemids, datalist, errorObj = {} } = Tool.submitProving(next_itemMapList, next_nodeMapList)
  /* 报错节点数 */
  let errorNum = 0
  for (const x in errorObj) {
    errorNum += errorObj[x].arr.length
  }
  if (errorNum) {
    /* ----- 报错 ----- */
    const textArr = []
    for (const x in errorObj) {
      const item = errorObj[x]
      textArr.push(`${item.name}:${item.arr.join('、')}`)
    }
    const message = textArr.join('，')
    that.$alert(`请完善 ${message} 后再提交`, '', { confirmButtonText: '确定', showClose: false })
  } else {
    if (!datalist.length) {
      that.$alert('没有需要提交的节点', '', { confirmButtonText: '确定', showClose: false })
    } else {
      /* ----- 发起请求 ----- */
      const name = '保存'
      const obj = { type: 1, itemids, audit_type: pageType, datalist: JSON.stringify(datalist), audit_status }
      const suc = function (res) {
        const loading = Loading.service({ text: audit_status === '1' ? '暂存成功' : '提交成功', spinner: 'el-icon-circle-check' })
        setTimeout(() => {
          loading.close()
          /* 暂存：打开甘特表列表页 */
          if (audit_status === '1') {
            const host = window.location.origin + '/nova/'
            // eslint-disable-next-line
            ui("open", {
              title: '大货甘特表汇总',
              url: `${host}pages/itemganttsummary/itemGanttSummaryShow.html`,
              onClose: function () {}
            })
          }
          /* 关闭页面 */
          // eslint-disable-next-line
          dg.close()
        }, 1000)
      }
      const loading = audit_status === '1' ? '暂存中...' : '提交中...'
      Api({ name, obj, suc, loading })
    }
  }
}

export default Prod
