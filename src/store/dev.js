
import Tool from './tool.js'

/**
 * 本地开发代码
 * @ [调用本地数据]
 * @ [不请求接口]
 */
const Dev = {}

/**
 * [请求：页面初始化数据]
 * @page 第一页
 */
Dev.A_getItemNodeTemple = function (state, status = '初始化') {
  /* ----- 本地数据 ----- */
  const res = JSON.parse(localStorage.getItem('投产排产节点提报：页面初始化数据'))
  console.log('投产排产节点提报：页面初始化数据 ----- ', res)

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

/**
 * [请求：下一步]
 * @page 第一页
 */
Dev.A_generateItemGanttSummary = function (state, that) {
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
    console.log('报错 ----- ', textArr)
    that.$alert('请完成全部节点后再进行下一步操作', '', { confirmButtonText: '确定' })
  } else {
    /* ----- 发起请求 ----- */
    console.log(`下一步发起请求 --- type：`, pageType)
    console.log(`下一步发起请求 --- datalist`, datalist)
    /* ----- 路由跳转 ----- */
    that.$router.push({ name: '生成' })
  }
}

/**
 * [第二页加载数据]
 */
Dev.page2Created = function ({ that }) {
  /* 表格类型 */
  const local = JSON.parse(localStorage.getItem('NOVA_itemGanttType')) || {}
  const typeObj = { '1': '大货甘特表汇总', '1.1': '排产前节点', '1.2': '投产节点', '2': '大货面料甘特表汇总', '3': '大货工厂甘特表' }
  const { pageType = '1' } = local
  const pageTypeText = typeObj[pageType] || ''
  that.$store.commit('saveData', { name: 'pageType', obj: pageType })
  that.$store.commit('saveData', { name: 'pageTypeText', obj: pageTypeText })
  /* 调用下一步的回调数据 */
  const { itemMapList, nodeMapList } = JSON.parse(localStorage.getItem('投产排产节点提报：下一步'))
  that.$store.commit('saveData', { name: 'next_nodeMapList', obj: nodeMapList })
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
  that.$store.commit('saveData', { name: 'next_itemMapList', obj: itemMapList })
}

/**
 * [请求：暂存、提交]
 * @page 第二页
 */
Dev.A_itemCustomNode = function (state, audit_status, that) {
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
      console.log(`暂存、提交发起请求 --- type：`, 1)
      console.log(`暂存、提交发起请求 --- itemids`, itemids)
      console.log(`暂存、提交发起请求 --- audit_type`, pageType)
      console.log(`暂存、提交发起请求 --- datalist`, datalist)
      console.log(`暂存、提交发起请求 --- audit_status`, audit_status)
    }
  }
}

export default Dev
