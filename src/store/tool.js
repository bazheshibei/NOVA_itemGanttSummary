
// import { Message } from 'element-ui'

const Tool = {}

/**
 * [返回：datalist]
 * @page 第一页
 */
Tool.returnDatalist = function (list = [], nodeList = []) {
  const that = this
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
      const { is_quote, first_plant_enddate, node_id } = data
      if (is_quote === 1 && !first_plant_enddate) {
        /* 报错：被引用 && 空值 */
        if (!errorObj[item_name]) {
          errorObj[item_name] = []
        }
        errorObj[item_name].push(nodeObj[node_id])
      } else if (is_quote === 0 && (!first_plant_enddate || (first_plant_enddate !== '/' && isNaN(new Date(that._toggleTime(first_plant_enddate)).getTime())))) {
        /* 报错：没引用 && (空值 || (不是'/' && 不是时间格式)) */
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
 * @param {[Array]} list 原始数据
 */
Tool.next_list = function (list = [], isComputed_2, state) {
  const that = this
  const arr = []
  if (isComputed_2) {
    list.forEach(function (item, index) {
      const { order_time, deliver_date } = item // 下单日期，客人交期
      let nodeCodeObj = {} // 当前项目的节点值 { ${变量}: 自身时间 }
      /* --- 处理节点数据 --- */
      item.nodeTemplateMapList.map(function (node, nodeIndex) {
        const data = item[node.node_id] ? item[node.node_id] : node
        const { first_plant_enddate, max_plant_enddate, min_plant_enddate } = data
        const now = that._toggleTime(first_plant_enddate)
        /* 提取：nodeCodeObj */
        nodeCodeObj['${' + data.node_code + '}'] = now
        /* 转换：处理时间格式 */
        data.first_plant_enddate = now
        /** 验证：计划事件是否在区间内 **/
        data.error = that._isError(max_plant_enddate, min_plant_enddate, now, order_time, deliver_date).status
        /* 正常数据：置空异常原因 */
        data.item_node_change.abnormal_reason = data.error ? data.item_node_change.abnormal_reason : ''
        /* 提取 */
        item[data.node_id] = Object.assign({}, data)
      })
      /* 合并其他变量值 */
      nodeCodeObj = Object.assign({}, item.clacNodeMap, nodeCodeObj)
      /* 重新计算：最大值、最小值 */
      item.nodeTemplateMapList.map(function (node) {
        const { max_section_value, min_section_value, node_id } = node
        /** 公式 转 时间 **/
        const max = that._returnTime(max_section_value, nodeCodeObj) || deliver_date
        const min = that._returnTime(min_section_value, nodeCodeObj) || order_time
        item[node_id].max_plant_enddate = max
        item[node_id].min_plant_enddate = min
        item[node_id].maxMinText = `最早：${min}，最晚：${max}`
      })
      /* --- 拆分成两条数据 --- */
      const obj_1 = Object.assign({}, item, { index: index * 2 }) //     计划完成
      arr.push(obj_1)
      const obj_2 = Object.assign({}, item, { index: index * 2 + 1 }) // 本次调整
      arr.push(obj_2)
    })
    return arr
  } else {
    return list
  }
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
  console.log('xxxxx ----- ', list)
  list.forEach(function (item) {
    /* 基础数据 */
    const { node_template_id, item_id, item_name, item_gantt_id = '', p_item_gantt_id = '', system_material_statistics_id = '', plant_id = '' } = item
    const data = { node_template_id, item_id, item_gantt_id, p_item_gantt_id, system_material_statistics_id, plant_id, nodedatalist: [] }
    /* 记录：项目ID */
    idArr.push(item_id)
    /* 提取：原始节点数据 */
    const nodeObj = {}
    item.nodeList_0.forEach(function (val_0) {
      nodeObj[val_0.node_id] = val_0
    })
    /* 提取：表格数据 */
    for (const x in item) {
      const val = item[x]
      if (val instanceof Object && val.node_id) {
        const { error, node_id, first_plant_enddate, node_template_detail_id, min_plant_enddate, max_plant_enddate, item_team_id = '', node_charge_person = '', item_node_change } = val
        const nodeData = { node_id, first_plant_enddate, node_template_detail_id, min_plant_enddate, max_plant_enddate, item_team_id, node_charge_person, item_node_change }
        if (!error && first_plant_enddate === nodeObj[node_id].first_plant_enddate) {
          /* 没报错 && 调整后时间 === 原始时间 */
        } else if (error && !item_node_change.abnormal_reason) {
          /* 报错 && 没写异常原因 */
          if (!nameObj[item_id]) {
            nameObj[item_id] = { name: item_name, arr: [] }
          }
          nameObj[item_id].arr.push(nodeNameObj[node_id])
        } else {
          /* 添加数据 */
          const frist_plan_time = nodeObj[node_id].first_plant_enddate
          const { abnormal_reason } = item_node_change
          const is_change = 1
          const change_plan_time = first_plant_enddate
          nodeData.item_node_change = Object.assign({}, { frist_plan_time, abnormal_reason, is_change, change_plan_time })
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

/**
 * [公式 转 时间]
 * @param {[String]} str         公式
 * @param {[Object]} nodeCodeObj 当前项目的节点值 { ${变量}: 自身时间 }
 */
Tool._returnTime = function (str = '', nodeCodeObj = {}) {
  /* 替换：变量、常量 */
  const numStr = str.replace(/[0-9]+/g, function (num) {
    return parseInt(num) * 60 * 60 * 24 * 1000
  }).replace(/\$\{[\w-_:/]+\}/g, function (name) {
    return nodeCodeObj[name] ? new Date(nodeCodeObj[name]).getTime() : 0
  })
  /* 毫秒数 转 时间 */
  // eslint-disable-next-line
  const timeStr = eval(numStr)
  if (isNaN(timeStr)) {
    return ''
  } else if (new Date(timeStr).getTime() < new Date('2000-01-01').getTime()) {
    return ''
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
}
/**
 * [验证：计划事件是否在区间内]
 * @param {[String]} maxVal       最大值
 * @param {[String]} minVal       最小值
 * @param {[String]} plantVal     计划时间
 * @param {[String]} order_time   下单日期
 * @param {[String]} deliver_date 交货日期
 */
Tool._isError = function (maxVal = '', minVal = '', plantVal = '', order_time = '', deliver_date = '') {
  const max = isNaN(new Date(maxVal).getTime()) ? 0 : new Date(maxVal).getTime() //       最大值
  const min = isNaN(new Date(minVal).getTime()) ? 0 : new Date(minVal).getTime() //       最小值
  const plant = isNaN(new Date(plantVal).getTime()) ? 0 : new Date(plantVal).getTime() // 计划时间
  const order = new Date(order_time).getTime() //                                         下单日期
  const deliver = new Date(deliver_date).getTime() //                                     交货日期
  const num_1 = min || order //   边界值：最小
  const num_2 = max || deliver // 边界值：最大
  const time_1 = this._returnYearMonthDay(num_1)
  const time_2 = this._returnYearMonthDay(num_2)
  if (num_1 && num_2 && (num_1 <= plant && plant <= num_2)) {
    return { status: false, maxMinText: `最早：${time_1}，最晚：${time_2}` }
  } else {
    return { status: true, maxMinText: `最早：${time_1}，最晚：${time_2}` }
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
