
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
    const { deliver_date, itemInformation, item_gantt_id, item_id, item_name, node_template_id, order_time, style_id, nodeTemplateMapList, material_describe, kf_receive_material_time, matter_release_time, kf_order_time } = item
    const obj = { deliver_date, itemInformation, item_gantt_id, item_id, item_name, node_template_id, order_time, style_id, material_describe, kf_receive_material_time, matter_release_time, kf_order_time, nodedatalist: [] }
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
      data.is_adjustment = 1 // 是否手动修改过
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
 * @param {[]}        pageTitle     '大货', '面料', '开发'
 */
Tool.next_list = function (list = [], isComputed_2, changeIndexId, pageTitle) {
  const that = this
  const arr = []
  const [itemIndex, nodeId, nodeName] = changeIndexId.split('_') // 项目索引， 节点ID
  list.forEach(function (item, index) {
    const { matter_release_time = '', kf_order_time = '' } = item // { 面料下达日期, 款式图下达日期 }
    let { order_time = '', deliver_date = '' } = item //             { 下单日期, 客人交期 }
    if (pageTitle === '面料') { /* 面料页面赋值 */
      order_time = matter_release_time
      deliver_date = ''
    } else if (pageTitle === '开发') { /* 开发页面赋值 */
      order_time = kf_order_time
      deliver_date = ''
    }
    /**/
    if (index === parseInt(itemIndex) && isComputed_2) {
      /* 需要计算的项目 */
      const { node_code, node_content_type, isComputedOther } = item[nodeId] // 改变的：code, 节点类型, 是否根据当前节点的时间去计算其他节点
      if (isComputedOther && node_content_type === 'time') {
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
            // node.item_node_change.change_remaark = (status || otherType === 1) ? node.item_node_change.change_remaark : ''
            node.error = (node.node_content_type === 'content') ? false : status
            node.maxMinText = maxMinText
            nodeCodeObj['${' + node_code + '}'] = first_plant_enddate
            break
          }
        }
        for (const x in item) {
          const node = item[x]
          if (node instanceof Object && (node.node_id || node.node_code) && x !== nodeId) { // 其他节点
            /* 引用到此节点的其他节点：重新计算 */
            const { sys_clac_formula, max_section_value, min_section_value, submit_type, first_plant_enddate } = node
            const proving_1 = sys_clac_formula.indexOf('${' + node_code + '}') > -1 //  引用了此节点：自身公式
            const proving_2 = max_section_value.indexOf('${' + node_code + '}') > -1 // 引用了此节点：最大值公式
            const proving_3 = min_section_value.indexOf('${' + node_code + '}') > -1 // 引用了此节点：最小值公式
            if (proving_1 || proving_2 || proving_3) {
              const now = that._returnTime(sys_clac_formula, nodeCodeObj)
              const max = that._returnTime(max_section_value, nodeCodeObj)
              const min = that._returnTime(min_section_value, nodeCodeObj)
              const { status, maxMinText, show_1, show_2 } = that._isError(max, min, now, order_time, deliver_date)
              node.min_plant_enddate = show_1
              node.max_plant_enddate = show_2
              node.maxMinText = maxMinText
              if (proving_1 && first_plant_enddate !== '/') { // 引用了此节点 && 当前节点不是'/'
                node.first_plant_enddate = now
                node.item_node_change.change_plan_time = status ? now : ''
                // node.item_node_change.change_remaark = status ? `${nodeName} 节点变更后，重新计算` : ''
                node.item_node_change.change_remaark = `${nodeName} 节点变更后，重新计算`
                node.error = (node.node_content_type === 'content') ? false : status
                if (now === '' && String(submit_type) === '1') { // 时间 === '' && 系统计算
                  node.otherType = 1
                } else {
                  node.otherType = 0
                }
              }
              item[x] = Object.assign({}, node)
            }
          }
        }
        item = Object.assign({}, item)
      } else if (!isComputedOther && node_content_type === 'time') {
        /* ----- 还原：根据当前节点计算其他节点 ----- */
        for (const x in item) {
          const node = item[x]
          if (node instanceof Object && (node.node_id || node.node_code) && x !== nodeId) { // 其他节点
            const { sys_clac_formula } = node
            if (sys_clac_formula.indexOf('${' + node_code + '}') > -1) { // 引用了此节点
              /* 寻找原始数据 */
              item.nodeTemplateMapList.forEach(function (oldData) {
                if (node.node_id === oldData.node_id) {
                  const { first_plant_enddate, max_plant_enddate, min_plant_enddate, error, maxMinText, submit_type } = oldData
                  node.first_plant_enddate = first_plant_enddate
                  node.item_node_change.change_plan_time = ''
                  node.item_node_change.change_remaark = ''
                  node.max_plant_enddate = max_plant_enddate
                  node.min_plant_enddate = min_plant_enddate
                  node.error = error
                  node.maxMinText = maxMinText
                  if (first_plant_enddate === '' && String(submit_type) === '1') { // 节点计划完成时间 === '' && 系统计算
                    node.otherType = 1
                  } else {
                    node.otherType = 0
                  }
                }
              })
            }
          }
        }
      }
    } else {
      /* 不需要计算的项目：初始化 */
      const { nodeTemplateMapList } = item
      nodeTemplateMapList.forEach(function (node) {
        const { node_id, max_plant_enddate, min_plant_enddate, first_plant_enddate = '', submit_type } = node
        if (!item[node_id]) {
          /* 公式初始化：公式有可能为 null */
          node.sys_clac_formula = node.sys_clac_formula === null ? '' : node.sys_clac_formula
          node.max_section_value = node.max_section_value === null ? '' : node.max_section_value
          node.min_section_value = node.min_section_value === null ? '' : node.min_section_value
          /* 计算 */
          const { status, maxMinText, show_1, show_2 } = that._isError(max_plant_enddate, min_plant_enddate, first_plant_enddate, order_time, deliver_date)
          node.min_plant_enddate = show_1
          node.max_plant_enddate = show_2
          node.first_plant_enddate = first_plant_enddate
          node.oldTime = first_plant_enddate
          node.error = (node.node_content_type === 'content') ? false : status
          node.maxMinText = maxMinText
          /* 临时标记：计算不出的节点，用input */
          if (first_plant_enddate === '' && String(submit_type) === '1') { // 节点计划完成时间 === '' && 系统计算
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
Tool.submitProving = function (list = [], nodes = [], pageTitle) {
  const idArr = [] //    提交用
  const datalist = [] // 提交用
  const errorObj = {} //  报错用
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
    data.gantt_type = 1
    if (pageTitle === '面料') {
      data.gantt_type = 5
    } else if (pageTitle === '开发') {
      data.gantt_type = 4
    }
    /* 记录：项目ID */
    idArr.push(item_id)
    /* 提取：表格数据 */
    for (const x in item) {
      const node = item[x]
      if (node instanceof Object && (node.node_id || node.node_code)) {
        const { node_content_type, otherType, oldTime, error, node_id, first_plant_enddate, node_template_detail_id, min_plant_enddate, max_plant_enddate, business_post_id = '', node_charge_person = '', item_node_change } = node
        const nodeData = { node_id, node_content_type, first_plant_enddate: oldTime, node_template_detail_id, min_plant_enddate, max_plant_enddate, item_team_id: business_post_id, node_charge_person, item_node_change }
        const err_1 = node_content_type === 'time' && (error || otherType === 1) && !item_node_change.change_remaark // 报错：时间节点 && (报错 || 系统计算算不出时间) && 没写异常原因
        const err_2 = !first_plant_enddate //                                                                           报错：没填时间
        if (err_1 || err_2) {
          if (!errorObj[item_id]) {
            errorObj[item_id] = { name: item_name, arr: [] }
          }
          if (nodeNameObj[node_id]) {
            errorObj[item_id].arr.push(nodeNameObj[node_id])
          }
        } else {
          /* 添加数据 */
          const { change_remaark, is_change } = item_node_change
          let is_adjustment = 0 // 是否手动修改过
          nodeData.item_node_change = {}
          if (first_plant_enddate !== oldTime) {
            is_adjustment = 1
            nodeData.item_node_change = Object.assign({}, { frist_plan_time: oldTime, abnormal_reason: '', change_remaark, is_change, change_plan_time: first_plant_enddate })
          }
          nodeData.is_adjustment = is_adjustment
          data.nodedatalist.push(nodeData)
        }
      }
    }
    if (data.nodedatalist.length) {
      datalist.push(data)
    }
  })
  const itemids = idArr.join(',')
  return { itemids, datalist, errorObj }
}

/** --------------------------- 工具方法 --------------------------- **/

/**
 * [公式 转 时间]
 * @param {[String]} str         公式
 * @param {[Object]} nodeCodeObj 当前项目的节点值 { ${变量}: 自身时间 }
 */
Tool._returnTime = function (str = '', nodeCodeObj = {}) {
  const asd = str.replace(/\$\{[\w-_:/]+\}/g, function (name) {
    return nodeCodeObj[name] ? new Date(nodeCodeObj[name]).getTime() : 'xxx'
  })
  const numStr = asd.replace(/[0-9]+/g, function (num, index) {
    if (num.length < 13) {
      let isChange = true
      let beforeStr = ''
      let afterStr = ''
      let numStr = 0
      if (index !== 0) {
        beforeStr = asd[index - 1]
      }
      if (index + num.length !== asd.length) {
        afterStr = asd[index + num.length]
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
  try {
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
  } catch (err) {
    return ''
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
    let day = (isNaN(parseInt(three)) || Number(three) === 0) ? 1 : parseInt(three) // 日 {[Int]}
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
  const max = isNaN(new Date(maxVal).getTime()) ? 0 : new Date(maxVal).getTime() //                 最大值
  const min = isNaN(new Date(minVal).getTime()) ? 0 : new Date(minVal).getTime() //                 最小值
  const plant = isNaN(new Date(plantVal).getTime()) ? 0 : new Date(plantVal).getTime() //           计划时间
  const order = isNaN(new Date(order_time).getTime()) ? 0 : new Date(order_time).getTime() //       下单日期
  const deliver = isNaN(new Date(deliver_date).getTime()) ? 0 : new Date(deliver_date).getTime() // 客人交期
  const countMax = deliver && deliver <= max ? deliver : max
  const countMin = order && min <= order ? order : min
  const time_1 = this._returnYearMonthDay(countMin)
  const time_2 = this._returnYearMonthDay(countMax)
  const alert_1 = time_1 === '1970-01-01' ? '未知' : time_1 // 提示文字：最小值
  const alert_2 = time_2 === '1970-01-01' ? '未知' : time_2 // 提示文字：最大值
  const show_1 = time_1 === '1970-01-01' ? '' : time_1 //     展示时间：最小值
  const show_2 = time_2 === '1970-01-01' ? '' : time_2 //     展示时间：最大值
  const maxMinText = `最早：${alert_1}，最晚：${alert_2}`
  /* 返回 */
  if (countMin && countMax && (countMin <= plant && plant <= countMax)) { // 在区间内
    return { status: false, maxMinText, show_1, show_2 }
  } else if (countMin && !countMax && countMin <= plant) { //                只有最小值 && 大于最小值
    return { status: false, maxMinText, show_1, show_2 }
  } else if (!countMin && countMax && plant <= countMax) { //                只有最大值 && 小于最大值
    return { status: false, maxMinText, show_1, show_2 }
  } else {
    return { status: true, maxMinText, show_1, show_2 }
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
