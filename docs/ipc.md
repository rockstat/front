

Configuration at dispatcher

    import * as ipc from 'node-ipc';

    sock: string = 'var/alco.sock';


    Object.assign(ipc.config, confugurer.ipcConfig);
    ipc.config.logger = this.log.debug.bind(this.log);


    startIPC() {

      this.log.info('Starting IPC');
      ipc.serve(() => {
        ipc.server.on('message', (data, socket) => {
          ipc.log(data, 'got a message');
        });
      });

      ipc.server.start();
    }



    this.startIPC();
