// 接口

import Axios from '@/config/axios'

/**
 * [服务器地址]
 */
/* 开发环境 */
// const host = '/api/'
/* 生产环境 */
const host = window.location.origin + '/nova/'

/**
 * [接口地址]
 */
const url = {
  '初始化数据': 'itemGanttSummaryShowAction.ndo?action=getItemNodeTemple',
  '下一步': 'itemGanttSummaryShowAction.ndo?action=generateItemGanttSummary',
  '保存': 'itemGanttSummarySaveAction.ndo?action=itemCustomNode'
}

const request = function (param) {
  param.path = host + url[param.name]
  Axios(param)
}

export default request
