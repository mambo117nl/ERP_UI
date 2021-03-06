import { showNotification } from '@/utils/ADempiere/notification'
import Item from './items'
import { convertFieldListToShareLink } from '@/utils/ADempiere/valueUtil'

export const contextMixin = {
  components: {
    Item
  },
  props: {
    menuParentUuid: {
      type: String,
      default: undefined
    },
    // uuid of the component where it is called
    parentUuid: {
      type: String,
      default: undefined
    },
    // uuid of the component where it is called
    containerUuid: {
      type: String,
      required: true
    },
    panelType: {
      type: String,
      default: undefined
    },
    isReport: {
      type: Boolean,
      default: false
    },
    lastParameter: {
      type: String,
      default: undefined
    },
    reportFormat: {
      type: String,
      default: undefined
    },
    modalMetadata: {
      type: Object,
      default: () => {}
    },
    // used only window
    isInsertRecord: {
      type: Boolean,
      default: undefined
    }
  },
  data() {
    return {
      actions: [],
      references: [],
      file: this.$store.getters.getProcessResult.download,
      downloads: this.$store.getters.getProcessResult.url,
      metadataMenu: {},
      recordUuid: this.$route.query.action,
      isReferencesLoaded: false,
      exportDefault: 'xls'
    }
  },
  computed: {
    activeMenu() {
      const { meta, path } = this.$route
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    },
    getDataSelection() {
      return this.$store.getters.getDataRecordSelection(this.containerUuid)
    },
    relations() {
      if (this.$route.params.menuParentUuid !== undefined) {
        return this.$store.getters.getRelations(this.$route.params.menuParentUuid)
      }
      return this.$store.getters.getRelations(this.menuParentUuid)
    },
    getterContextMenu() {
      return this.$store.getters.getContextMenu(this.containerUuid)
    },
    isReferecesContent() {
      if (this.panelType === 'window' && !this.isEmptyValue(this.recordUuid) && this.recordUuid !== 'create-new') {
        return true
      }
      return false
    },
    getterReferences() {
      if (this.isReferecesContent) {
        return this.$store.getters.getReferencesList(this.parentUuid, this.recordUuid)
      }
      return []
    },
    permissionRoutes() {
      return this.$store.getters.permission_routes
    },
    valuesPanelToShare() {
      return this.$store.getters.getParametersToShare({
        containerUuid: this.containerUuid,
        isOnlyDisplayed: true,
        isAdvancedQuery: this.$route.query.action === 'advancedQuery'
      })
    },
    getterDataLog() {
      if (this.panelType === 'window') {
        return this.$store.getters.getDataLog(this.containerUuid, this.recordUuid)
      }
      return undefined
    },
    processParametersExecuted() {
      return this.$store.getters.getCachedReport(this.$route.params.instanceUuid).parameters
    },
    getterWindowOldRoute() {
      if (this.panelType === 'window') {
        const oldRoute = this.$store.state.windowControl.windowOldRoute
        if (!this.isEmptyValue(oldRoute.query.action) && oldRoute.query.action !== 'create-new' && this.$route.query.action === 'create-new') {
          return oldRoute
        }
      }
      return false
    }
  },
  watch: {
    '$route.query.action'(actionValue) {
      this.recordUuid = actionValue
      // only requires updating the context menu if it is Window
      if (this.panelType === 'window') {
        this.generateContextMenu()
        this.getReferences()
      }
    },
    isInsertRecord(newValue, oldValue) {
      if (this.panelType === 'window' && newValue !== oldValue) {
        this.generateContextMenu()
      }
    },
    getterDataLog(newValue, oldValue) {
      if (this.panelType === 'window' && newValue !== oldValue) {
        this.generateContextMenu()
      }
    }
  },
  created() {
    this.generateContextMenu()
  },
  mounted() {
    this.getReferences()
  },
  methods: {
    showNotification,
    refreshData() {
      if (this.panelType === 'window') {
        this.$store.dispatch('getDataListTab', {
          parentUuid: this.parentUuid,
          containerUuid: this.containerUuid,
          isRefreshPanel: true,
          recordUuid: this.recordUuid
        })
      } else if (this.panelType === 'browser') {
        this.$store.dispatch('getBrowserSearch', {
          containerUuid: this.containerUuid,
          isClearSelection: true
        })
      }
    },
    getReferences() {
      if (this.isReferecesContent) {
        var references = this.getterReferences
        if (references && references.length) {
          this.references = references
          this.isReferencesLoaded = true
        } else {
          this.$store.dispatch('getReferencesListFromServer', {
            parentUuid: this.parentUuid,
            containerUuid: this.containerUuid,
            recordUuid: this.recordUuid
          })
            .then(response => {
              this.references = this.$store.getters.getReferencesList(this.parentUuid, this.recordUuid)
              if (this.references.referencesList.length) {
                this.isReferencesLoaded = true
              } else {
                this.isReferencesLoaded = false
              }
            })
            .catch(error => {
              console.warn('References Load Error ' + error.code + ': ' + error.message)
            })
        }
      } else {
        this.references = []
        this.isReferencesLoaded = false
      }
    },
    exporBrowser() {
      this.$store.dispatch('startProcess', {
        parentUuid: this.parentUuid,
        containerUuid: this.containerUuid,
        panelType: this.panelType, // determinate if get table name and record id (window) or selection (browser)
        reportFormat: this.exportDefault
      })
        .catch(error => {
          console.warn(error)
        })
    },
    generateContextMenu() {
      this.metadataMenu = this.getterContextMenu
      this.actions = this.metadataMenu.actions

      if (this.actions && this.actions.length) {
        this.actions.forEach(itemAction => {
          // if no exists set prop with value
          itemAction.disabled = false
          if (this.$route.name !== 'Report Viewer' && itemAction.action === 'changeParameters') {
            itemAction.disabled = true
          }
          if (this.$route.meta.type === 'report' && itemAction.action === 'startProcess') {
            itemAction.reportExportType = 'html'
          }
          if (this.$route.meta.type === 'process' && itemAction.type === 'summary') {
            itemAction.disabled = true
          }

          if (this.$route.meta.type === 'window') {
            if (this.recordUuid === 'create-new') {
              itemAction.disabled = true
            } else {
              if (this.isInsertRecord) {
                itemAction.disabled = false
              } else {
                itemAction.disabled = true
              }
            }
            if (itemAction.action === 'undoModifyData') {
              itemAction.disabled = Boolean(!this.getterDataLog && !this.getterWindowOldRoute)
            }
          }
        })
      }
    },
    showModal(action) {
      // TODO: Refactor and remove redundant dispatchs
      if (action.type === 'process') {
        var processData = this.$store.getters.getProcess(action.uuid)
        if (processData === undefined) {
          this.$store.dispatch('getProcessFromServer', {
            containerUuid: action.uuid,
            routeToDelete: this.$route
          })
            .then(response => {
              this.$store.dispatch('setShowDialog', {
                type: action.type,
                action: response
              })
            }).catch(error => {
              console.warn('ContextMenu: Dictionary Process (State) - Error ' + error.code + ': ' + error.message)
            })
        } else {
          this.$store.dispatch('setShowDialog', { type: action.type, action: processData })
        }
      } else {
        this.$store.dispatch('setShowDialog', { type: action.type, action: this.modalMetadata })
      }
    },
    runAction(action) {
      if (action.type === 'action') {
        // run process or report
        const fieldNotReady = this.$store.getters.isNotReadyForSubmit(this.$route.meta.uuid)
        if (!fieldNotReady) {
          var containerParams = this.$route.meta.uuid
          if (this.lastParameter !== undefined) {
            containerParams = this.lastParameter
          }

          var parentMenu = this.menuParentUuid
          if (this.$route.params) {
            if (this.$route.params.menuParentUuid) {
              parentMenu = this.$route.params.menuParentUuid
            }
          }
          if (this.panelType === 'process') {
            this.$store.dispatch('setTempShareLink', { processId: this.$route.params.processId, href: window.location.href })
          }
          this.$store.dispatch(action.action, {
            action: action,
            parentUuid: this.containerUuid,
            containerUuid: containerParams, // EVALUATE IF IS action.uuid
            panelType: this.panelType, // determinate if get table name and record id (window) or selection (browser)
            reportFormat: this.$route.query.reportType ? this.$route.query.reportType : action.reportExportType,
            menuParentUuid: parentMenu, // to load relations in context menu (report view)
            routeToDelete: this.$route
          })
            .catch(error => {
              console.warn(error)
            })
          if (this.panelType === 'process') {
            // TODO: Verify use
            this.$store.dispatch('deleteRecordContainer', {
              viewUuid: this.$route
            })
          }
        } else {
          this.showNotification({
            type: 'warning',
            title: this.$t('notifications.emptyValues'),
            name: '<b>' + fieldNotReady.name + '.</b> ',
            message: this.$t('notifications.fieldMandatory')
          })
        }
      } else if (action.type === 'process') {
        // run process associate with view (window or browser)
        this.showModal(action)
        if (this.panelType === 'process' || this.panelType === 'browser' || this.panelType === 'report') {
          this.$store.dispatch('resetPanelToNew', {
            parentUuid: this.parentUuid,
            containerUuid: this.containerUuid,
            panelType: this.panelType
          })
        }
      } else if (action.type === 'dataAction') {
        if (action.action === 'undoModifyData' && Boolean(!this.getterDataLog) && this.getterWindowOldRoute) {
          this.$router.push({
            path: this.getterWindowOldRoute.path,
            query: {
              ...this.getterWindowOldRoute.query
            }
          })
        } else {
          this.$store.dispatch(action.action, {
            parentUuid: this.parentUuid,
            containerUuid: this.containerUuid,
            recordUuid: this.recordUuid,
            panelType: this.panelType,
            isNewRecord: action.action === 'resetPanelToNew'
          })
        }
      } else if (action.type === 'reference') {
        this.$store.dispatch('getWindowByUuid', { routes: this.permissionRoutes, windowUuid: action.windowUuid })
        if (action.windowUuid && action.recordUuid) {
          var windowRoute = this.$store.getters.getWindowRoute(action.windowUuid)
          this.$router.push({ name: windowRoute.name, query: { action: action.type, referenceUuid: action.uuid, tabParent: 0 }})
        }
      }
    },
    setShareLink() {
      var shareLink = this.panelType === 'window' || window.location.href.includes('?') ? `${window.location.href}&` : `${window.location.href}?`
      if (this.$route.name === 'Report Viewer') {
        var processParameters = convertFieldListToShareLink(this.processParametersExecuted)
        var reportFormat = this.$store.getters.getReportType
        shareLink = this.$store.getters.getTempShareLink
        if (String(processParameters).length) {
          shareLink += '?' + processParameters
          shareLink += `&reportType=${reportFormat}`
        }
      } else {
        if (String(this.valuesPanelToShare).length) {
          shareLink += this.valuesPanelToShare
        }
        if (this.$route.query.action && this.$route.query.action !== 'create-new' && this.$route.query.action !== 'reference' && this.$route.query.action !== 'advancedQuery') {
          shareLink = window.location.href
        }
      }
      if (shareLink !== this.$route.fullPath) {
        this.activeClipboard(shareLink)
      }
    },
    fallbackCopyTextToClipboard(text) {
      var textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        var successful = document.execCommand('copy')
        if (successful) {
          var message = this.$t('notifications.copySuccessful')
          this.clipboardMessage(message)
        }
      } catch (err) {
        message = this.$t('notifications.copyUnsuccessful')
        this.clipboardMessage(message)
      }
      document.body.removeChild(textArea)
    },
    activeClipboard(text) {
      if (!navigator.clipboard) {
        this.fallbackCopyTextToClipboard(text)
        return
      }
      navigator.clipboard.writeText(text)
        .then(() => {
          var message = this.$t('notifications.copySuccessful')
          this.clipboardMessage(message)
        })
        .catch(() => {
          var message = this.$t('notifications.copyUnsuccessful')
          this.clipboardMessage(message)
        })
      navigator.clipboard.writeText(text)
    },
    clipboardMessage(message) {
      this.$message({
        message: message,
        type: 'success',
        duration: 1500
      })
    }
  }
}
