
// import { Message } from 'element-ui'

const Tool = {}

/**
 * [返回：datalist]
 * @page 第一页
 */
Tool.returnDatalist = function (list = [], nodeList = []) {
  const arr = []
  const nodeObj = {}
  const errorObj = {}
  /* 提取节点 */
  nodeList.forEach(function (item) {
    nodeObj[item.node_id] = item.node_name
  })
  /* 处理数据 */
  list.forEach(function (item) {
    const { deliver_date, itemInformation, item_gantt_id, item_id, item_name, node_template_id, order_time, style_id, nodeTemplateMapList } = item
    const obj = { deliver_date, itemInformation, item_gantt_id, item_id, item_name, node_template_id, order_time, style_id, nodedatalist: [] }
    nodeTemplateMapList.forEach(function (val) {
      const data = item[val.node_id]
      const { first_plant_enddate, node_id } = data
      if (!first_plant_enddate) {
        /* 报错：空值（_toggleTime 方法会将'/'之外的非时间格式转为当年一月一号） */
        if (!errorObj[item_name]) {
          errorObj[item_name] = []
        }
        errorObj[item_name].push(nodeObj[node_id])
      }
      /* 添加数据 */
      obj.nodedatalist.push(data)
    })
    arr.push(obj)
  })
  return { datalist: JSON.stringify(arr), errorObj }
}

/**
 * [返回：第二页数据]
 * @page 第二页
 * @param {[Array]}   list          原始数据
 * @param {[Boolean]} isComputed_2  是否触发：计算第二页数据
 * @param {[String]}  changeIndexId 修改的数据索引及节点ID '4_2c9xadw244'
 */
Tool.next_list = function (list = [], isComputed_2, changeIndexId) {
  const that = this
  const arr = []
  const [itemIndex, nodeId, nodeName] = changeIndexId.split('_') // 项目索引， 节点ID
  // console.log('计算 ----- ', list, changeIndexId)
  list.forEach(function (item, index) {
    const { order_time, deliver_date } = item // 下单日期，客人交期
    if (index === parseInt(itemIndex) && isComputed_2) {
      /* 需要计算的项目 */
      const { node_code, isComputedOther } = item[nodeId] // 改变的：节点名称，code,是否根据当前节点的时间去计算其他节点
      if (isComputedOther) {
        /* ----- 计算：根据当前节点计算其他节点 ----- */
        /* 提取：节点时间 */
        let nodeCodeObj = {}
        for (const x in item) {
          const node = item[x]
          if (node instanceof Object && (node.node_id || node.node_code)) {
            const { first_plant_enddate, node_code } = node
            if (first_plant_enddate && first_plant_enddate !== '/') {
              nodeCodeObj['${' + node_code + '}'] = first_plant_enddate
            }
          }
        }
        nodeCodeObj = Object.assign({}, item.clacNodeMap, nodeCodeObj)
        /* 计算 */
        for (const x in item) {
          const node = item[x]
          if (node instanceof Object && (node.node_id || node.node_code) && x === nodeId) { // 自身节点
            /* 自身：验证是否报错 */
            const { node_code, first_plant_enddate, max_plant_enddate, min_plant_enddate } = node
            const { status, maxMinText } = that._isError(max_plant_enddate, min_plant_enddate, first_plant_enddate, order_time, deliver_date)
            node.item_node_change.change_remaark = status ? node.item_node_change.change_remaark : ''
            node.error = status
            node.maxMinText = maxMinText
            nodeCodeObj['${' + node_code + '}'] = first_plant_enddate
          }
        }
        for (const x in item) {
          const node = item[x]
          if (node instanceof Object && (node.node_id || node.node_code) && x !== nodeId) { // 其他节点
            /* 引用到此节点的其他节点：重新计算 */
            const { sys_clac_formula, max_section_value, min_section_value } = node
            if (sys_clac_formula.indexOf('${' + node_code + '}') > -1) { // 引用了此节点
              // console.log(node_code, node.node_code, sys_clac_formula)
              const now = that._returnTime(sys_clac_formula, nodeCodeObj)
              const max = that._returnTime(max_section_value, nodeCodeObj)
              const min = that._returnTime(min_section_value, nodeCodeObj)
              const { status, maxMinText } = that._isError(max, min, now, order_time, deliver_date)
              node.first_plant_enddate = now
              node.item_node_change.change_plan_time = now
              node.item_node_change.change_remaark = status ? `${nodeName} 节点变更后，重新计算` : ''
              node.max_plant_enddate = max
              node.min_plant_enddate = min
              node.error = status
              node.maxMinText = maxMinText
            }
          }
        }
      } else {
        /* ----- 还原：根据当前节点计算其他节点 ----- */
        for (const x in item) {
          const node = item[x]
          if (node instanceof Object && (node.node_id || node.node_code) && x !== nodeId) { // 其他节点
            const { sys_clac_formula } = node
            if (sys_clac_formula.indexOf('${' + node_code + '}') > -1) { // 引用了此节点
              /* 寻找原始数据 */
              item.nodeTemplateMapList.forEach(function (oldData) {
                if (node.node_id === oldData.node_id) {
                  const { first_plant_enddate, max_plant_enddate, min_plant_enddate, error, maxMinText } = oldData
                  node.first_plant_enddate = first_plant_enddate
                  node.item_node_change.change_plan_time = ''
                  node.item_node_change.change_remaark = ''
                  node.max_plant_enddate = max_plant_enddate
                  node.min_plant_enddate = min_plant_enddate
                  node.error = error
                  node.maxMinText = maxMinText
                }
              })
            }
          }
        }
      }
    } else {
      /* 不需要计算的项目：初始化 */
      const { nodeTemplateMapList } = item
      // console.log('初始化 ----- ', nodeTemplateMapList)
      nodeTemplateMapList.forEach(function (node) {
        const { node_id, max_plant_enddate, min_plant_enddate, first_plant_enddate = '', submit_type } = node
        if (!item[node_id]) {
          const { status, maxMinText } = that._isError(max_plant_enddate, min_plant_enddate, first_plant_enddate, order_time, deliver_date)
          node.first_plant_enddate = first_plant_enddate
          node.oldTime = first_plant_enddate
          node.error = status
          node.maxMinText = maxMinText
          /* 临时标记：计算不出的节点，用input */
          if (first_plant_enddate === '' && submit_type === 1) {
            node.otherType = 1
          }
          /* 赋值 */
          item[node_id] = Object.assign({}, node)
        }
      })
    }
    /* --- 拆分成两条数据 --- */
    const obj_1 = { index: index * 2 } // 计划完成
    for (const x in item) {
      if (item[x] instanceof Object && (item[x].node_id || item[x].node_code)) {
        obj_1[x] = Object.assign({}, item[x])
      } else {
        obj_1[x] = item[x]
      }
    }
    arr.push(obj_1)
    const obj_2 = Object.assign({}, item, { index: index * 2 + 1 }) // 本次调整
    arr.push(obj_2)
  })
  return arr
}

/**
 * [验证 && 整理：提交用的数据]
 * @page 第二页
 * @param {[Array]} list  数据
 * @param {[Array]} nodes 节点
 */
Tool.submitProving = function (list = [], nodes = []) {
  const idArr = [] //    提交用
  const datalist = [] // 提交用
  const nameObj = {} //  报错用
  const nodeNameObj = {} //  节点对象 { 节点ID: 节点名称 }
  /* 提取：节点名称 */
  nodes.forEach(function (item) {
    nodeNameObj[item.node_id] = item.node_name
  })
  /* 循环数据 */
  list.forEach(function (item) {
    /* 基础数据 */
    const { node_template_id, item_id, item_name, item_gantt_id = '', p_item_gantt_id = '', system_material_statistics_id = '', plant_id = '' } = item
    const data = { node_template_id, item_id, item_gantt_id, p_item_gantt_id, system_material_statistics_id, plant_id, nodedatalist: [] }
    /* 记录：项目ID */
    idArr.push(item_id)
    /* 提取：表格数据 */
    for (const x in item) {
      const node = item[x]
      if (node instanceof Object && (node.node_id || node.node_code)) {
        const { oldTime, error, node_id, first_plant_enddate, node_template_detail_id, min_plant_enddate, max_plant_enddate, business_post_id = '', node_charge_person = '', item_node_change } = node
        const nodeData = { node_id, first_plant_enddate, node_template_detail_id, min_plant_enddate, max_plant_enddate, item_team_id: business_post_id, node_charge_person, item_node_change }
        if ((error && !item_node_change.change_remaark) || !first_plant_enddate) {
          /* (报错 && 没写异常原因) || 没填时间 */
          if (!nameObj[item_id]) {
            nameObj[item_id] = { name: item_name, arr: [] }
          }
          if (nodeNameObj[node_id]) {
            nameObj[item_id].arr.push(nodeNameObj[node_id])
          }
        } else {
          /* 添加数据 */
          const { change_remaark } = item_node_change
          const is_change = 1
          const change_plan_time = first_plant_enddate
          nodeData.item_node_change = Object.assign({}, { frist_plan_time: oldTime, abnormal_reason: '', change_remaark, is_change, change_plan_time })
          data.nodedatalist.push(nodeData)
        }
      }
    }
    if (data.nodedatalist.length) {
      datalist.push(data)
    }
  })
  const itemids = idArr.join(',')
  return { itemids, datalist, nameObj }
}

/** --------------------------- 工具方法 --------------------------- **/

/**
 * [公式 转 时间]
 * @param {[String]} str         公式
 * @param {[Object]} nodeCodeObj 当前项目的节点值 { ${变量}: 自身时间 }
 */
Tool._returnTime = function (str = '', nodeCodeObj = {}) {
  const numStr = str.replace(/\$\{[\w-_:/]+\}/g, function (name) {
    return nodeCodeObj[name] ? new Date(nodeCodeObj[name]).getTime() : 0
  }).replace(/[0-9]+/g, function (num, index) {
    if (num.length < 13) {
      let isChange = true
      let beforeStr = ''
      let afterStr = ''
      let numStr = 0
      if (index !== 0) {
        beforeStr = str[index - 1]
      }
      if (index + num.length !== str.length) {
        afterStr = str[index + num.length]
      }
      if (beforeStr === '*' || beforeStr === '/' || afterStr === '*' || afterStr === '/') {
        isChange = false
      }
      numStr = num
      if (isChange) {
        numStr = parseInt(numStr) * 60 * 60 * 24 * 1000
      }
      return `${numStr}`
    } else {
      return num
    }
  })
  /* 毫秒数 转 时间 */
  // eslint-disable-next-line
  const timeStr = eval(numStr)
  if (isNaN(timeStr)) {
    return '/'
  } else if (new Date(timeStr).getTime() < new Date('2000-01-01').getTime()) {
    return '/'
  } else {
    const d = new Date(timeStr)
    const year = d.getFullYear()
    const month = d.getMonth() + 1 < 10 ? '0' + (d.getMonth() + 1) : d.getMonth() + 1
    const day = d.getDate() < 10 ? '0' + d.getDate() : d.getDate()
    return `${year}-${month}-${day}`
  }
}
/**
 * [转换：处理时间格式]
 * @param {[String]} time 时间
 */
Tool._toggleTime = function (time) {
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
    let month = (isNaN(parseInt(two)) || two === '0') ? 1 : parseInt(two) // 月 {[Int]}
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
    let day = (isNaN(parseInt(three)) || three === '0') ? 1 : parseInt(three) // 日 {[Int]}
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
}
/**
 * [验证：计划事件是否在区间内]
 * @param {[String]} maxVal       最大值
 * @param {[String]} minVal       最小值
 * @param {[String]} plantVal     计划时间
 * @param {[String]} order_time   下单日期
 * @param {[String]} deliver_date 客人交期
 */
Tool._isError = function (maxVal = '', minVal = '', plantVal = '', order_time = '', deliver_date = '') {
  const max = isNaN(new Date(maxVal).getTime()) ? 0 : new Date(maxVal).getTime() //       最大值
  const min = isNaN(new Date(minVal).getTime()) ? 0 : new Date(minVal).getTime() //       最小值
  const plant = isNaN(new Date(plantVal).getTime()) ? 0 : new Date(plantVal).getTime() // 计划时间
  const order = new Date(order_time).getTime() //                                         下单日期
  const deliver = new Date(deliver_date).getTime() //                                     客人交期
  const countMax = max || deliver
  const countMin = min || order
  const time_1 = this._returnYearMonthDay(countMin)
  const time_2 = this._returnYearMonthDay(countMax)
  const maxMinText = `最早：${time_1 === '1970-01-01' ? '未知' : time_1}，最晚：${time_2 === '1970-01-01' ? '未知' : time_2}` // 提示文字
  /* 返回 */
  if (countMin && countMax && (countMin <= plant && plant <= countMax)) {
    return { status: false, maxMinText }
  } else {
    return { status: true, maxMinText }
  }
}
/**
 * [提取：年月日]
 */
Tool._returnYearMonthDay = function (strOrNum) {
  const d = new Date(strOrNum)
  const year = d.getFullYear()
  const month = d.getMonth() + 1 < 10 ? '0' + (d.getMonth() + 1) : d.getMonth() + 1
  const day = d.getDate() < 10 ? '0' + d.getDate() : d.getDate()
  return `${year}-${month}-${day}`
}

export default Tool
