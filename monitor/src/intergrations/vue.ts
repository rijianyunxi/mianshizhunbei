
import { type TrackerInstance} from '../core/types'

export class VueIntegration {
  public name = 'VueIntegration';
  private app: any;

  constructor(options: { app: any }) {
    this.app = options.app;
  }

  // 核心 SDK 会在内部循环调用所有插件的 setup 方法，并把自己传过来
  setup(coreTrackerInstance:TrackerInstance) {
    // 这里就是我们之前写的 Vue 劫持逻辑
    // this.app.config.errorHandler = (err, instance, info) => {
    //   coreTrackerInstance.captureException(err, {
    //     type: 'vue_error',
    //     tags: { vue_lifecycle: info },
        
    //   });
    // };
  }
}