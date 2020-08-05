
import { Message } from 'element-ui'

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
  let isSubmit = true
  list.forEach(function (item, index) {
    let nodeCodeObj = {} // 当前项目的节点值 { ${变量}: 自身时间 }
    /* --- 处理节点数据 --- */
    item.nodeTemplateMapList.map(function (node) {
      /* 验证：是否可清空 */
      if (!node.first_plant_enddate) {
        /** 报错：用到此节点 **/
        const { status, time, name } = that._isUsed(list[index].nodeList_0, node.node_code)
        if (status) {
          Message({ showClose: true, message: `此节点已被 ${name} 引用，请勿置空`, type: 'warning' })
          node.first_plant_enddate = time
          isSubmit = false
        }
      }
      /* 验证：弹出层，是否可保存 */
      const { frist_plan_time, abnormal_reason, is_change, change_plan_time } = node.item_node_change
      if (frist_plan_time) {
        /* 报错：没写'调整/异常原因 后再保存' */
        if (!abnormal_reason) {
          Message({ showClose: true, message: '请填写 调整/异常原因 后再保存', type: 'warning' })
          isSubmit = false
        }
        /* 报错：变更，没选调整后日期 */
        if (is_change === 1 && !change_plan_time) {
          Message({ showClose: true, message: '请选择 调整后日期 后再保存', type: 'warning' })
          isSubmit = false
        }
        /* 报错：系统计算日期 === 调整后日期 */
        if (frist_plan_time === change_plan_time) {
          Message({ showClose: true, message: '系统计算日期 不能等于 调整后日期', type: 'warning' })
          isSubmit = false
        }
        /* 还原：系统计算日期 */
        if (!isSubmit) {
          let time = ''
          for (let i = 0; i < list[index].nodeList_0.length; i++) {
            const data = list[index].nodeList_0[i]
            if (data.node_id === node.node_id) {
              time = data.first_plant_enddate
            }
          }
          node.first_plant_enddate = time
        }
      }
      /* 提取：nodeCodeObj */
      nodeCodeObj['${' + node.node_code + '}'] = node.first_plant_enddate
      /* 转换：处理时间格式 */
      node.first_plant_enddate = isComputed_2 ? that._toggleTime(node.first_plant_enddate) : node.first_plant_enddate
      /** 验证：计划事件是否在区间内 **/
      node.error = that._isError(node.max_plant_enddate, node.min_plant_enddate, node.first_plant_enddate)
      /* 正常数据：置空异常原因 */
      node.item_node_change.abnormal_reason = node.error ? node.item_node_change.abnormal_reason : ''
      /* 提取 */
      item[node.node_id] = node // Object.assign({}, node) 的话，双向绑定改变 item[node.node_id] 中的独立值，不会触发计算属性。node 的话会改变 nodeTemplateMapList 下的引用属性
    })
    /* 合并其他变量值 */
    nodeCodeObj = Object.assign({}, item.clacNodeMap, nodeCodeObj)
    /* 重新计算：最大值、最小值 */
    item.nodeTemplateMapList.map(function (node) {
      const { max_section_value, min_section_value, node_id } = node
      /** 公式 转 时间 **/
      const max = that._returnTime(max_section_value, nodeCodeObj)
      const min = that._returnTime(min_section_value, nodeCodeObj)
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
  state.isSubmit = isSubmit
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
    /* 提取：原始节点数据 */
    const nodeObj = {}
    item.nodeList_0.forEach(function (val_0) {
      nodeObj[val_0.node_id] = val_0
    })
    /* 提取：表格数据 */
    item.nodeTemplateMapList.forEach(function (val) {
      const { isProving = false, error, node_id, first_plant_enddate, node_template_detail_id, min_plant_enddate, max_plant_enddate, item_team_id = '', node_charge_person = '', item_node_change } = val
      const nodeData = { node_id, first_plant_enddate, node_template_detail_id, min_plant_enddate, max_plant_enddate, item_team_id, node_charge_person, item_node_change }
      if (isProving) {
        /* 通过弹出层验证过的节点 */
        data.nodedatalist.push(nodeData)
      } else {
        if (first_plant_enddate && first_plant_enddate === nodeObj[node_id].first_plant_enddate) {
          /* timePicker 手动修改的节点：没变更 */
          nodeData.item_node_change = Object.assign({}, { frist_plan_time: '', abnormal_reason: '', is_change: 0, change_plan_time: '' })
          data.nodedatalist.push(nodeData)
        } else {
          /* timePicker 手动修改的节点：变更 */
          const frist_plan_time = nodeObj[node_id].first_plant_enddate
          const { abnormal_reason } = item_node_change
          const is_change = 1
          const change_plan_time = first_plant_enddate
          nodeData.item_node_change = Object.assign({}, { frist_plan_time, abnormal_reason, is_change, change_plan_time })
          data.nodedatalist.push(nodeData)
          /* 异常处理：异常 && 没写异常原因 */
          if (error && !abnormal_reason) {
            if (!nameObj[item_id]) {
              nameObj[item_id] = { name: item_name, arr: [] }
            }
            nameObj[item_id].arr.push(nodeNameObj[node_id])
          }
        }
      }
    })
    datalist.push(data)
  })
  const itemids = idArr.join(',')
  return { itemids, datalist, nameObj }
}

/**
 * [公式 转 时间]
 * @param {[String]} str         公式
 * @param {[Object]} nodeCodeObj 当前项目的节点值 { ${变量}: 自身时间 }
 */
Tool._returnTime = function (str, nodeCodeObj) {
  /* 替换：变量、常量 */
  const numStr = str.replace(/[0-9]+/g, function (num) {
    return parseInt(num) * 60 * 60 * 24 * 1000
  }).replace(/\$\{[\w-_:/]+\}/g, function (name) {
    return nodeCodeObj[name] ? new Date(nodeCodeObj[name]).getTime() : 0
  })
  /* 毫秒数 转 时间 */
  // eslint-disable-next-line
  const d = new Date(eval(numStr))
  const year = d.getFullYear()
  const month = d.getMonth() + 1 < 10 ? '0' + (d.getMonth() + 1) : d.getMonth() + 1
  const day = d.getDate() < 10 ? '0' + d.getDate() : d.getDate()
  return `${year}-${month}-${day}`
}
/**
 * [转换：处理时间格式]
 * @param {[String]} time 时间
 */
Tool._toggleTime = function (time) {
  if (time) {
    const arr = time.split('-')
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
}
/**
 * [验证：计划事件是否在区间内]
 * @param {[String]} maxVal   最大值
 * @param {[String]} minVal   最小值
 * @param {[String]} plantVal 计划事件
 */
Tool._isError = function (maxVal, minVal, plantVal) {
  const max = new Date(maxVal).getTime()
  const min = new Date(minVal).getTime()
  const plant = new Date(plantVal).getTime()
  if (min <= plant && plant <= max) {
    return false
  } else {
    return true
  }
}
/**
 * [验证：是否用到此节点]
 * @param {[Array]}  nodeList_0 单条原始节点数据
 * @param {[String]} node_code  节点 code
 */
Tool._isUsed = function (nodeList_0 = [], node_code) {
  let status = false
  let time = ''
  const nameArr = []
  nodeList_0.forEach(function (item) {
    /* 是否引用 */
    const { max_section_value, min_section_value, sys_clac_formula } = item // 计算公式：最大值，最小值，自身
    if (item.node_code !== node_code && (max_section_value.indexOf(node_code) > -1 || min_section_value.indexOf(node_code) > -1 || sys_clac_formula.indexOf(node_code) > -1)) {
      status = true
      nameArr.push(item.node_name)
    }
    /* 原始时间 */
    if (item.node_code === node_code) {
      time = item.first_plant_enddate
    }
  })
  return { status, time, name: nameArr.join('、') }
}

export default Tool
