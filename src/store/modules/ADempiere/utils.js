
const utils = {
  state: {
    width: 0,
    height: 0,
    splitHeight: 50,
    splitHeightTop: 0,
    widthLayout: 0,
    tempShareLink: '',
    oldAction: undefined,
    reportType: ''
  },
  mutations: {
    setWidth(state, width) {
      state.width = width
    },
    setWidthLayout(state, width) {
      state.widthLayout = width
    },
    setHeigth(state, height) {
      state.height = height
    },
    setSplitHeight(state, splitHeight) {
      state.splitHeight = splitHeight
    },
    setSplitHeightTop(state, splitHeightTop) {
      state.splitHeightTop = splitHeightTop
    },
    setTempShareLink(state, payload) {
      state.tempShareLink = payload
    },
    setOldAction(state, payload) {
      state.oldAction = payload
    },
    setReportTypeToShareLink(state, payload) {
      state.reportType = payload
    }
  },
  actions: {
    setWidth({ commit }, width) {
      commit('setWidth', width)
    },
    setWidthLayout({ commit }, width) {
      commit('setWidthLayout', width)
    },
    setHeight({ commit }, height) {
      commit('setHeigth', height)
    },
    setSplitHeight({ commit }, splitHeight) {
      commit('setSplitHeight', splitHeight)
    },
    setSplitHeightTop({ commit }, splitHeightTop) {
      commit('setSplitHeightTop', splitHeightTop)
    },
    changeShowedDetail({ dispatch }, params) {
      if (params.panelType === 'window') {
        dispatch('changeShowedDetailWindow', params)
      } else if (params.panelType === 'browser') {
        dispatch('changeShowedCriteriaBrowser', params)
      }
    },
    setTempShareLink({ commit }, parameters) {
      if (!parameters.href.includes(String(parameters.processId))) {
        commit('setTempShareLink', parameters.href)
      }
    },
    setOldAction({ commit }, value) {
      commit('setOldAction', value)
    },
    setReportTypeToShareLink({ commit }, value) {
      commit('setReportTypeToShareLink', value)
    }
  },
  getters: {
    getWidth: (state) => {
      return state.width
    },
    getWidthLayout: (state, rootGetters) => {
      if (rootGetters.toggleSideBar) {
        return state.width - 250
      }
      return state.width - 54
    },
    getHeigth: (state) => {
      return state.height
    },
    getSplitHeightTop: (state) => {
      return state.getSplitHeightTop
    },
    getSplitHeight: (state) => {
      const split = state.splitHeight
      var panelHeight = 0
      if (split !== 50) {
        panelHeight = split.splitHeight
      } else {
        panelHeight = 50
      }
      return panelHeight
    },
    getTempShareLink: (state) => {
      return state.tempShareLink
    },
    getOldAction: (state) => {
      return state.oldAction
    },
    getReportType: (state) => {
      return state.reportType
    }
  }
}
export default utils
